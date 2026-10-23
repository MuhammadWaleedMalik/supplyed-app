import React, { useState } from 'react';
import { Image, Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDashboardProfileImage } from '../../feature/dashboard/shared/hooks/useDashboardProfileImage';
import AppIcon from '../Ui/AppIcon';
import { useTheme } from '../Ui/theme';
import { useStyles } from './dashboardStyles';
import ProfileMenu from './ProfileMenu';
import { useAppSelector } from '../../store/hooks';

type Props = {
  email: string;
  role: 'teacher' | 'school';
  onApplications: () => void;
  onInvitations: () => void;
  onProfile: () => void;
  onBilling: () => void;
  onHistory?: () => void;
  onSecurity: () => void;
  onSettings: () => void;
  onLogout: () => void;
  onNotifications: () => void;
};

export default function DashboardTopBar(props: Props) {
  const { colors } = useTheme();
  const styles = useStyles();

  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const imageUrl = useDashboardProfileImage();
  const unread = useAppSelector(state => state.notifications.unread);
  const firstLetter = props.email.slice(0, 1).toUpperCase() || 'U';

  return (
    <View style={styles.topBar}>
      <Text style={styles.brand}>
        Supply<Text style={styles.brandBlue}>ED</Text>
      </Text>
      <View style={styles.userArea}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={'Notifications, ' + unread + ' unread'}
          onPress={props.onNotifications}
          style={styles.notificationButton}
        >
          <AppIcon name="notifications" color={colors.brand} size={22} />
          {unread > 0 ? (
            <View style={styles.notificationBadge}>
              <Text style={styles.unreadText}>
                {unread > 99 ? '99+' : unread}
              </Text>
            </View>
          ) : null}
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open profile menu"
          accessibilityState={{ expanded: open }}
          onPress={() => setOpen(!open)}
          style={styles.profileButton}
        >
          <View style={styles.avatar}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{firstLetter}</Text>
            )}
          </View>
        </Pressable>
        <Modal
          visible={open}
          transparent
          animationType="fade"
          onRequestClose={() => setOpen(false)}
        >
          <View style={styles.menuOverlay}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close profile menu"
              style={styles.menuBackdrop}
              onPress={() => setOpen(false)}
            />
            <ProfileMenu
              bottom={insets.bottom}
              email={props.email}
              role={props.role}
              onApplications={props.onApplications}
              onInvitations={props.onInvitations}
              onClose={() => setOpen(false)}
              onProfile={props.onProfile}
              onBilling={props.onBilling}
              onHistory={props.onHistory}
              onSecurity={props.onSecurity}
              onSettings={props.onSettings}
              onLogout={props.onLogout}
            />
          </View>
        </Modal>
      </View>
    </View>
  );
}
