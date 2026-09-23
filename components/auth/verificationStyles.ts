import { StyleSheet } from 'react-native';
import { colors } from '../Ui/theme';

export const verificationStyles = StyleSheet.create({
  panel: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 36,
  },
  widePanel: { flex: 1, justifyContent: 'center', paddingHorizontal: 48 },
  content: { width: '100%', maxWidth: 490, alignSelf: 'center', gap: 12 },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 24,
    gap: 18,
    marginTop: 14,
    backgroundColor: '#ffffff',
  },
  label: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  required: { color: '#db4262' },
  notice: { backgroundColor: colors.paleBlue, borderRadius: 12, padding: 14 },
  noticeText: { color: '#106b91', fontSize: 13, lineHeight: 20 },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    gap: 12,
  },
  error: { color: '#c93251', fontSize: 12 },
  resend: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    color: colors.muted,
    textAlign: 'center',
    padding: 11,
    flex: 1,
  },
  caption: {
    color: colors.muted,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 17,
  },
  footer: { backgroundColor: colors.soft, borderRadius: 12, padding: 12 },
  footerText: { color: colors.muted, fontSize: 11, lineHeight: 17 },
});
