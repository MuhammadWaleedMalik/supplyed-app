import Checkbox from './Checkbox';
import { applyUrgentBanner } from './brandTheme';
import React, { useState } from 'react';
import { useDropdown } from '../../feature/dropdowns/hooks/useDropdown';
import Input from './Input';
import Button from './Button';
import { Pressable, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { applyBrandTheme, createThemedStyles, useTheme } from './theme';

export default function ThemePicker() {
  const theme = useTheme();
  const dropdown = useDropdown('themeAccent');
  const [custom, setCustom] = useState('');
  const styles = useStyles();
  return (
    <View
      style={styles.options}
      accessibilityRole="radiogroup"
      accessibilityLabel="Theme color"
    >
      {dropdown.options
        .filter(option => /^#[0-9a-f]{6}$/i.test(option.value))
        .map(palette => {
          const selected = theme.id === palette.value.toLowerCase();
          return (
            <Pressable
              key={palette.value}
              accessibilityRole="radio"
              accessibilityLabel={palette.label}
              accessibilityState={{ checked: selected }}
              disabled={dropdown.loading || !!dropdown.error}
              onPress={() => applyBrandTheme(palette.value, palette.label)}
              style={({ pressed }) => [
                styles.option,
                selected && styles.selected,
                pressed && styles.pressed,
              ]}
            >
              <View style={[styles.swatch, { backgroundColor: palette.value }]}>
                {selected ? <Check size={18} color="#ffffff" /> : null}
              </View>
              <Text style={[styles.label, selected && styles.selectedLabel]}>
                {palette.label}
              </Text>
            </Pressable>
          );
        })}
      {dropdown.loading ? (
        <Text style={styles.description}>Loading colors?</Text>
      ) : null}
      {dropdown.error ? (
        <>
          <Text style={styles.description}>{dropdown.error}</Text>
          <Button
            title="Retry colors"
            onPress={dropdown.retry}
            variant="link"
          />
        </>
      ) : null}
      <Input
        label="Custom color"
        value={custom}
        onChangeText={setCustom}
        placeholder="#008CC4"
        required={false}
      />
      <Button
        title="Apply custom color"
        disabled={!/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(custom.trim())}
        onPress={() => applyBrandTheme(custom.trim())}
      />
    </View>
  );
}

export function ThemeSettingsCard() {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.title}>
        Theme
      </Text>
      <Text style={styles.description}>
        Choose your SupplyED color. Your preference is saved on this device.
      </Text>
      <ThemePicker />
      <Checkbox
        label="Show urgent job notices"
        checked={theme.urgentBanner}
        onChange={applyUrgentBanner}
      />
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
