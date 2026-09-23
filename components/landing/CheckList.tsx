import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, common } from '../Ui/theme';

export default function CheckList({ items }: { items: string[][] }) {
  return (
    <View style={styles.list}>
      {items.map(([title, description]) => (
        <View key={title} style={styles.item}>
          <Text accessible={false} style={styles.check}>
            ✓
          </Text>
          <Text style={[common.body, styles.copy]}>
            <Text style={common.bold}>{title}</Text> {description}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 9 },
  item: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  check: { color: colors.blue, fontSize: 19, lineHeight: 25 },
  copy: { flex: 1 },
});
