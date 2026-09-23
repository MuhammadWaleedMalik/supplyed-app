import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { DashboardTab, dashboardTabs } from '../../constants/dashboardData';
import AppIcon from '../Ui/AppIcon';
import { colors } from '../Ui/theme';
import { styles } from './dashboardStyles';

type Props = {
  selected: DashboardTab;
  onSelect: (tab: DashboardTab) => void;
};

export default function DashboardNav({ selected, onSelect }: Props) {
  return (
    <View style={styles.nav}>
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
    </View>
  );
}
