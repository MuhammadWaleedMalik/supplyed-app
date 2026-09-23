import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Section from './Section';
import { colors, common } from '../Ui/theme';

const places = Array.from({ length: 20 }, (_, index) => index + 1);

export default function Cohort() {
  const { width, fontScale } = useWindowDimensions();
  const wide = width / fontScale >= 950;

  return (
    <Section soft>
      <View style={[styles.layout, wide && styles.wide]}>
        <View style={common.column}>
          <Text style={common.eyebrow}>FOUNDING COHORT</Text>
          <Text accessibilityRole="header" style={common.title}>
            A cohort of 20.{'\n'}Not a waiting list.
          </Text>
          <Text style={common.body}>
            The founding cohort is deliberately small. Every founding school
            gets a direct line to the founder, monthly input sessions that shape
            the roadmap, and founding terms locked in writing. When the 20
            places are taken, the programme closes.
          </Text>
        </View>
        <View style={common.column}>
          <View style={styles.grid}>
            {places.map(place => (
              <View key={place} style={styles.place}>
                <Text style={styles.number}>
                  {String(place).padStart(2, '0')}
                </Text>
              </View>
            ))}
          </View>
          <Text style={styles.caption}>
            20 FOUNDING PLACES - REGISTRATIONS REVIEWED IN ORDER RECEIVED
          </Text>
        </View>
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  layout: { gap: 28 },
  wide: { flexDirection: 'row', alignItems: 'center' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  place: {
    width: '18%',
    minHeight: 48,
    paddingVertical: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: { color: colors.muted, fontSize: 12 },
  caption: {
    color: colors.muted,
    fontSize: 10,
    letterSpacing: 0.7,
    lineHeight: 17,
    textAlign: 'center',
  },
});
