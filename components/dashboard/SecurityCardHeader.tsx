import React from 'react';
import { Text, View } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { colors } from '../Ui/theme';
import { securityStyles } from './securityStyles';

type Props = { icon: LucideIcon; title: string; note: string };

export default function SecurityCardHeader({ icon: Icon, title, note }: Props) {
  return <View style={securityStyles.cardHead}>
    <View style={securityStyles.icon}><Icon color={colors.blue} size={19} /></View>
    <View style={securityStyles.headCopy}>
      <Text style={securityStyles.cardTitle}>{title}</Text>
      <Text style={securityStyles.body}>{note}</Text>
    </View>
  </View>;
}
