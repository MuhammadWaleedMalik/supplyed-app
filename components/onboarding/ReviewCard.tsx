import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Button from '../Ui/Button';
import { colors, common, serif } from '../Ui/theme';

type Props = {
  title: string;
  subtitle: string;
  items: string[][];
  onEdit: () => void;
};

export default function ReviewCard({ title, subtitle, items, onEdit }: Props) {
  const { width, fontScale } = useWindowDimensions();
  const twoColumns = width / fontScale >= 500;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.heading}>
          <Text style={styles.title}>{title}</Text>
          <Text style={common.body}>{subtitle}</Text>
        </View>
        <Button title="Edit" variant="link" onPress={onEdit} compact />
      </View>
      <View style={styles.items}>
        {items.map(([label, value]) => (
          <View key={label} style={[styles.item, twoColumns && styles.half]}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>{value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    gap: 14,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  heading: { flex: 1 },
  title: {
    color: colors.ink,
    fontFamily: serif,
    fontSize: 21,
    fontWeight: '700',
  },
  items: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  item: {
    width: '100%',
    backgroundColor: colors.soft,
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  half: { width: '48%' },
  label: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  value: { color: colors.ink, fontSize: 13 },
});
