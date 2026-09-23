import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, common, serif } from '../Ui/theme';
import {
  accountTypes,
  AccountType,
} from '../../utils/onboarding/onboardingData';

type Props = {
  type: AccountType | null;
  onSelect: (type: AccountType) => void;
  attempted: boolean;
  wide: boolean;
};

export default function RoleSelection({
  type,
  onSelect,
  attempted,
  wide,
}: Props) {
  return (
    <View style={styles.content}>
      <Text style={styles.label}>CHOOSE ACCOUNT TYPE *</Text>
      <View style={[styles.cards, wide && styles.wideCards]}>
        {accountTypes.map(option => (
          <Pressable
            key={option.id}
            accessibilityRole="button"
            accessibilityState={{ selected: type === option.id }}
            onPress={() => onSelect(option.id)}
            style={[
              styles.card,
              type === option.id && styles.selected,
              wide && styles.wideCard,
            ]}
          >
            <Text style={styles.icon}>{option.symbol}</Text>
            <Text style={styles.title}>{option.title}</Text>
            <Text style={common.body}>{option.description}</Text>
          </Pressable>
        ))}
      </View>
      {attempted && !type && (
        <Text style={styles.error}>Choose an account type.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: 8 },
  label: { ...common.bold, fontSize: 11, letterSpacing: 0.8 },
  cards: { gap: 10 },
  wideCards: { flexDirection: 'row' },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
    minHeight: 124,
    justifyContent: 'center',
    gap: 6,
  },
  wideCard: { flex: 1 },
  selected: { borderColor: colors.blue, backgroundColor: colors.paleBlue },
  icon: { color: colors.blue, fontSize: 22 },
  title: {
    color: colors.ink,
    fontFamily: serif,
    fontSize: 18,
    fontWeight: '700',
  },
  error: { color: '#c93251', fontSize: 12 },
});
