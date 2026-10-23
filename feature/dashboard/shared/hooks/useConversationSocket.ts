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
import { normalizeMessage } from '../../../../utils/messaging/normalizeConversation';
import { store } from '../../../../store';
import {
  getAccessToken,
  getCurrentSessionUser,
  getSessionVersion,
  onSessionChanged,
} from '../../../../utils/api/session';
import { protectedRequest } from '../../../../utils/api/request';
import { refreshMarketplace } from '../store/navigationSlice';
import { isNotification, SupplyEdNotification } from '../apis/notificationsApi';
import { refreshNotificationCount } from './useNotifications';
import {
  receiveNotification,
  refreshNotifications,
  setNotificationCount,
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
    let loadingInbox = false;
    let inboxAgain = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let connectionNotice: ReturnType<typeof setTimeout> | undefined;
    const socket = io(SOCKET_ORIGIN + '/conversations', {
      path: SOCKET_PATH,
      auth: callback => {
        // Socket.IO invokes auth for each reconnect; rotated tickets are never reused.
        protectedRequest<{ ticket: string }>(
          '/conversations/socket-ticket',
          'POST',
        )
          .then(result => {
            if (
              disposed ||
              getSessionVersion() !== session.version ||
              AppState.currentState !== 'active'
            )
              return;
            if (!result?.ticket)
              throw new Error('Live messaging is temporarily unavailable.');
            callback({ ticket: result.ticket });
          })
          .catch(() => {
            if (disposed) return;
            store.dispatch(
              setChatError(
                'Live updates are unavailable. Messages refresh automatically.',
              ),
            );
            socket.disconnect();
            clearTimeout(reconnectTimer);
            reconnectTimer = setTimeout(() => {
              if (active() && !stopped) socket.connect();
            }, 10000);
          });
      },
      // Android's native WebSocket adds the API host as Origin by default.
      // The gateway only allows browser origins on its allowlist; native clients
      // use an empty Origin and are still authenticated by their socket ticket.
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
        if (active())
          dispatch(
            setChatError('Unable to refresh messages. Open Messages to retry.'),
          );
      } finally {
        loadingInbox = false;
        if (inboxAgain) {
          inboxAgain = false;
          refreshInbox();
        }
      }
    }

    function reconnectWithFreshTicket() {
      if (!active() || stopped) return;
      socket.disconnect();
      clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(() => {
        // The REST ticket request refreshes or expires the login when needed.
        // A used or expired one-time ticket must never log the user out itself.
        if (active() && !stopped) socket.connect();
      }, 2000);
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
    socket.on(
      'notification',
      (event: { notification: SupplyEdNotification; unreadCount: number }) => {
        if (
          !active() ||
          !event ||
          !isNotification(event.notification) ||
          !Number.isInteger(event.unreadCount) ||
          event.unreadCount < 0
        )
          return;
        dispatch(receiveNotification(event));
        dispatch(refreshMarketplace());
      },
    );
    socket.on('notification:count', (event: { unreadCount: number }) => {
      if (
        !active() ||
        !event ||
        !Number.isInteger(event.unreadCount) ||
        event.unreadCount < 0
      )
        return;
      dispatch(setNotificationCount(event.unreadCount));
      dispatch(refreshNotifications());
    });
    socket.on('disconnect', reason => {
      dispatch(setChatConnected(false));
      if (!active() || stopped) return;
      showConnectionNotice();
      // Socket.IO does not retry a server-initiated disconnect by itself.
      if (reason === 'io server disconnect') {
        clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(() => {
          if (active() && !stopped) socket.connect();
        }, 2000);
      }
    });
    socket.on(
      'message',
      (event: { conversationId: string; message: ChatMessage }) => {
        if (!active()) return;
        dispatch(
          saveMessages({
            id: event.conversationId,
            messages: [normalizeMessage(event.message)],
          }),
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
      }) => {
        if (active()) dispatch(setChatTyping(event));
      },
    );
    socket.on('auth:expired', reconnectWithFreshTicket);
    socket.on('connect_error', error => {
      if (!active()) return;
      const code =
        (error as Error & { data?: { code?: string } }).data?.code ||
        error.message;
      dispatch(setChatConnected(false));
      if (
        [
          'ACCESS_TOKEN_EXPIRED',
          'AUTH_TOKEN_MISSING',
          'INVALID_ACCESS_TOKEN',
          'TICKET_ALREADY_USED',
        ].includes(code)
      ) {
        reconnectWithFreshTicket();
        return;
      }
      if (
        [
          'ROLE_NOT_ALLOWED',
          'ORIGIN_NOT_ALLOWED',
          'NAMESPACE_UNKNOWN',
        ].includes(code)
      ) {
        stopped = true;
        socket.disconnect();
      } else {
        // Socket.IO does not automatically reconnect after middleware rejects it.
        clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(() => {
          if (active() && !stopped) socket.connect();
        }, 10000);
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
