import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';
import {
  applyBrandTheme,
  brandThemes,
  createThemedStyles,
  useTheme,
} from './theme';

export default function ThemePicker() {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <View
      style={styles.options}
      accessibilityRole="radiogroup"
      accessibilityLabel="Theme color"
    >
      {brandThemes.map(palette => {
        const selected = theme.id === palette.id;
        return (
          <Pressable
            key={palette.id}
            accessibilityRole="radio"
            accessibilityLabel={palette.name}
            accessibilityState={{ checked: selected }}
            onPress={() => applyBrandTheme(palette.id)}
            style={({ pressed }) => [
              styles.option,
              selected && styles.selected,
              pressed && styles.pressed,
            ]}
          >
            <View style={[styles.swatch, { backgroundColor: palette.brand }]}>
              {selected ? <Check size={18} color="#ffffff" /> : null}
            </View>
            <Text style={[styles.label, selected && styles.selectedLabel]}>
              {palette.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ThemeSettingsCard() {
  const styles = useStyles();
  return (
    <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.title}>
        Theme
      </Text>
      <Text style={styles.description}>
        Choose your SupplyED color. Changes apply immediately for this app
        session. A full reload returns to Supply blue.
      </Text>
      <ThemePicker />
    </View>
  );
}

const useStyles = createThemedStyles(colors => ({
  card: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.brandBorder,
    gap: 14,
  },
  title: { color: colors.ink, fontSize: 21, fontWeight: '700' },
  description: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  option: {
    flexGrow: 1,
    flexBasis: '45%',
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#ffffff',
  },
  selected: { borderColor: colors.brand, backgroundColor: colors.brandTint },
  swatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { color: colors.ink, fontSize: 14, flexShrink: 1 },
  selectedLabel: { color: colors.brandDark, fontWeight: '700' },
  pressed: { opacity: 0.75 },
}));
