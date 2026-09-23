import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AppIcon from './AppIcon';
import { colors } from './theme';

type Check = { label: string; valid: boolean };

export default function ValidationChecklist({ items }: { items: Check[] }) {
  if (items.every(item => item.valid)) {
    return null;
  }

  return (
    <View style={styles.list}>
      {items.map(item => (
        <View key={item.label} style={styles.row}>
          <View style={styles.symbol}>
            <AppIcon
              name={item.valid ? 'check' : 'circle'}
              color={item.valid ? '#17804f' : colors.muted}
              size={15}
            />
          </View>
          <Text style={[styles.label, item.valid && styles.done]}>
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 4, paddingTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  symbol: { width: 18, alignItems: 'center' },
  label: { color: colors.muted, fontSize: 12 },
  done: { color: '#17804f' },
});
