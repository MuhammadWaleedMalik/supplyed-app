import { StyleSheet } from 'react-native';
import { colors } from '../Ui/theme';

export const styles = StyleSheet.create({
  main: { flex: 1, padding: 20, gap: 13 },
  badge: {
    color: '#006b93', backgroundColor: colors.paleBlue,
    alignSelf: 'flex-start', borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 3,
    fontSize: 10, fontWeight: '700', letterSpacing: 1,
  },
  progressLabel: { flexDirection: 'row', justifyContent: 'space-between' },
  small: { color: colors.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  track: { height: 6, borderRadius: 3, backgroundColor: '#eff1f4', overflow: 'hidden' },
  fill: { height: 6, width: '100%', backgroundColor: colors.blue },
  notice: {
    backgroundColor: colors.paleBlue, borderWidth: 1, borderColor: '#bae2f1',
    borderRadius: 14, padding: 16, gap: 5, marginTop: 14,
  },
  noticeTitle: { color: '#006b93', fontWeight: '700', fontSize: 14 },
  noticeText: { color: '#3d718a', fontSize: 12, lineHeight: 18 },
  card: {
    borderWidth: 1, borderColor: colors.border,
    borderRadius: 16, padding: 18, gap: 16,
  },
  uploadedCard: { borderColor: '#a8d8eb' },
  rejectedCard: { borderColor: '#e5a4a4' },
  cardHeading: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  fileIcon: {
    color: colors.blue, fontSize: 22, backgroundColor: colors.paleBlue,
    width: 40, height: 40, textAlign: 'center', lineHeight: 40, borderRadius: 12,
  },
  cardCopy: { flex: 1, gap: 6 },
  cardTitle: { color: colors.ink, fontWeight: '700', fontSize: 16 },
  required: { color: '#006b93', backgroundColor: colors.paleBlue, fontSize: 10 },
  cardText: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  added: { color: colors.blue, fontSize: 12 },
  hint: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  rejectedText: { color: '#a52b35', fontSize: 12, lineHeight: 18 },
  rejectionNote: { backgroundColor: '#fff2f2', borderRadius: 10, padding: 10 },
  error: { color: '#c93251', fontSize: 12 },
  footer: {
    borderTopWidth: 1, borderColor: colors.border, paddingTop: 18,
    marginTop: 30, flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', gap: 12, flexWrap: 'wrap',
  },
  footerNote: { color: colors.muted, fontSize: 12, flex: 1 },
});
