import { useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { io, Socket } from 'socket.io-client';
import { SOCKET_ORIGIN, SOCKET_PATH } from '../../../../constants/api';
import {
  ChatMessage,
  ConversationSide,
  getConversationsPage,
  getUnreadCount,
} from '../../../../constants/conversationsApi';
import { store } from '../../../../store';
import {
  expireSession,
  getAccessToken,
  getCurrentSessionUser,
  getSessionVersion,
  onSessionChanged,
} from '../../../../utils/api/session';
import { refreshSessionToken } from '../../../../utils/api/request';
import { isNotification, SupplyEdNotification } from '../apis/notificationsApi';
import { refreshNotificationCount } from './useNotifications';
import {
  receiveNotification, refreshNotifications, setNotificationCount,
} from '../store/notificationsSlice';
import {
  refreshChat,
  mergeConversations,
  resetConversations,
  saveMessages,
  setChatConnected,
  setChatError,
  setChatRead,
  setChatTyping,
  setUnread,
} from '../store/conversationsSlice';

let liveSocket: Socket | null = null;

export function sendTyping(conversationId: string, typing: boolean) {
  if (!liveSocket?.connected) return;
  liveSocket.timeout(5000).emit('typing', { conversationId, typing }, () => {});
}

export function useConversationSocket() {
  const [session, setSession] = useState(() => ({
    token: getAccessToken(),
    role: getCurrentSessionUser()?.role,
    version: getSessionVersion(),
  }));
  useEffect(
    () =>
      onSessionChanged(() =>
        setSession({
          token: getAccessToken(),
          role: getCurrentSessionUser()?.role,
          version: getSessionVersion(),
        }),
      ),
    [],
  );
  useEffect(() => {
    store.dispatch(resetConversations());
  }, [session.version]);

  useEffect(() => {
    if (
      !session.token ||
      (!__DEV__ && !SOCKET_ORIGIN.startsWith('https://')) ||
      !['INSTRUCTOR', 'INSTITUTION'].includes(session.role || '')
    )
      return;
    let disposed = false;
    let stopped = false;
    let refreshing = false;
    let loadingInbox = false;
    let inboxAgain = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let connectionNotice: ReturnType<typeof setTimeout> | undefined;
    const socket = io(SOCKET_ORIGIN + '/conversations', {
      path: SOCKET_PATH,
      auth: { token: session.token },
      // Android's native WebSocket adds the API host as Origin by default.
      // The gateway only allows browser origins on its allowlist; native clients
      // use an empty Origin and are still authenticated by their access token.
      ...(Platform.OS === 'android' || Platform.OS === 'ios'
        ? { extraHeaders: { Origin: '' } }
        : {}),
      transports: ['websocket', 'polling'],
      // Mobile networks can block WebSocket while ordinary HTTP still works.
      tryAllTransports: true,
      autoConnect: false,
      reconnection: true,
      reconnectionDelayMax: 10000,
    });
    liveSocket = socket;
    const dispatch = store.dispatch;
    const active = () =>
      !disposed &&
      getSessionVersion() === session.version &&
      AppState.currentState === 'active';

    function refreshNotificationInbox() {
      if (!active()) return;
      dispatch(refreshNotifications());
      refreshNotificationCount().catch(() => {
        // The inbox provides its own retry state; keep the last known badge.
      });
    }

    function showConnectionNotice() {
      clearTimeout(connectionNotice);
      connectionNotice = setTimeout(() => {
        if (active() && !store.getState().conversations.connected)
          dispatch(
            setChatError(
              'Live updates are reconnecting. Messages refresh automatically.',
            ),
          );
      }, 5000);
    }

    async function refreshInbox() {
      if (!active()) return;
      if (loadingInbox) {
        inboxAgain = true;
        return;
      }
      loadingInbox = true;
      try {
        const [page, unread] = await Promise.all([
          getConversationsPage(),
          getUnreadCount(),
        ]);
        if (!active()) return;
        dispatch(mergeConversations(page.conversations));
        dispatch(setUnread(unread.total));
      } catch {
        if (active()) dispatch(setChatError('Unable to refresh messages. Open Messages to retry.'));
      } finally {
        loadingInbox = false;
        if (inboxAgain) {
          inboxAgain = false;
          refreshInbox();
        }
      }
    }

    async function renewToken() {
      if (refreshing || disposed) return;
      refreshing = true;
      socket.disconnect();
      try {
        await refreshSessionToken();
        // The session listener reconnects with the newly saved token.
      } catch {
        if (!disposed)
          dispatch(
            setChatError(
              'Live updates are unavailable. Refresh or sign in again.',
            ),
          );
      } finally {
        refreshing = false;
      }
    }

    socket.on('ready', () => {
      if (!active()) return;
      clearTimeout(connectionNotice);
      dispatch(setChatConnected(true));
      dispatch(setChatError(''));
      dispatch(refreshChat());
      refreshInbox();
      refreshNotificationInbox();
    });
    socket.on('notification', (event: {
      notification: SupplyEdNotification; unreadCount: number;
    }) => {
      if (!active() || !event || !isNotification(event.notification) ||
          !Number.isInteger(event.unreadCount) || event.unreadCount < 0) return;
      dispatch(receiveNotification(event));
    });
    socket.on('notification:count', (event: { unreadCount: number }) => {
      if (!active() || !event || !Number.isInteger(event.unreadCount) || event.unreadCount < 0) return;
      dispatch(setNotificationCount(event.unreadCount));
      dispatch(refreshNotifications());
    });
    socket.on('disconnect', reason => {
      dispatch(setChatConnected(false));
      if (!active() || refreshing || stopped) return;
      showConnectionNotice();
      // Socket.IO does not retry a server-initiated disconnect by itself.
      if (reason === 'io server disconnect') {
        clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(() => {
          if (active() && !stopped && !refreshing) socket.connect();
        }, 2000);
      }
    });
    socket.on(
      'message',
      (event: { conversationId: string; message: ChatMessage }) => {
        if (!active()) return;
        dispatch(
          saveMessages({ id: event.conversationId, messages: [event.message] }),
        );
        dispatch(refreshChat());
        refreshInbox();
      },
    );
    socket.on(
      'read',
      (event: {
        conversationId: string;
        side: ConversationSide;
        readAt: string;
      }) => {
        if (!active()) return;
        dispatch(setChatRead(event));
        refreshInbox();
      },
    );
    socket.on(
      'typing',
      (event: {
        conversationId: string;
        side: ConversationSide;
        typing: boolean;
      }) => { if (active()) dispatch(setChatTyping(event)); },
    );
    socket.on('auth:expired', (event: { code: string }) => {
      if (!active()) return;
      if (event.code === 'INVALID_ACCESS_TOKEN') expireSession();
      else renewToken();
    });
    socket.on('connect_error', error => {
      if (!active()) return;
      const code =
        (error as Error & { data?: { code?: string } }).data?.code ||
        error.message;
      dispatch(setChatConnected(false));
      if (code === 'ACCESS_TOKEN_EXPIRED') {
        renewToken();
        return;
      }
      if (['AUTH_TOKEN_MISSING', 'INVALID_ACCESS_TOKEN'].includes(code)) {
        expireSession();
        return;
      }
      if (
        [
          'ROLE_NOT_ALLOWED',
          'ORIGIN_NOT_ALLOWED',
          'NAMESPACE_UNKNOWN',
          'TOO_MANY_CONNECTIONS',
        ].includes(code)
      ) {
        stopped = true;
        socket.disconnect();
      }
      dispatch(
        setChatError(
          'Live updates are unavailable. Messages will refresh automatically.',
        ),
      );
      if (__DEV__) console.warn('Chat connection failed:', code);
    });
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        if (!stopped) socket.connect();
        if (!stopped) showConnectionNotice();
        dispatch(refreshChat());
        refreshInbox();
        refreshNotificationInbox();
      } else {
        clearTimeout(connectionNotice);
        clearTimeout(reconnectTimer);
        socket.disconnect();
      }
    });
    if (active()) {
      socket.connect();
      showConnectionNotice();
      refreshInbox();
      refreshNotificationInbox();
    }
    const poll = setInterval(() => {
      if (!socket.connected) {
        refreshInbox();
        refreshNotificationInbox();
      }
    }, 30000);
    return () => {
      disposed = true;
      clearInterval(poll);
      clearTimeout(connectionNotice);
      clearTimeout(reconnectTimer);
      subscription.remove();
      socket.removeAllListeners();
      socket.disconnect();
      if (liveSocket === socket) liveSocket = null;
      dispatch(setChatConnected(false));
    };
  }, [session.token, session.role, session.version]);
}
