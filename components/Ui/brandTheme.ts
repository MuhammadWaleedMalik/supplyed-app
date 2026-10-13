import { useSyncExternalStore } from 'react';

export const brandThemes = [
  {
    id: 'supply-blue',
    name: 'Supply blue',
    brand: '#008CC4',
    brandDark: '#006D99',
    brandTint: '#E6F4F9',
    brandBorder: '#C7E6F2',
    brandRgb: '0, 140, 196',
  },
  {
    id: 'emerald',
    name: 'Emerald',
    brand: '#16A34A',
    brandDark: '#117F3A',
    brandTint: '#E8F6ED',
    brandBorder: '#CCEBD7',
    brandRgb: '22, 163, 74',
  },
  {
    id: 'violet',
    name: 'Violet',
    brand: '#7C3AED',
    brandDark: '#612DB9',
    brandTint: '#F2EBFD',
    brandBorder: '#E2D4FB',
    brandRgb: '124, 58, 237',
  },
  {
    id: 'rose',
    name: 'Rose',
    brand: '#E11D48',
    brandDark: '#B01738',
    brandTint: '#FCE8ED',
    brandBorder: '#F8CDD7',
    brandRgb: '225, 29, 72',
  },
  {
    id: 'amber',
    name: 'Amber',
    brand: '#D97706',
    brandDark: '#A95D05',
    brandTint: '#FBF1E6',
    brandBorder: '#F7E1C8',
    brandRgb: '217, 119, 6',
  },
  {
    id: 'slate',
    name: 'Slate',
    brand: '#334155',
    brandDark: '#283342',
    brandTint: '#EBECEE',
    brandBorder: '#D2D5DA',
    brandRgb: '51, 65, 85',
  },
] as const;

export type BrandThemeId = (typeof brandThemes)[number]['id'];
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

const themes = brandThemes.map(palette => ({
  id: palette.id,
  name: palette.name,
  colors: {
    brand: palette.brand,
    brandDark: palette.brandDark,
    brandTint: palette.brandTint,
    brandBorder: palette.brandBorder,
    brandRgb: palette.brandRgb,
    ink: '#162b3a',
    muted: '#65758a',
    border: '#e0e5eb',
    soft: '#f7f8f9',
    dark: '#090b0c',
  } as ThemeColors,
}));

// Session-only: survives navigation and login/logout, resets on a full reload.
let currentTheme = themes[0];
const listeners = new Set<() => void>();
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export function getBrandTheme() {
  return currentTheme;
}
export function applyBrandTheme(id: BrandThemeId) {
  const theme = themes.find(item => item.id === id);
  if (!theme || theme === currentTheme) return;
  currentTheme = theme;
  listeners.forEach(listener => listener());
}
export function useTheme() {
  return useSyncExternalStore(subscribe, getBrandTheme, getBrandTheme);
}
