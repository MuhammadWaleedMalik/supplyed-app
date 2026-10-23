import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import type { ImageStyle, TextStyle, ViewStyle } from 'react-native';
import { ThemeColors, useTheme } from './brandTheme';
export {
  applyBrandTheme,
  restoreBrandTheme,
  getBrandTheme,
  useTheme,
} from './brandTheme';
export type { BrandThemeId, ThemeColors } from './brandTheme';

// The web app uses the platform sans-serif stack for headings and body text.
export const serif = undefined;

function commonStyles(colors: ThemeColors) {
  return StyleSheet.create({
    title: {
      fontFamily: serif,
      fontWeight: '700',
      color: colors.ink,
      fontSize: 32,
    },
    cardTitle: {
      fontFamily: serif,
      fontWeight: '700',
      color: colors.ink,
      fontSize: 23,
    },
    body: { color: colors.muted, fontSize: 15, lineHeight: 25 },
    eyebrow: {
      color: colors.brand,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 1.5,
    },
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
    card: {
      backgroundColor: '#ffffff',
      borderWidth: 1,
      borderColor: colors.brandBorder,
      borderRadius: 16,
      padding: 24,
      gap: 14,
    },
    column: { flex: 1, gap: 22 },
    bold: { color: colors.ink, fontWeight: '600' },
  });
}

export function useCommonStyles() {
  const { colors } = useTheme();
  return useMemo(() => commonStyles(colors), [colors]);
}

// Subscriptions refresh styles without remounting screens or resetting forms.
type NamedStyles = Record<string, ViewStyle | TextStyle | ImageStyle>;
export function createThemedStyles<T extends NamedStyles>(
  factory: (
    colors: ThemeColors,
    common: ReturnType<typeof commonStyles>,
  ) => T & NamedStyles,
) {
  return function useThemedStyles() {
    const { colors } = useTheme();
    return useMemo(
      () => StyleSheet.create(factory(colors, commonStyles(colors))),
      [colors],
    );
  };
}
