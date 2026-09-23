import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { common } from '../Ui/theme';

type Props = { label: string; title: string; description?: string };

export default function SectionHeading({ label, title, description }: Props) {
  return (
    <View style={styles.heading}>
      <Text style={[common.eyebrow, styles.center]}>{label}</Text>
      <Text accessibilityRole="header" style={[common.title, styles.center]}>
        {title}
      </Text>
      {description && (
        <Text style={[common.body, styles.center]}>{description}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { alignItems: 'center', gap: 10 },
  center: { textAlign: 'center' },
});
