import React from 'react';
import { Pressable, Text, View } from 'react-native';
import AppIcon, { AppIconName } from '../Ui/AppIcon';
import { useTheme } from '../Ui/theme';
import { useStyles } from './dashboardStyles';

type Item = {
  title: string;
  icon: AppIconName;
  onPress: () => void;
};

type Props = {
  onProfile: () => void;
  onBilling: () => void;
  onHistory?: () => void;
  onClose: () => void;
  top: number;
  onSecurity: () => void;
  onSettings: () => void;
  onLogout: () => void;
};

export default function ProfileMenu({
  onProfile,
  onBilling,
  onHistory,
  onClose,
  top,
  onSecurity,
  onSettings,
  onLogout,
}: Props) {
  const { colors } = useTheme();
  const styles = useStyles();

  const items: Item[] = [
    { title: 'Workspace profile', icon: 'profile', onPress: onProfile },
    { title: 'Billing', icon: 'billing', onPress: onBilling },
    ...(onHistory
      ? [{ title: 'Job history', icon: 'jobs' as const, onPress: onHistory }]
      : []),
    { title: 'Security', icon: 'lock', onPress: onSecurity },
    { title: 'Settings', icon: 'settings', onPress: onSettings },
    { title: 'Logout', icon: 'logout', onPress: onLogout },
  ];

  return (
    <View style={[styles.profileMenu, { top }]}>
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
          <AppIcon name={item.icon} color={colors.brand} size={15} />
          <Text style={styles.profileMenuText}>{item.title}</Text>
        </Pressable>
      ))}
    </View>
  );
}
