import { StyleSheet } from 'react-native';
import { colors, serif } from '../Ui/theme';

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  dialog: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    padding: 24,
    gap: 22,
  },
  headingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.paleBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { color: colors.blue, fontSize: 22 },
  copy: { flex: 1, gap: 7 },
  title: {
    color: colors.ink,
    fontFamily: serif,
    fontSize: 24,
    fontWeight: '700',
  },
  description: { color: colors.muted, fontSize: 14, lineHeight: 24 },
  error: { color: '#c93251', fontSize: 12 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
});
