import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import AppIcon from '../Ui/AppIcon';
import { colors } from '../Ui/theme';
import { styles } from './dashboardStyles';
import ProfileMenu from './ProfileMenu';

type Props = {
  email: string;
  showEmail: boolean;
  onProfile: () => void;
  onSecurity: () => void;
  onSettings: () => void;
  onLogout: () => void;
};

export default function DashboardTopBar({
  email,
  showEmail,
  onProfile,
  onSecurity,
  onSettings,
  onLogout,
}: Props) {
  const [open, setOpen] = useState(false);
  const firstLetter = email.slice(0, 1).toUpperCase() || 'U';

  function pressProfile() {
    setOpen(!open);
  }

  return (
    <View style={styles.topBar}>
      <Text style={styles.brand}>
        Supply<Text style={styles.brandBlue}>ED</Text>
      </Text>
      <View style={styles.userArea}>
        {showEmail ? <Text numberOfLines={1} style={styles.userEmail}>{email}</Text> : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open profile menu"
          onPress={pressProfile}
          style={styles.profileButton}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{firstLetter}</Text>
          </View>
          <AppIcon name="profile" color={colors.blue} size={19} />
        </Pressable>
        {open ? (
          <ProfileMenu
            onProfile={onProfile}
            onSecurity={onSecurity}
            onSettings={onSettings}
            onLogout={onLogout}
          />
        ) : null}
      </View>
    </View>
  );
}
