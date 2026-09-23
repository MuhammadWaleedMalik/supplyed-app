import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, common } from './theme';

type Props = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export default function Checkbox({ label, checked, onChange }: Props) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={() => onChange(!checked)}
      style={styles.row}
    >
      <Text style={[styles.box, checked && styles.selected]}>
        {checked ? '✓' : ''}
      </Text>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    minHeight: 44,
    flexShrink: 1,
  },
  box: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#bdcbd6',
    textAlign: 'center',
    lineHeight: 16,
    fontSize: 12,
    color: '#ffffff',
  },
  selected: { borderColor: colors.blue, backgroundColor: colors.blue },
  label: { ...common.body, fontSize: 13, lineHeight: 19, flexShrink: 1 },
});
