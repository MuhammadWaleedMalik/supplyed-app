import React from 'react';
import { Text, View } from 'react-native';
import { createThemedStyles } from '../Ui/theme';

export default function IconBadge({ symbol }: { symbol: string }) {
  const styles = useStyles();

  return (
    <View accessible={false} style={styles.badge}>
      <Text style={styles.symbol}>{symbol}</Text>
    </View>
  );
}

const useStyles = createThemedStyles(colors => ({
  badge: {
    width: 42,
    minHeight: 42,
    borderRadius: 15,
    backgroundColor: colors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbol: { color: colors.brand, fontSize: 23 },
}));
