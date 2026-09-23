import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Section from './Section';
import SectionHeading from './SectionHeading';
import CheckList from './CheckList';
import PolicyNotice from './PolicyNotice';
import { colors, common } from '../Ui/theme';
import { foundingRoutes } from '../../constants/landingData';

export default function FoundingRoutes() {
  const { width, fontScale } = useWindowDimensions();

  return (
    <Section>
      <SectionHeading
        label="TWO WAYS TO JOIN"
        title="Choose the founding route that fits."
        description="Both tiers are founding places within the cap of 20."
      />
      <View style={[styles.cards, width / fontScale >= 800 && styles.row]}>
        {foundingRoutes.map(route => (
          <View
            key={route.title}
            style={[
              common.card,
              styles.card,
              route.enhanced && styles.enhanced,
            ]}
          >
            {route.enhanced && <Text style={styles.badge}>ENHANCED</Text>}
            <Text style={common.cardTitle}>{route.title}</Text>
            <Text style={common.body}>{route.description}</Text>
            <CheckList items={route.items} />
          </View>
        ))}
      </View>
      <PolicyNotice />
    </Section>
  );
}

const styles = StyleSheet.create({
  cards: { gap: 16 },
  row: { flexDirection: 'row' },
  card: { flex: 1 },
  enhanced: { borderColor: '#9dd5e8' },
  badge: {
    alignSelf: 'flex-end',
    color: '#007ba6',
    backgroundColor: colors.paleBlue,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    fontSize: 10,
    fontWeight: '700',
  },
});
