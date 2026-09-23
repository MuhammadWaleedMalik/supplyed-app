import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Section from './Section';
import IconBadge from './IconBadge';
import { common } from '../Ui/theme';

const items = [
  ['✓', 'Enhanced DBS on every profile', 'Verified before activation'],
  [
    '◇',
    'Built with education leaders',
    'MAT trustees and deputy heads advising',
  ],
  ['£', 'One transparent processing fee', 'No agency mark-ups, no finder fees'],
  ['◎', 'Launching 2026', 'Greater Manchester and Lancashire first'],
];

export default function TrustStrip() {
  const { width, fontScale } = useWindowDimensions();

  return (
    <Section soft>
      <View style={common.row}>
        {items.map(([symbol, title, description]) => (
          <View
            key={title}
            style={[
              styles.item,
              width / fontScale >= 950 && styles.wide,
              width / fontScale < 360 && styles.full,
            ]}
          >
            <IconBadge symbol={symbol} />
            <Text style={styles.title}>{title}</Text>
            <Text style={common.body}>{description}</Text>
          </View>
        ))}
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  item: { flexGrow: 1, flexBasis: '40%', gap: 10 },
  wide: { flexBasis: '20%' },
  full: { flexBasis: '100%' },
  title: { ...common.bold, fontSize: 16, lineHeight: 23 },
});
