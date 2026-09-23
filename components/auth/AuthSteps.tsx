import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../Ui/theme';

const steps = [
  ['Account', 'Email and password are created first.'],
  ['Verify', 'The email must be verified before onboarding.'],
  ['Onboard', 'Role is selected only after the user is signed in.'],
];

export default function AuthSteps() {
  return (
    <View style={styles.steps}>
      {steps.map(([title, description], index) => (
        <View key={title} style={styles.step}>
          <Text style={styles.number}>{index + 1}</Text>
          <View style={styles.copy}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  steps: { gap: 10 },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#333b40',
    borderRadius: 14,
    backgroundColor: '#1a1c1d',
  },
  number: {
    color: colors.blue,
    backgroundColor: '#30373d',
    borderRadius: 20,
    overflow: 'hidden',
    minWidth: 28,
    padding: 5,
    textAlign: 'center',
    fontWeight: '700',
  },
  copy: { flex: 1, gap: 3 },
  title: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  description: { color: '#aebbc7', fontSize: 13, lineHeight: 19 },
});
