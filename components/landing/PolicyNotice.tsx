import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { common } from '../Ui/theme';

export default function PolicyNotice() {
  return (
    <View style={styles.notice}>
      <Text accessible={false} style={styles.icon}>
        ▤
      </Text>
      <Text style={[common.body, styles.copy]}>
        <Text style={common.bold}>
          The rules on agency supply are changing.{' '}
        </Text>
        The Department for Education's new STeER framework (RM6376) caps agency
        fees by role and becomes mandatory for academy trusts from September
        2026. SupplyED is built for that world: direct school-to-teacher
        introductions with one transparent processing fee, not agency mark-ups.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    backgroundColor: '#fffae9',
    borderColor: '#f5d294',
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    gap: 12,
  },
  icon: { color: '#cc7a00', fontSize: 24 },
  copy: { flex: 1 },
});
