import { createThemedStyles } from '../Ui/theme';

export const useNotificationStyles = createThemedStyles(colors => ({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  unread: {
    borderColor: colors.brand,
    backgroundColor: colors.brandTint,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 6,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  unreadText: {
    color: colors.brand,
    fontSize: 12,
    fontWeight: '700',
  },
  time: {
    color: colors.muted,
    fontSize: 12,
  },
  error: {
    color: '#b42318',
    fontSize: 13,
    lineHeight: 20,
  },
}));
