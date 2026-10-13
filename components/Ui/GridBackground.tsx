import { createThemedStyles } from './theme';
import React from 'react';
import { StyleSheet, View } from 'react-native';

const lines = Array.from({ length: 24 }, (_, index) => index);

export default function GridBackground() {
  const styles = useStyles();

  return (
    <View
      pointerEvents="none"
      accessible={false}
      style={StyleSheet.absoluteFill}
    >
      <View style={[StyleSheet.absoluteFill, styles.columns]}>
        {lines.map(line => (
          <View key={line} style={styles.vertical} />
        ))}
      </View>
      <View style={StyleSheet.absoluteFill}>
        {lines.map(line => (
          <View key={line} style={styles.horizontal} />
        ))}
      </View>
    </View>
  );
}

const useStyles = createThemedStyles(colors => ({
  columns: { flexDirection: 'row' },
  vertical: {
    flex: 1,
    borderRightWidth: 1,
    borderColor: `rgba(${colors.brandRgb}, 0.12)`,
  },
  horizontal: {
    flex: 1,
    borderBottomWidth: 1,
    borderColor: `rgba(${colors.brandRgb}, 0.12)`,
  },
}));
