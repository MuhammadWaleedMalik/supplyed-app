import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function Icon({ name }: { name: 'google' | 'microsoft' }) {
  if (name === 'google') {
    return <Text style={styles.google}>G</Text>;
  }

  return (
    <View style={styles.microsoft} accessible={false}>
      <View style={styles.red} />
      <View style={styles.green} />
      <View style={styles.blue} />
      <View style={styles.yellow} />
    </View>
  );
}

const styles = StyleSheet.create({
  google: {
    color: '#4285f4',
    fontSize: 21,
    fontWeight: '700',
    width: 21,
    textAlign: 'center',
  },
  microsoft: {
    width: 18,
    height: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  red: { width: 8, height: 8, backgroundColor: '#f35325' },
  green: { width: 8, height: 8, backgroundColor: '#81bc06' },
  blue: { width: 8, height: 8, backgroundColor: '#05a6f0' },
  yellow: { width: 8, height: 8, backgroundColor: '#ffba08' },
});
