import { StyleSheet } from 'react-native';
import { colors } from '../Ui/theme';

export const jobStyles = StyleSheet.create({
  shell: {
    gap: 18,
  },
  progressShell: {
    gap: 13,
  },
  titleCopy: {
    flex: 1,
    gap: 4,
  },
  wizard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    padding: 16,
    gap: 16,
  },
  progressHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressCopy: {
    flex: 1,
    gap: 4,
  },
  stepLabel: {
    color: colors.blue,
    fontSize: 10,
    fontWeight: '800',
  },
  flowTitle: {
    color: colors.ink,
    fontSize: 23,
    fontWeight: '800',
  },
  close: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progress: {
    flexDirection: 'row',
    gap: 7,
  },
  progressBar: {
    height: 5,
    flex: 1,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  progressActive: {
    backgroundColor: colors.blue,
  },
  modeGrid: {
    gap: 12,
  },
  modeCard: {
    minHeight: 156,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 18,
    backgroundColor: '#ffffff',
    justifyContent: 'space-between',
    gap: 14,
  },
  modePrimary: {
    borderColor: colors.blue,
    backgroundColor: colors.paleBlue,
  },
  modeIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  modeTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '800',
  },
  modeBody: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
  },
  formSection: {
    gap: 13,
    paddingTop: 4,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  row: {
    gap: 12,
  },
  choiceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  choice: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  choiceActive: {
    borderColor: colors.blue,
    backgroundColor: colors.paleBlue,
  },
  choiceText: {
    color: colors.muted,
    fontWeight: '700',
    fontSize: 13,
  },
  choiceTextActive: {
    color: '#006b93',
  },
  actions: {
    gap: 9,
    paddingTop: 4,
  },
  summary: {
    padding: 14,
    borderRadius: 8,
    backgroundColor: colors.soft,
    gap: 5,
  },
  error: {
    color: '#b4233f',
    fontSize: 12,
    lineHeight: 18,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  listTitle: {
    flex: 1,
    color: colors.ink,
    fontSize: 24,
    fontWeight: '800',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#edf9f1',
  },
  statusText: {
    color: '#17783b',
    fontSize: 10,
    fontWeight: '800',
  },
});
