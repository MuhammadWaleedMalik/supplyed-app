import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Section from './Section';
import SectionHeading from './SectionHeading';
import { colors, common } from '../Ui/theme';

const steps = [
  [
    'Register your interest',
    'Tell us about your school. Registrations are reviewed in the order they arrive.',
  ],
  [
    'Intro call',
    'A short call to walk through the programme, founding terms, and your cover needs.',
  ],
  [
    'Confirm your place',
    'If it is a fit, we confirm your place in writing and onboard you before launch.',
  ],
];

export default function HowItWorks() {
  const { width, fontScale } = useWindowDimensions();

  return (
    <Section soft>
      <SectionHeading
        label="HOW IT WORKS"
        title="Three simple steps before launch."
        description="Registrations are reviewed in order received before we confirm places."
      />
      <View style={[styles.cards, width / fontScale >= 850 && styles.row]}>
        {steps.map(([title, description], index) => (
          <View key={title} style={[common.card, styles.card]}>
            <Text style={styles.number}>{index + 1}</Text>
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
  card: { flex: 1 },
  number: {
    alignSelf: 'flex-start',
    minWidth: 34,
    padding: 8,
    textAlign: 'center',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.blue,
    color: '#ffffff',
    fontWeight: '700',
  },
});
