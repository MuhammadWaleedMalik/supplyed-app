import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Section from './Section';
import Button from '../Ui/Button';
import { common } from '../Ui/theme';
import { openRegistration } from '../../utils/landing/openRegistration';

export default function ShareSection() {
  return (
    <Section dark>
      <View style={styles.content}>
        <Text style={common.eyebrow}>QR-READY PAGE</Text>
        <Text accessibilityRole="header" style={[common.title, styles.title]}>
          Share this page from events, flyers, and email.
        </Text>
        <Text style={[common.body, styles.body]}>
          Use the page URL directly in QR codes. Add source and campaign query
          strings when you need attribution.
        </Text>
        <Button title="Register interest" onPress={openRegistration} />
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  content: {
    maxWidth: 760,
    width: '100%',
    alignSelf: 'center',
    alignItems: 'center',
    gap: 24,
  },
  title: { color: '#ffffff', textAlign: 'center' },
  body: { color: '#bac5d1', textAlign: 'center' },
});
