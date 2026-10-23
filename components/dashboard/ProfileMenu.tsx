import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { X, ChevronRight } from 'lucide-react-native';
import AppIcon, { AppIconName } from '../Ui/AppIcon';
import { useTheme } from '../Ui/theme';
import { useStyles } from './dashboardStyles';

type Item = {
  title: string;
  icon: AppIconName;
  onPress: () => void;
};

type Props = {
  email: string;
  role: 'teacher' | 'school';
  onApplications: () => void;
  onInvitations: () => void;
  onProfile: () => void;
  onBilling: () => void;
  onHistory?: () => void;
  onClose: () => void;
  bottom: number;
  onSecurity: () => void;
  onSettings: () => void;
  onLogout: () => void;
};

export default function ProfileMenu({
  onProfile,
  onBilling,
  onHistory,
  onClose,
  bottom,
  email,
  role,
  onApplications,
  onInvitations,
  onSecurity,
  onSettings,
  onLogout,
}: Props) {
  const { colors } = useTheme();
  const styles = useStyles();

  const items: Item[] = [
    { title: 'Your profile', icon: 'profile', onPress: onProfile },
    { title: 'Applications', icon: 'applications', onPress: onApplications },
    { title: 'Invitations', icon: 'invitations', onPress: onInvitations },
    {
      title: role === 'teacher' ? 'Earnings & payouts' : 'Billing',
      icon: 'billing',
      onPress: onBilling,
    },
    ...(onHistory
      ? [{ title: 'Job history', icon: 'jobs' as const, onPress: onHistory }]
      : []),
    { title: 'Security', icon: 'lock', onPress: onSecurity },
    { title: 'Settings', icon: 'settings', onPress: onSettings },
    { title: 'Log out', icon: 'logout', onPress: onLogout },
  ];

  return (
    <View
      accessibilityViewIsModal
      style={[styles.profileMenu, { paddingBottom: Math.max(bottom, 12) }]}
    >
      <View style={styles.menuHeader}>
        <View style={styles.teacherCopy}>
          <Text style={styles.cardTitle}>Your account</Text>
          <Text numberOfLines={1} style={styles.cardBody}>
            {email}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close account menu"
          style={styles.notificationButton}
          onPress={onClose}
        >
          <X color={colors.ink} size={22} />
        </Pressable>
      </View>
      <ScrollView>
        {items.map(item => (
          <Pressable
            key={item.title}
            accessibilityRole="button"
            accessibilityLabel={item.title}
            onPress={() => {
              onClose();
              item.onPress();
            }}
            style={styles.profileMenuItem}
          >
            <AppIcon name={item.icon} color={colors.brand} size={21} />
            <Text style={styles.profileMenuText}>{item.title}</Text>
            <ChevronRight color={colors.muted} size={18} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
