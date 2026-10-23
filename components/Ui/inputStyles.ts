import { createThemedStyles } from './theme';

export const useStyles = createThemedStyles((colors, common) => ({
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
  focused: { borderColor: colors.brand, borderWidth: 2 },
  error: {
    color: '#c93652',
    fontSize: 12,
    lineHeight: 18,
  },
  inputRow: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#c7d0d9',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    color: colors.ink,
    fontSize: 16,
    paddingVertical: 12,
  },
  multiline: {
    minHeight: 96,
    paddingTop: 13,
    textAlignVertical: 'top',
  },
  eye: {
    minWidth: 48,
    minHeight: 48,
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
}));
