import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type {
  NotificationPage,
  SupplyEdNotification,
} from '../apis/notificationsApi';

type NotificationsState = {
  items: SupplyEdNotification[];
  page: number;
  hasNextPage: boolean;
  unread: number;
  unreadOnly: boolean;
  revision: number;
  countVersion: number;
  error: string;
};

const initialState: NotificationsState = {
  items: [],
  page: 1,
  hasNextPage: false,
  unread: 0,
  unreadOnly: false,
  revision: 0,
  countVersion: 0,
  error: '',
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setNotificationFilter(state, action: PayloadAction<boolean>) {
      if (state.unreadOnly === action.payload) return;
      state.unreadOnly = action.payload;
      state.items = [];
      state.page = 1;
      state.hasNextPage = false;
    },
    setNotificationPage(
      state,
      action: PayloadAction<{
        result: NotificationPage;
        countVersion: number;
      }>,
    ) {
      const { result, countVersion } = action.payload;
      const items = result.pagination.page === 1 ? [] : state.items;
      for (const item of result.notifications) {
        if (!items.some(existing => existing.id === item.id)) items.push(item);
      }
      state.items = items;
      state.page = result.pagination.page;
      state.hasNextPage = result.pagination.hasNextPage;
      // A socket event may have supplied a newer count while REST was loading.
      if (state.countVersion === countVersion)
        state.unread = result.unreadCount;
    },
    setNotificationCount(state, action: PayloadAction<number>) {
      if (!Number.isInteger(action.payload) || action.payload < 0) return;
      state.unread = action.payload;
      state.countVersion += 1;
    },
    receiveNotification(
      state,
      action: PayloadAction<{
        notification: SupplyEdNotification;
        unreadCount: number;
      }>,
    ) {
      const { notification, unreadCount } = action.payload;
      state.unread = unreadCount;
      state.countVersion += 1;
      const items = state.items.filter(item => item.id !== notification.id);
      if (!state.unreadOnly || notification.readAt === null)
        items.unshift(notification);
      items.sort(
        (a, b) =>
          b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id),
      );
      state.hasNextPage = state.hasNextPage || items.length > 20;
      state.items = items.slice(0, 20);
      state.page = 1;
      state.revision += 1;
    },
    readNotificationsLocally(
      state,
      action: PayloadAction<{ id?: string; readAt: string }>,
    ) {
      const { id, readAt } = action.payload;
      for (const item of state.items) {
        if ((!id || item.id === id) && item.readAt === null) {
          item.readAt = readAt;
          state.unread = Math.max(0, state.unread - 1);
        }
      }
      if (!id) state.unread = 0;
      state.countVersion += 1;
    },
    replaceNotification(state, action: PayloadAction<SupplyEdNotification>) {
      const index = state.items.findIndex(
        item => item.id === action.payload.id,
      );
      if (index >= 0) state.items[index] = action.payload;
    },
    restoreNotificationReads(
      state,
      action: PayloadAction<{
        items: SupplyEdNotification[];
        unread: number;
        countVersion: number;
        readAt: string;
      }>,
    ) {
      const previous = action.payload;
      for (const item of state.items) {
        const saved = previous.items.find(old => old.id === item.id);
        if (saved && item.readAt === previous.readAt)
          item.readAt = saved.readAt;
      }
      if (state.countVersion === previous.countVersion)
        state.unread = previous.unread;
    },
    refreshNotifications(state) {
      state.revision += 1;
    },
    setNotificationError(state, action: PayloadAction<string>) {
      state.error = action.payload;
    },
  },
});

export const {
  setNotificationFilter,
  setNotificationPage,
  setNotificationCount,
  receiveNotification,
  readNotificationsLocally,
  replaceNotification,
  restoreNotificationReads,
  refreshNotifications,
  setNotificationError,
} = notificationsSlice.actions;
export default notificationsSlice.reducer;
