import React from 'react';
import { Text, View } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { useTheme } from '../Ui/theme';
import { useSettingsStyles } from './settingsStyles';

type Props = { icon: LucideIcon; title: string; note: string };

export default function SettingsCardHeader({ icon: Icon, title, note }: Props) {
  const { colors } = useTheme();
  const settingsStyles = useSettingsStyles();

  return (
    <View style={settingsStyles.cardHead}>
      <View style={settingsStyles.icon}>
        <Icon color={colors.brand} size={19} />
      </View>
      <View style={settingsStyles.cardCopy}>
        <Text style={settingsStyles.cardTitle}>{title}</Text>
        <Text style={settingsStyles.cardNote}>{note}</Text>
      </View>
    </View>
  );
}
