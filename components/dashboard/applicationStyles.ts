import { createThemedStyles } from '../Ui/theme';

export const useApplicationStyles = createThemedStyles((colors, _common, layout) => ({
  header: {
    gap: 5,
    flex: 1,
  },
  title: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '800',
  },
  copy: {
    flexShrink: 1,
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  meta: {
    maxWidth: '100%',
    borderRadius: 6,
    backgroundColor: colors.soft,
    paddingHorizontal: 9,
    paddingVertical: 6,
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  status: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    backgroundColor: colors.brandTint,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  statusText: {
    color: colors.brandDark,
    fontSize: 10,
    fontWeight: '800',
  },
  cover: {
    borderLeftWidth: 3,
    borderLeftColor: colors.brand,
    paddingLeft: 12,
  },
  coverText: {
    color: colors.ink,
    fontSize: 13,
    lineHeight: 21,
  },
  workflow: {
    gap: 8,
  },
  profileHeader: {
    flexDirection: layout.compact ? 'column' : 'row',
    alignItems: 'stretch',
    gap: 14,
  },
  profileAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.brandTint,
  },
  profileAvatarEmpty: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandTint,
  },
  profileInitials: {
    color: colors.brandDark,
    fontSize: 20,
    fontWeight: '800',
  },
  profileCopy: {
    flex: layout.compact ? 0 : 1,
    minWidth: 0,
    gap: 4,
  },
  profileLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  profileTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  profileTag: {
    maxWidth: '100%',
    borderRadius: 6,
    backgroundColor: colors.soft,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  profileTagText: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: '600',
  },
  codeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  code: {
    width: layout.compact ? '100%' : '48%',
    borderRadius: 7,
    backgroundColor: colors.soft,
    padding: 10,
    color: colors.ink,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
}));
