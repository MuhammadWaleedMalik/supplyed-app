import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Section from './Section';
import CheckList from './CheckList';
import { common } from '../Ui/theme';

const items = [
  [
    'Founding terms, locked for 2 years',
    '– your founding processing fee is fixed in writing.',
  ],
  [
    'Direct line to the founder',
    '– monthly input sessions that shape the roadmap.',
  ],
  ['Priority access at launch', '– your roles reach verified teachers first.'],
  [
    'No commitment',
    '– registering interest starts a conversation, nothing more.',
  ],
];

export default function ReadySection() {
  return (
    <Section>
      <View style={styles.content}>
        <Text style={common.eyebrow}>FOUNDING SCHOOLS PROGRAMME</Text>
        <Text accessibilityRole="header" style={common.title}>
          Ready to transform your staffing?
        </Text>
        <Text style={common.body}>
          Be one of the 20 founding schools shaping SupplyED across Greater
          Manchester and Lancashire.
        </Text>
        <CheckList items={items} />
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  content: { maxWidth: 680, width: '100%', gap: 22, paddingVertical: 24 },
});
