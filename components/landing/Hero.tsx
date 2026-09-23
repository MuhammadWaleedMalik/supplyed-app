import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Section from './Section';
import Button from '../Ui/Button';
import MarketplaceCard from './MarketplaceCard';
import HeroStats from './HeroStats';
import { colors, common } from '../Ui/theme';
import { openRegistration } from '../../utils/landing/openRegistration';

export default function Hero({
  onShowBenefits,
}: {
  onShowBenefits: () => void;
}) {
  const { width, fontScale } = useWindowDimensions();
  const wide = width / fontScale >= 950;

  return (
    <Section dark grid>
      <View style={[styles.layout, wide && styles.wide]}>
        <View style={common.column}>
          <Text style={common.eyebrow}>
            FOUNDING SCHOOLS PROGRAMME - CAPPED AT 20 SCHOOLS
          </Text>
          <Text
            accessibilityRole="header"
            style={[common.title, styles.title, wide && styles.large]}
          >
            Twenty schools will shape how supply cover works.{'\n'}
            <Text style={styles.accent}>Yours can be one.</Text>
          </Text>
          <Text style={[common.body, styles.body]}>
            SupplyED is a compliance-first marketplace connecting UK schools
            directly with verified supply teachers. Before launch, we are
            inviting a founding cohort of 20 schools across Greater Manchester
            and Lancashire to lock in founding terms and shape the platform with
            us.
          </Text>
          <View style={styles.buttons}>
            <Button
              title="Reserve Your School's Place"
              onPress={openRegistration}
            />
            <Button
              title="See what founding schools get"
              onPress={onShowBenefits}
              variant="outline"
            />
          </View>
          <HeroStats />
        </View>
        <View style={common.column}>
          <MarketplaceCard />
        </View>
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  layout: { gap: 40 },
  wide: { flexDirection: 'row', alignItems: 'center' },
  title: { color: '#ffffff', fontSize: 39, lineHeight: 46 },
  large: { fontSize: 52, lineHeight: 59 },
  accent: { color: colors.blue, fontStyle: 'italic' },
  body: { color: '#bac5d1', fontSize: 17, lineHeight: 29 },
  buttons: { gap: 12 },
});
