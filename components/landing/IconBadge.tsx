import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../Ui/theme';

export default function IconBadge({ symbol }: { symbol: string }) {
  return (
    <View accessible={false} style={styles.badge}>
      <Text style={styles.symbol}>{symbol}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    width: 42,
    minHeight: 42,
    borderRadius: 15,
    backgroundColor: colors.paleBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbol: { color: colors.blue, fontSize: 23 },
});
