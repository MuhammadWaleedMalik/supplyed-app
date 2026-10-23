import {
  useDraft,
  updateDraft,
  getDraft,
} from '../../../../utils/messaging/drafts';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import {
  ChatMessage,
  getConversation,
  getMessages,
  getMissedMessages,
  getUnreadCount,
  markConversationRead,
  MessageAttachment,
  sendMessage,
} from '../../../../constants/conversationsApi';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { ApiError } from '../../../../utils/api/request';
import { getSessionVersion } from '../../../../utils/api/session';
import {
  saveConversation,
  saveMessages,
  setChatHistory,
  setChatRead,
  setUnread,
} from '../store/conversationsSlice';
import { sendTyping } from './useConversationSocket';

const emptyMessages: ChatMessage[] = [];
export function useConversation(id: string, focused = true) {
  const dispatch = useAppDispatch();
  const conversation = useAppSelector(state => state.conversations.byId[id]);
  const mySide = conversation?.me;
  const messages = useAppSelector(
    state => state.conversations.messages[id] || emptyMessages,
  );
  const revision = useAppSelector(state => state.conversations.revision);
  const savedHistory = useAppSelector(state => state.conversations.history[id]);
  const cursor = useRef(savedHistory);
  cursor.current = savedHistory;
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [olderLoading, setOlderLoading] = useState(false);
  const hasMore = savedHistory?.hasMore || false;
  const { sending: busy, uncertain } = useDraft(id);
  const session = useRef(getSessionVersion()).current;
  const setBusy = (sending: boolean) => updateDraft(id, { sending }, session);
  const setUncertain = (value: boolean) =>
    updateDraft(id, { uncertain: value }, session);
  const [error, setError] = useState('');
  const [caughtUp, setCaughtUp] = useState(true);
  const [foreground, setForeground] = useState(
    AppState.currentState === 'active',
  );
  const history = useRef(messages);
  history.current = messages;
  const alive = useRef(true);
  const version = useRef(getSessionVersion());
  const loadingRef = useRef(false);
  const sendingRef = useRef(false);
  const readingRef = useRef(false);
  const olderLoadingRef = useRef(false);
  const refreshAgain = useRef(false);
  const typingAt = useRef(0);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const valid = useCallback(
    () => alive.current && version.current === getSessionVersion(),
    [],
  );

  const stopTyping = useCallback(() => {
    clearTimeout(typingTimer.current);
    sendTyping(id, false);
  }, [id]);

  const refresh = useCallback(
    async function refreshConversation() {
      if (!valid() || AppState.currentState !== 'active') return false;
      if (loadingRef.current) {
        refreshAgain.current = true;
        return false;
      }
      loadingRef.current = true;
      setSyncing(true);
      try {
        const [summary, page] = await Promise.all([
          getConversation(id),
          getMissedMessages(id, history.current, cursor.current?.lastSyncedId),
        ]);
        if (!valid()) return false;
        dispatch(saveConversation(summary));
        dispatch(saveMessages({ id, messages: page.messages }));
        // An already loaded older cursor remains valid after refreshing the newest page.
        dispatch(
          setChatHistory({
            id,
            hasMore: cursor.current
              ? cursor.current.hasMore && page.hasMore
              : page.hasMore,
            lastSyncedId: page.messages[page.messages.length - 1]?.id || '',
          }),
        );
        setError('');
        return true;
      } catch (problem) {
        if (valid())
          setError(
            problem instanceof Error
              ? problem.message
              : 'Unable to load conversation.',
          );
        return false;
      } finally {
        loadingRef.current = false;
        if (valid()) {
          setLoading(false);
          setSyncing(false);
          if (refreshAgain.current) {
            refreshAgain.current = false;
            refreshConversation();
          }
        }
      }
    },
    [id, dispatch, valid],
  );

  useEffect(() => {
    alive.current = true;
    refresh();
    const subscription = AppState.addEventListener('change', state => {
      setForeground(state === 'active');
      if (state === 'active') refresh();
      else stopTyping();
    });
    // This also picks up application rejection, which has no socket event.
    const poll = setInterval(() => refresh(), 30000);
    return () => {
      alive.current = false;
      subscription.remove();
      clearInterval(poll);
      stopTyping();
    };
  }, [refresh, stopTyping]);
  useEffect(() => {
    if (revision) refresh();
  }, [revision, refresh]);
  useEffect(() => {
    if (!focused || conversation?.readOnly) stopTyping();
  }, [focused, conversation?.readOnly, stopTyping]);

  useEffect(() => {
    if (
      loading ||
      syncing ||
      !conversation?.id ||
      !caughtUp ||
      !foreground ||
      !focused
    )
      return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    async function readVisibleMessages() {
      if (cancelled || !valid() || AppState.currentState !== 'active') return;
      if (readingRef.current) {
        timer = setTimeout(readVisibleMessages, 1000);
        return;
      }
      readingRef.current = true;
      try {
        const result = await markConversationRead(id);
        if (valid() && result.readAt && mySide)
          dispatch(
            setChatRead({
              conversationId: id,
              side: mySide,
              readAt: result.readAt,
            }),
          );
        const unread = await getUnreadCount();
        if (valid()) dispatch(setUnread(unread.total));
      } catch (problem) {
        // A later visible update retries, but unread status may be stale meanwhile.
        if (!cancelled && valid())
          setError(
            problem instanceof Error
              ? problem.message
              : 'Unable to mark messages as read. Refresh to retry.',
          );
      } finally {
        readingRef.current = false;
      }
    }
    timer = setTimeout(readVisibleMessages, 1000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    id,
    messages,
    loading,
    syncing,
    conversation?.id,
    mySide,
    caughtUp,
    foreground,
    focused,
    dispatch,
    valid,
  ]);

  async function loadOlder() {
    if (olderLoadingRef.current || !hasMore || !messages.length) return;
    olderLoadingRef.current = true;
    setOlderLoading(true);
    try {
      const page = await getMessages(id, messages[0].id);
      if (!valid()) return;
      dispatch(saveMessages({ id, messages: page.messages }));
      dispatch(
        setChatHistory({
          id,
          hasMore: page.hasMore,
          lastSyncedId: cursor.current?.lastSyncedId || '',
        }),
      );
    } catch (problem) {
      if (valid())
        setError(
          problem instanceof Error
            ? problem.message
            : 'Unable to load older messages.',
        );
    } finally {
      olderLoadingRef.current = false;
      if (valid()) setOlderLoading(false);
    }
  }

  async function send(body: string, attachments: MessageAttachment[]) {
    if (
      getDraft(id).sending ||
      sendingRef.current ||
      getDraft(id).uncertain ||
      !conversation ||
      conversation.readOnly
    )
      return false;
    sendingRef.current = true;
    setBusy(true);
    setError('');
    stopTyping();
    try {
      const message = await sendMessage(
        id,
        body,
        attachments.map(file => file.id),
      );
      if (session !== getSessionVersion()) return false;
      dispatch(saveMessages({ id, messages: [message] }));
      refresh();
      return true;
    } catch (problem) {
      if (session !== getSessionVersion()) return false;
      const unknownResult =
        !(problem instanceof ApiError) ||
        problem.status === 0 ||
        problem.status === 408 ||
        problem.status >= 500;
      if (unknownResult) setUncertain(true);
      if (
        unknownResult ||
        (problem instanceof ApiError && problem.status === 403)
      )
        await refresh();
      updateDraft(
        id,
        {
          error:
            problem instanceof Error
              ? problem.message
              : 'Unable to send message.',
        },
        session,
      );
      return false;
    } finally {
      sendingRef.current = false;
      setBusy(false);
    }
  }

  function typing() {
    if (conversation?.readOnly || !foreground || !focused) return;
    if (Date.now() - typingAt.current > 1500) {
      sendTyping(id, true);
      typingAt.current = Date.now();
    }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(stopTyping, 3000);
  }
  async function reviewUncertainSend() {
    if (await refresh()) {
      setUncertain(false);
      updateDraft(id, { error: '' }, session);
    }
  }
  return {
    conversation,
    messages,
    loading,
    olderLoading,
    hasMore,
    busy,
    error,
    uncertain,
    refresh,
    loadOlder,
    send,
    typing,
    stopTyping,
    setCaughtUp,
    reviewUncertainSend,
  };
}
