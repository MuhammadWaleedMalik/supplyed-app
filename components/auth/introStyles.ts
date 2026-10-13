import { serif, createThemedStyles } from '../Ui/theme';

export const useIntroStyles = createThemedStyles(colors => ({
  panel: { backgroundColor: colors.dark, paddingBottom: 34 },
  wide: { flex: 1, minHeight: 650 },
  header: {
    minHeight: 68,
    paddingHorizontal: 24,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandButton: { minHeight: 44, justifyContent: 'center' },
  brand: { color: '#ffffff', fontSize: 22, fontWeight: '700' },
  blue: { color: colors.brand },
  copy: { paddingHorizontal: 24, paddingTop: 24, gap: 22 },
  wideCopy: { flex: 1, maxWidth: 630, justifyContent: 'center' },
  heading: {
    color: '#ffffff',
    fontSize: 37,
    lineHeight: 44,
    fontWeight: '700',
  },
  serifHeading: { fontFamily: serif },
  body: { color: '#b7c4d0', fontSize: 15, lineHeight: 25 },
  benefits: { gap: 12, paddingTop: 4 },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  benefitText: { color: '#d0dae3', fontSize: 15, flex: 1 },
  check: {
    color: colors.brand,
    backgroundColor: colors.brandTint,
    borderRadius: 18,
    overflow: 'hidden',
    width: 25,
    textAlign: 'center',
    fontSize: 18,
  },
}));
