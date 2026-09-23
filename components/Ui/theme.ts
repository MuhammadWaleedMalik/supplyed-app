import { Platform, StyleSheet } from 'react-native';

export const colors = {
  blue: '#008fbd',
  paleBlue: '#e5f4f9',
  ink: '#101417',
  muted: '#65758a',
  border: '#e0e5eb',
  soft: '#f7f8f9',
  dark: '#090b0c',
};

export const serif = Platform.OS === 'ios' ? 'Georgia' : 'serif';

export const common = StyleSheet.create({
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
    color: colors.blue,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 24,
    gap: 14,
  },
  column: { flex: 1, gap: 22 },
  bold: { color: colors.ink, fontWeight: '600' },
});
