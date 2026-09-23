import { StyleSheet } from 'react-native';
import { colors, serif } from '../Ui/theme';

export const styles = StyleSheet.create({
  panel: { backgroundColor: colors.dark, padding: 24, gap: 16 },
  wide: { width: '32%', minHeight: 650 },
  heading: {
    color: '#ffffff',
    fontFamily: serif,
    fontWeight: '700',
    fontSize: 32,
    lineHeight: 38,
  },
  description: { color: '#c8d2dc', fontSize: 14, lineHeight: 22 },
  steps: { gap: 15, marginTop: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  number: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#66717a',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 26,
    overflow: 'hidden',
  },
  active: { backgroundColor: colors.blue, borderColor: colors.blue },
  stepCopy: { flex: 1 },
  stepTitle: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  stepDetail: { color: '#9eaab7', fontSize: 11, lineHeight: 16 },
  path: {
    borderWidth: 1,
    borderColor: '#3b4145',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#1c1f20',
    marginTop: 10,
  },
  pathLabel: { color: '#9eaab7', fontSize: 10, letterSpacing: 1 },
  pathTitle: {
    color: '#ffffff',
    fontFamily: serif,
    fontSize: 20,
    fontWeight: '700',
  },
  pathNote: { color: '#b6c0cb', fontSize: 12 },
});
