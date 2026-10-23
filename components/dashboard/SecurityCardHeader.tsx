import React from 'react';
import { Text, View } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { useTheme } from '../Ui/theme';
import { useSecurityStyles } from './securityStyles';

type Props = { icon: LucideIcon; title: string; note: string };

export default function SecurityCardHeader({ icon: Icon, title, note }: Props) {
  const { colors } = useTheme();
  const securityStyles = useSecurityStyles();

  return (
    <View style={securityStyles.cardHead}>
      <View style={securityStyles.icon}>
        <Icon color={colors.brand} size={19} />
      </View>
      <View style={securityStyles.headCopy}>
        <Text style={securityStyles.cardTitle}>{title}</Text>
        <Text style={securityStyles.body}>{note}</Text>
      </View>
    </View>
  );
}
