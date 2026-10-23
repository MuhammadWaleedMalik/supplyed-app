import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from 'react-native';
import AppIcon from '../../../../components/Ui/AppIcon';
import Button from '../../../../components/Ui/Button';
import { useTheme } from '../../../../components/Ui/theme';
import LimitedProfileCard from '../../../../components/dashboard/LimitedProfileCard';
import NotificationCard from '../../../../components/dashboard/NotificationCard';
import { useStyles } from '../../../../components/dashboard/dashboardStyles';
import { useNotificationStyles } from '../../../../components/dashboard/notificationStyles';
import { useAppDispatch } from '../../../../store/hooks';
import { getNotificationDestination } from '../../../../utils/navigation/notificationNavigation';
import type { SupplyEdNotification } from '../apis/notificationsApi';
import { useLimitedProfile } from '../hooks/useLimitedProfile';
import { useNotifications } from '../hooks/useNotifications';
import {
  openMessages,
  openConversation,
  openInvitation,
  openNotificationApplications,
  openNotificationJob,
  showPage,
  openNotificationBooking,
  openNotificationPage,
} from '../store/navigationSlice';

type Props = { type: 'teacher' | 'school'; onSettings: () => void };

export default function NotificationsScreen({ type, onSettings }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const notificationStyles = useNotificationStyles();

  const dispatch = useAppDispatch();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const notifications = useNotifications(unreadOnly);
  const profile = useLimitedProfile();
  const scrollStarted = useRef(false);

  function openNotification(item: SupplyEdNotification) {
    if (notifications.saving) return;
    notifications.readOne(item);
    const destination = getNotificationDestination(item);

    switch (destination.screen) {
      case 'Invitations':
        dispatch(openInvitation(destination.invitationId));
        break;
      case 'Jobs':
        dispatch(openNotificationJob(destination.jobId));
        break;
      case 'Applications':
        dispatch(
          openNotificationApplications({
            applicationId: destination.applicationId,
            jobId: destination.jobId,
          }),
        );
        break;
      case 'Messages':
        dispatch(
          destination.conversationId
            ? openConversation(destination.conversationId)
            : destination.applicationId
            ? openMessages(destination.applicationId)
            : openNotificationPage('Messages'),
        );
        break;
      case 'Bookings':
        dispatch(openNotificationBooking(destination.bookingId));
        break;
      case 'Settings':
        onSettings();
        break;
      case 'TeacherProfile':
        profile.openInstructor(destination.id);
        break;
      case 'InstitutionProfile':
        profile.openSchool(destination.id);
        break;
      default:
        dispatch(
          destination.screen === 'Notifications'
            ? showPage('Notifications')
            : openNotificationPage(destination.screen),
        );
    }
  }

  return (
    <>
      <LimitedProfileCard
        profile={profile.profile}
        error={profile.error}
        loading={profile.loading}
        onClose={profile.closeProfile}
      />
      <FlatList
        style={styles.scroll}
        contentContainerStyle={styles.page}
        data={notifications.items}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <NotificationCard
            item={item}
            disabled={notifications.saving}
            onPress={() => openNotification(item)}
          />
        )}
        refreshing={notifications.loading && notifications.items.length > 0}
        onRefresh={notifications.refresh}
        onScrollBeginDrag={() => {
          scrollStarted.current = true;
        }}
        onEndReachedThreshold={0.35}
        onEndReached={() => {
          if (!scrollStarted.current) return;
          scrollStarted.current = false;
          notifications.loadMore();
        }}
        ListHeaderComponent={
          <View style={styles.section}>
            <Text style={styles.title}>Notifications</Text>
            <Text style={styles.subtitle}>
              {type === 'teacher'
                ? 'Your job matches, applications, bookings, and account updates.'
                : 'Your applications, bookings, and account updates.'}
            </Text>
            <Text style={styles.subtitle} accessibilityLiveRegion="polite">
              {notifications.unread} unread
            </Text>
            <View style={styles.topActions}>
              <Button
                title={
                  notifications.saving
                    ? 'Marking as read...'
                    : 'Mark all as read'
                }
                variant="outline"
                compact
                disabled={notifications.saving || notifications.unread === 0}
                onPress={notifications.readAll}
              />
              <Button
                title="Email settings"
                variant="link"
                compact
                onPress={onSettings}
              />
            </View>
            <View style={styles.filters}>
              {['All', 'Unread'].map(label => {
                const active = unreadOnly === (label === 'Unread');
                return (
                  <Pressable
                    key={label}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => setUnreadOnly(label === 'Unread')}
                    style={[styles.filter, active && styles.filterActive]}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        active && styles.filterTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {notifications.error ? (
              <View style={styles.section}>
                <Text
                  style={notificationStyles.error}
                  accessibilityLiveRegion="polite"
                >
                  {notifications.error}
                </Text>
                <Button
                  title="Retry"
                  variant="outline"
                  compact
                  disabled={notifications.loading}
                  onPress={notifications.refresh}
                />
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          notifications.loading ? (
            <ActivityIndicator
              color={colors.brand}
              accessibilityLabel="Loading notifications"
            />
          ) : !notifications.error ? (
            <View style={[styles.card, styles.emptyCard]}>
              <AppIcon name="notifications" color={colors.brand} size={28} />
              <Text style={styles.cardTitle}>
                {unreadOnly
                  ? 'No unread notifications'
                  : 'No notifications yet'}
              </Text>
              <Text style={[styles.cardBody, styles.centerText]}>
                New updates will appear here.
              </Text>
            </View>
          ) : undefined
        }
        ListFooterComponent={
          notifications.loadingMore ? (
            <ActivityIndicator
              color={colors.brand}
              accessibilityLabel="Loading more notifications"
            />
          ) : notifications.hasNextPage && !notifications.loading ? (
            <Button
              title="Load more"
              variant="outline"
              onPress={notifications.loadMore}
            />
          ) : undefined
        }
      />
    </>
  );
}
