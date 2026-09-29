import React, { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { useDashboardProfileImage } from '../../feature/dashboard/shared/hooks/useDashboardProfileImage';
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

export default function DashboardTopBar(props: Props) {
  const [open, setOpen] = useState(false);
  const imageUrl = useDashboardProfileImage();
  const firstLetter = props.email.slice(0, 1).toUpperCase() || 'U';

  return (
    <View style={styles.topBar}>
      <Text style={styles.brand}>Supply<Text style={styles.brandBlue}>ED</Text></Text>
      <View style={styles.userArea}>
        {props.showEmail ? <Text numberOfLines={1} style={styles.userEmail}>{props.email}</Text> : null}
        <Pressable accessibilityRole="button" accessibilityLabel="Open profile menu"
          accessibilityState={{ expanded: open }} onPress={() => setOpen(!open)}
          style={styles.profileButton}>
          <View style={styles.avatar}>
            {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.avatarImage} /> : (
              <Text style={styles.avatarText}>{firstLetter}</Text>
            )}
          </View>
          <AppIcon name="profile" color={colors.blue} size={18} />
        </Pressable>
        {open ? <ProfileMenu onProfile={props.onProfile} onSecurity={props.onSecurity}
          onSettings={props.onSettings} onLogout={props.onLogout} /> : null}
      </View>
    </View>
  );
}