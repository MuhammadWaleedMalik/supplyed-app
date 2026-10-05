import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { dashboardTabs } from '../../constants/dashboardData';
import type { DashboardPage } from '../../feature/dashboard/shared/store/navigationSlice';
import AppIcon from '../Ui/AppIcon';
import { colors } from '../Ui/theme';
import { styles } from './dashboardStyles';

type Props = {
  selected: DashboardPage;
  onSelect: (page: DashboardPage) => void;
};

export default function DashboardNav({ selected, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.navScroll}
      contentContainerStyle={styles.nav}
    >
      {dashboardTabs.map(tab => {
        const active = selected === tab.label;

        return (
          <Pressable
            key={tab.label}
            accessibilityRole="button"
            accessibilityLabel={tab.label + ' tab'}
            accessibilityState={{ selected: active }}
            onPress={() => onSelect(tab.label)}
            style={[styles.navTab, active && styles.navSelected]}
          >
            <View style={[styles.navIcon, active && styles.navIconSelected]}>
              <AppIcon
                name={tab.icon}
                color={active ? colors.blue : colors.muted}
                size={18}
              />
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
      })}
    </ScrollView>
  );
}
