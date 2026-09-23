import React from 'react';
import { Text, View } from 'react-native';
import Button from '../Ui/Button';
import { styles } from './dashboardStyles';

type Props = {
  title: string;
  description: string;
  action?: string;
  onAction?: () => void;
};

export default function DashboardEmpty({
  title, description, action, onAction,
}: Props) {
  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.title}>{title}</Text>
      <View style={[styles.card, styles.emptyCard]}>
        <Text style={styles.cardTitle}>{description}</Text>
        <Text style={[styles.cardBody, styles.centerText]}>
          This workspace is ready. New activity will appear here.
        </Text>
        {action && onAction ? (
          <Button title={action} onPress={onAction} compact />
        ) : null}
      </View>
    </View>
  );
}

