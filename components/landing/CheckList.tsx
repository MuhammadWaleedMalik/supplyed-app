import React from 'react';
import { Text, View } from 'react-native';
import { createThemedStyles, useCommonStyles } from '../Ui/theme';

export default function CheckList({ items }: { items: string[][] }) {
  const common = useCommonStyles();
  const styles = useStyles();

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

const useStyles = createThemedStyles(colors => ({
  list: { gap: 9 },
  item: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  check: { color: colors.brand, fontSize: 19, lineHeight: 25 },
  copy: { flex: 1 },
}));
