import React from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import Section from './Section';
import SectionHeading from './SectionHeading';
import CheckList from './CheckList';
import PolicyNotice from './PolicyNotice';
import { createThemedStyles, useCommonStyles } from '../Ui/theme';
import { foundingRoutes } from '../../constants/landingData';

export default function FoundingRoutes() {
  const common = useCommonStyles();
  const styles = useStyles();

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

const useStyles = createThemedStyles(colors => ({
  cards: { gap: 16 },
  row: { flexDirection: 'row' },
  card: { flex: 1 },
  enhanced: { borderColor: colors.brandBorder },
  badge: {
    alignSelf: 'flex-end',
    color: colors.brand,
    backgroundColor: colors.brandTint,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    fontSize: 10,
    fontWeight: '700',
  },
}));
