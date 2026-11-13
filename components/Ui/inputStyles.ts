import { createThemedStyles } from './theme';

export const useStyles = createThemedStyles((colors, common) => ({
  field: {
    minWidth: 0,
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
    minWidth: 0,
    paddingHorizontal: 14,
    color: colors.ink,
    fontSize: 16,
    paddingVertical: 12,
  },
  phonePrefix: {
    alignSelf: 'stretch',
    minWidth: 66,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#dbe2e7',
    borderTopLeftRadius: 11,
    borderBottomLeftRadius: 11,
    backgroundColor: colors.soft,
  },
  phonePrefixText: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  phoneInput: {
    paddingLeft: 14,
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
