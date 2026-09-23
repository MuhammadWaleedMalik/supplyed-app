import { StyleSheet } from 'react-native';
import { colors } from '../Ui/theme';

export const styles = StyleSheet.create({
  keyboard: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: '#ffffff' },
  topBar: {
    minHeight: 58,
    paddingHorizontal: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  brand: { color: colors.ink, fontSize: 20, fontWeight: '700' },
  brandBlue: { color: colors.blue },
  scroll: { flexGrow: 1, padding: 12, paddingBottom: 170, backgroundColor: '#fbfcfd' },
  panels: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    overflow: 'hidden',
    flexGrow: 1,
  },
  widePanels: {
    flexDirection: 'row',
    maxWidth: 1500,
    alignSelf: 'center',
    width: '100%',
  },
  main: { flex: 1, padding: 20, gap: 24 },
  fields: { flexGrow: 1 },
});

