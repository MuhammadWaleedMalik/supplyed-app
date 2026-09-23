import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Section from './Section';
import SectionHeading from './SectionHeading';
import IconBadge from './IconBadge';
import { common } from '../Ui/theme';

const benefits = [
  [
    '£',
    'Founding terms, locked',
    'Your founding processing fee is fixed in writing for two years, before standard terms open more widely.',
  ],
  [
    '☏',
    'Direct line to the founder',
    'Cover coordinators and SLT get monthly input sessions that shape the roadmap before general launch.',
  ],
  [
    'ϟ',
    'Priority access at launch',
    'Founding schools are onboarded, trained, and live before general availability opens.',
  ],
];

export default function Benefits() {
  const { width, fontScale } = useWindowDimensions();
  const wide = width / fontScale >= 850;

  return (
    <Section>
      <SectionHeading
        label="FOUNDING SCHOOLS PROGRAMME"
        title="What founding schools get"
        description="Both tiers are founding places within the cap of 20."
      />
      <View style={[styles.cards, wide && styles.row]}>
        {benefits.map(([symbol, title, description]) => (
          <View key={title} style={[common.card, styles.card]}>
            <IconBadge symbol={symbol} />
            <Text style={common.cardTitle}>{title}</Text>
            <Text style={common.body}>{description}</Text>
          </View>
        ))}
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  cards: { gap: 16 },
  row: { flexDirection: 'row' },
  card: { flex: 1, borderColor: '#9dd5e8' },
});
