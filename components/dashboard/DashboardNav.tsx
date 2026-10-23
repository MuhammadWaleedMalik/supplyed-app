import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { dashboardTabs } from '../../constants/dashboardData';
import type { DashboardPage } from '../../feature/dashboard/shared/store/navigationSlice';
import AppIcon from '../Ui/AppIcon';
import { useTheme } from '../Ui/theme';
import { useStyles } from './dashboardStyles';
import { useAppSelector } from '../../store/hooks';

type Props = {
  role: 'teacher' | 'school';
  selected: DashboardPage;
  onSelect: (page: DashboardPage) => void;
};

export default function DashboardNav({ role, selected, onSelect }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();

  const unread = useAppSelector(state => state.conversations.unread);
  const items = dashboardTabs(role).map(tab => {
    const active = selected === tab.page;

    return (
      <Pressable
        key={tab.label}
        accessibilityRole="button"
        accessibilityLabel={tab.label + ' tab'}
        accessibilityState={{ selected: active }}
        onPress={() => onSelect(tab.page)}
        style={[styles.navTab, active && styles.navSelected]}
      >
        <View style={[styles.navIcon, active && styles.navIconSelected]}>
          <AppIcon
            name={tab.icon}
            color={active ? colors.brand : colors.muted}
            size={22}
          />
          {tab.page === 'Messages' && unread > 0 ? (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>
                {unread > 99 ? '99+' : unread}
              </Text>
            </View>
          ) : null}
        </View>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={[styles.navLabel, active && styles.navLabelSelected]}
        >
          {tab.label}
        </Text>
      </Pressable>
    );
  });
  return <View style={styles.nav}>{items}</View>;
}
