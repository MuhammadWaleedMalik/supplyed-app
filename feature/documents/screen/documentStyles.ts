import { StyleSheet } from 'react-native';
import { colors } from '../../../components/Ui/theme';

export const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#ffffff' },
  keyboard: { flex: 1 },
  topBar: {
    minHeight: 58,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: { color: colors.ink, fontSize: 20, fontWeight: '700' },
  brandBlue: { color: colors.blue },
  scroll: { flexGrow: 1, padding: 12, paddingBottom: 170, backgroundColor: '#fbfcfd' },
  panels: {
    flexGrow: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  widePanels: {
    width: '100%',
    maxWidth: 1500,
    alignSelf: 'center',
    flexDirection: 'row',
  },
});

