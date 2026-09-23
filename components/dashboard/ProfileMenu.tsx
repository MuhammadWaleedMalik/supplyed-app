import React from 'react';
import { Pressable, Text, View } from 'react-native';
import AppIcon, { AppIconName } from '../Ui/AppIcon';
import { colors } from '../Ui/theme';
import { styles } from './dashboardStyles';

type Item = {
  title: string;
  icon: AppIconName;
  onPress: () => void;
};

type Props = {
  onProfile: () => void;
  onSecurity: () => void;
  onSettings: () => void;
  onLogout: () => void;
};

export default function ProfileMenu({
  onProfile,
  onSecurity,
  onSettings,
  onLogout,
}: Props) {
  const items: Item[] = [
    { title: 'Workspace profile', icon: 'profile', onPress: onProfile },
    { title: 'Security', icon: 'lock', onPress: onSecurity },
    { title: 'Settings', icon: 'settings', onPress: onSettings },
    { title: 'Logout', icon: 'logout', onPress: onLogout },
  ];

  return (
    <View style={styles.profileMenu}>
      {items.map(item => (
        <Pressable
          key={item.title}
          accessibilityRole="button"
          onPress={item.onPress}
          style={styles.profileMenuItem}
        >
          <AppIcon name={item.icon} color={colors.blue} size={15} />
          <Text style={styles.profileMenuText}>{item.title}</Text>
        </Pressable>
      ))}
    </View>
  );
}
