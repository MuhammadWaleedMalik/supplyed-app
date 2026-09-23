import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { common } from '../Ui/theme';

const stats = [
  ['20', 'FOUNDING PLACES'],
  ['2 years', 'TERMS LOCKED'],
  ['Priority', 'LAUNCH ACCESS'],
  ['No fee', 'TO REGISTER'],
];

export default function HeroStats() {
  return (
    <View style={styles.stats}>
      {stats.map(([value, label]) => (
        <View key={label} style={styles.stat}>
          <Text style={[common.cardTitle, styles.value]}>{value}</Text>
          <Text style={styles.label}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, marginTop: 8 },
  stat: { flexGrow: 1, flexBasis: 105, gap: 5 },
  value: { color: '#ffffff', fontSize: 27 },
  label: { color: '#a5b2c1', fontSize: 10, letterSpacing: 0.7 },
});
