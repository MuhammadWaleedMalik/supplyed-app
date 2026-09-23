import { StyleSheet } from 'react-native';
import { colors, serif } from '../Ui/theme';

export const styles = StyleSheet.create({
  intro: { backgroundColor: colors.dark, padding: 24, gap: 16 },
  wideIntro: { width: '32%', minHeight: 650 },
  title: {
    color: '#ffffff',
    fontFamily: serif,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700',
  },
  description: { color: '#c8d2dc', fontSize: 14, lineHeight: 22 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 },
  stepIcon: {
    backgroundColor: '#ffffff',
    color: colors.blue,
    width: 30,
    height: 30,
    borderRadius: 15,
    textAlign: 'center',
    lineHeight: 30,
  },
  stepTitle: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  stepDescription: { color: '#9eaab7', fontSize: 11 },
  path: {
    marginTop: 28,
    borderWidth: 1,
    borderColor: '#3b4145',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#1c1f20',
    gap: 3,
  },
  pathLabel: { color: '#9eaab7', fontSize: 10, letterSpacing: 1 },
  pathTitle: {
    color: '#ffffff',
    fontFamily: serif,
    fontSize: 20,
    fontWeight: '700',
  },
  pathDescription: { color: '#b6c0cb', fontSize: 12, lineHeight: 18 },
});
