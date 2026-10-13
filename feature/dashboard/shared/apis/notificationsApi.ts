import { endpoints } from '../../../../constants/endpoints';
import { protectedRequest } from '../../../../utils/api/request';

export type SupplyEdNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  data: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
};

export type NotificationPage = {
  notifications: SupplyEdNotification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
  };
  unreadCount: number;
};

export type NotificationPreferences = {
  emailJobMatches: boolean;
  emailMessages: boolean;
  emailUpdates: boolean;
};

// Unknown notification types still display as an ordinary notification.
export function isNotification(value: unknown): value is SupplyEdNotification {
  if (!value || typeof value !== 'object') return false;
  const item = value as SupplyEdNotification;
  return (
    typeof item.id === 'string' &&
    item.id.length > 0 &&
    typeof item.type === 'string' &&
    typeof item.title === 'string' &&
    typeof item.body === 'string' &&
    typeof item.createdAt === 'string' &&
    (item.readAt === null || typeof item.readAt === 'string') &&
    (item.link === null || typeof item.link === 'string') &&
    !!item.data &&
    typeof item.data === 'object' &&
    !Array.isArray(item.data)
  );
}

export async function getNotifications(page = 1, unread = false) {
  const result = await protectedRequest<NotificationPage>(
    endpoints.notifications +
      '?page=' +
      page +
      '&limit=20' +
      (unread ? '&unread=true' : ''),
  );
  if (!Array.isArray(result.notifications) || !result.pagination)
    throw new Error('Unable to read the notifications. Please try again.');
  return {
    ...result,
    notifications: result.notifications.filter(isNotification),
  };
}

export function getNotificationUnreadCount() {
  return protectedRequest<{ total: number }>(endpoints.notificationUnread);
}

export function markNotificationRead(id: string) {
  return protectedRequest<SupplyEdNotification>(
    endpoints.notifications + '/' + encodeURIComponent(id) + '/read',
    'POST',
  );
}

export function markAllNotificationsRead() {
  return protectedRequest<{ updated: number }>(
    endpoints.notificationReadAll,
    'POST',
  );
}

export function getNotificationPreferences() {
  return protectedRequest<NotificationPreferences>(
    endpoints.notificationPreferences,
  );
}

export function updateNotificationPreferences(
  key: keyof NotificationPreferences,
  value: boolean,
) {
  return protectedRequest<NotificationPreferences>(
    endpoints.notificationPreferences,
    'PATCH',
    { [key]: value },
  );
}
