import { StyleSheet } from 'react-native';
import { colors, common } from './theme';

export const styles = StyleSheet.create({
  field: {
    width: '100%',
    gap: 7,
  },
  half: {
    flex: 1,
    width: 'auto',
  },
  label: {
    ...common.bold,
    fontSize: 12,
  },
  required: {
    color: '#c93652',
  },
  invalid: {
    borderColor: '#c93652',
  },
  error: {
    color: '#c93652',
    fontSize: 12,
    lineHeight: 18,
  },
  inputRow: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#c7d0d9',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    color: colors.ink,
    fontSize: 14,
  },
  multiline: {
    minHeight: 96,
    paddingTop: 13,
    textAlignVertical: 'top',
  },
  eye: {
    minWidth: 44,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digit: {
    flex: 1,
    minWidth: 0,
    minHeight: 54,
    borderWidth: 1,
    borderColor: '#c7d0d9',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    color: colors.ink,
    fontSize: 22,
  },
});
