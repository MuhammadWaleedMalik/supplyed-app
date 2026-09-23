import { StyleSheet } from 'react-native';
import { colors, common } from './theme';

export const styles = StyleSheet.create({
  field: { width: '100%', gap: 7 },
  half: { flex: 1, width: 'auto' },
  label: { ...common.bold, fontSize: 11, letterSpacing: 0.8 },
  required: { color: '#db4262' },
  invalid: { borderColor: '#c93251' },
  error: { color: '#c93251', fontSize: 12, lineHeight: 18 },
  inputRow: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: { flex: 1, paddingHorizontal: 13, color: colors.ink, fontSize: 15 },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  eye: {
    minWidth: 44,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digit: {
    flex: 1,
    minWidth: 0,
    minHeight: 54,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 9,
    backgroundColor: '#ffffff',
    color: colors.ink,
    fontSize: 22,
  },
});

