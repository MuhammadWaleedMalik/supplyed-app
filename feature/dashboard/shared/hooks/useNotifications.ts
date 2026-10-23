import { useCallback, useEffect, useRef, useState } from 'react';
import { store } from '../../../../store';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { getSessionVersion } from '../../../../utils/api/session';
import {
  getNotifications,
  getNotificationUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  SupplyEdNotification,
} from '../apis/notificationsApi';
import {
  setNotificationFilter,
  setNotificationPage,
  setNotificationCount,
  readNotificationsLocally,
  replaceNotification,
  restoreNotificationReads,
  refreshNotifications,
  setNotificationError,
} from '../store/notificationsSlice';

export async function refreshNotificationCount() {
  const version = getSessionVersion();
  const countVersion = store.getState().notifications.countVersion;
  const result = await getNotificationUnreadCount();
  if (
    version === getSessionVersion() &&
    countVersion === store.getState().notifications.countVersion
  )
    store.dispatch(setNotificationCount(result.total));
}

export function useNotifications(unreadOnly: boolean) {
  const dispatch = useAppDispatch();
  const state = useAppSelector(value => value.notifications);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const busy = useRef(false);
  const savingRef = useRef(false);
  const request = useRef(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    dispatch(setNotificationError(''));
    return () => {
      mounted.current = false;
      request.current += 1;
    };
  }, [dispatch]);

  const refresh = useCallback(() => {
    dispatch(setNotificationError(''));
    setLoadError('');
    dispatch(refreshNotifications());
  }, [dispatch]);

  useEffect(() => {
    if (saving) return;
    const current = ++request.current;
    const version = getSessionVersion();
    const countVersion = store.getState().notifications.countVersion;
    dispatch(setNotificationFilter(unreadOnly));
    busy.current = true;
    setLoading(true);
    setLoadingMore(false);
    getNotifications(1, unreadOnly)
      .then(result => {
        if (current === request.current && version === getSessionVersion()) {
          dispatch(setNotificationPage({ result, countVersion }));
          setLoadError('');
        }
      })
      .catch(problem => {
        if (current === request.current && version === getSessionVersion())
          setLoadError(
            problem instanceof Error
              ? problem.message
              : 'Unable to load notifications.',
          );
      })
      .finally(() => {
        if (current === request.current) {
          busy.current = false;
          setLoading(false);
        }
      });
    return () => {
      request.current += 1;
    };
  }, [dispatch, unreadOnly, state.revision, saving]);

  async function loadMore() {
    if (busy.current || savingRef.current || !state.hasNextPage) return;
    busy.current = true;
    setLoadingMore(true);
    const current = request.current;
    const version = getSessionVersion();
    const countVersion = store.getState().notifications.countVersion;
    try {
      const result = await getNotifications(state.page + 1, unreadOnly);
      if (current === request.current && version === getSessionVersion()) {
        dispatch(setNotificationPage({ result, countVersion }));
        setLoadError('');
      }
    } catch (problem) {
      if (current === request.current && version === getSessionVersion())
        setLoadError(
          problem instanceof Error
            ? problem.message
            : 'Unable to load more notifications.',
        );
    } finally {
      if (current === request.current) {
        busy.current = false;
        setLoadingMore(false);
      }
    }
  }

  async function saveRead(item?: SupplyEdNotification) {
    if (savingRef.current || (item && item.readAt !== null)) return;
    savingRef.current = true;
    request.current += 1;
    setSaving(true);
    setLoading(false);
    const version = getSessionVersion();
    const previous = store.getState().notifications;
    const readAt = new Date().toISOString();
    dispatch(setNotificationError(''));
    dispatch(readNotificationsLocally({ id: item?.id, readAt }));
    const countVersion = store.getState().notifications.countVersion;
    try {
      if (item) {
        const updated = await markNotificationRead(item.id);
        if (version === getSessionVersion())
          dispatch(replaceNotification(updated));
      } else {
        await markAllNotificationsRead();
      }
    } catch (problem) {
      if (version !== getSessionVersion()) return;
      dispatch(
        restoreNotificationReads({
          items: previous.items,
          unread: previous.unread,
          countVersion,
          readAt,
        }),
      );
      // A timed-out request may still have succeeded on the server.
      try {
        const countBefore = store.getState().notifications.countVersion;
        const result = await getNotifications(1, previous.unreadOnly);
        if (version !== getSessionVersion()) return;
        if (store.getState().notifications.unreadOnly === previous.unreadOnly)
          dispatch(setNotificationPage({ result, countVersion: countBefore }));
        const updated = result.notifications.find(row => row.id === item?.id);
        const noLongerUnread =
          previous.unreadOnly && !updated && !result.pagination.hasNextPage;
        if (
          result.unreadCount === 0 ||
          (item && (updated?.readAt || noLongerUnread))
        )
          return;
      } catch {
        // Keep the restored rows available when the connection is still down.
      }
      if (version === getSessionVersion())
        dispatch(
          setNotificationError(
            problem instanceof Error
              ? problem.message
              : 'Unable to mark notifications read.',
          ),
        );
    } finally {
      if (version === getSessionVersion()) {
        dispatch(refreshNotifications());
        refreshNotificationCount().catch(() => {});
        if (mounted.current) setSaving(false);
      }
      savingRef.current = false;
    }
  }

  return {
    items: unreadOnly
      ? state.items.filter(item => item.readAt === null)
      : state.items,
    unread: state.unread,
    hasNextPage: state.hasNextPage,
    loading,
    loadingMore,
    saving,
    error: state.error || loadError,
    refresh,
    loadMore,
    readOne: (item: SupplyEdNotification) => saveRead(item),
    readAll: () => saveRead(),
  };
}
