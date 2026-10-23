import { useSyncExternalStore } from 'react';
import * as Keychain from 'react-native-keychain';
import { deriveBrandTheme } from '../../utils/ui/themeColors';

export type ThemeColors = {
  brand: string;
  brandDark: string;
  brandTint: string;
  brandBorder: string;
  brandRgb: string;
  ink: string;
  muted: string;
  border: string;
  soft: string;
  dark: string;
};
export type BrandThemeId = string;
const service = 'com.supplyed.preferences';
const listeners = new Set<() => void>();
let changed = false;
let urgentBanner = true;
let writes: Promise<unknown> = Promise.resolve();

function makeTheme(accent: string, name = 'Custom color') {
  const theme = deriveBrandTheme(accent);
  return {
    id: theme.accent.toLowerCase(),
    name,
    urgentBanner,
    colors: {
      brand: theme.accent,
      brandDark: theme.dark,
      brandTint: theme.tint,
      brandBorder: theme.tint2,
      brandRgb: theme.rgb.split(' ').join(', '),
      ink: '#15232d',
      muted: '#5f707b',
      border: '#e2e8ec',
      soft: '#f5f7f9',
      dark: '#090b0c',
    } as ThemeColors,
  };
}
let currentTheme = makeTheme('#008CC4', 'Supply blue');
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export function getBrandTheme() {
  return currentTheme;
}
export async function restoreBrandTheme() {
  try {
    await writes;
    const saved = await Keychain.getGenericPassword({ service });
    if (!saved || changed) return;
    const data = JSON.parse(saved.password);
    urgentBanner = data.urgentBanner !== false;
    currentTheme = makeTheme(
      typeof data.accent === 'string' ? data.accent : '#008CC4',
      data.name,
    );
    listeners.forEach(listener => listener());
  } catch {
    /* Keep the session preference when storage is unavailable. */
  }
}
export function applyBrandTheme(accent: string, name?: string) {
  changed = true;
  currentTheme = makeTheme(accent, name);
  listeners.forEach(listener => listener());
  const saved = JSON.stringify({
    accent: currentTheme.colors.brand,
    name: currentTheme.name,
    urgentBanner,
  });
  writes = writes
    .catch(() => {})
    .then(() => Keychain.setGenericPassword('preferences', saved, { service }))
    .catch(() => {});
}
export function useTheme() {
  return useSyncExternalStore(subscribe, getBrandTheme, getBrandTheme);
}

export function applyUrgentBanner(value: boolean) {
  urgentBanner = value;
  applyBrandTheme(currentTheme.colors.brand, currentTheme.name);
}
