import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { SupplyEdNotification } from '../../feature/dashboard/shared/apis/notificationsApi';
import AppIcon, { type AppIconName } from '../Ui/AppIcon';
import { useTheme } from '../Ui/theme';
import { useStyles } from './dashboardStyles';
import { useNotificationStyles } from './notificationStyles';

function notificationIcon(type: string): AppIconName {
  switch (type) {
    case 'JOB_MATCH':
      return 'jobs';
    case 'APPLICATION_RECEIVED':
      return 'teachers';
    case 'APPLICATION_STATUS':
      return 'applications';
    case 'BOOKING_CONFIRMED':
    case 'BOOKING_CANCELLED':
    case 'BOOKING_COMPLETED':
      return 'bookings';
    case 'INVOICE_PAID':
      return 'billing';
    case 'PROFILE_STATUS':
      return 'profile';
    case 'REVIEW_RECEIVED':
      return 'reviews';
    default:
      return 'notifications';
  }
}

function notificationTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 0) return date.toLocaleDateString();
  if (minutes < 1) return 'Just now';
  if (minutes < 60)
    return minutes + (minutes === 1 ? ' minute ago' : ' minutes ago');
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + (hours === 1 ? ' hour ago' : ' hours ago');
  const days = Math.floor(hours / 24);
  if (days < 7) return days + (days === 1 ? ' day ago' : ' days ago');
  return date.toLocaleDateString();
}

type Props = {
  item: SupplyEdNotification;
  onPress: () => void;
  disabled?: boolean;
};

export default function NotificationCard({ item, onPress, disabled }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const notificationStyles = useNotificationStyles();

  const unread = item.readAt === null;
  const time = notificationTime(item.createdAt);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      accessibilityLabel={`${unread ? 'Unread. ' : ''}${item.title}. ${
        item.body
      }. ${time}`}
      onPress={onPress}
      style={[
        styles.card,
        notificationStyles.row,
        unread && notificationStyles.unread,
      ]}
    >
      <View style={notificationStyles.icon}>
        <AppIcon
          name={notificationIcon(item.type)}
          color={colors.brand}
          size={20}
        />
      </View>
      <View style={notificationStyles.copy}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardBody}>{item.body}</Text>
        <View style={notificationStyles.meta}>
          {unread ? (
            <Text style={notificationStyles.unreadText}>Unread</Text>
          ) : null}
          <Text style={notificationStyles.time}>{time}</Text>
        </View>
      </View>
    </Pressable>
  );
}
