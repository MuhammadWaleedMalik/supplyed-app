import React from 'react';
import { Pressable, Text } from 'react-native';
import { SlidersHorizontal } from 'lucide-react-native';
import { createThemedStyles, useTheme } from './theme';

export default function FilterButton({
  count = 0,
  onPress,
}: {
  count?: number;
  onPress: () => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Filters${count ? ', ' + count + ' applied' : ''}`}
      onPress={onPress}
      style={[styles.button, count > 0 && styles.active]}
    >
      <SlidersHorizontal size={18} color={colors.brandDark} />
      <Text style={styles.label}>Filters{count ? ` (${count})` : ''}</Text>
    </Pressable>
  );
}

const useStyles = createThemedStyles(colors => ({
  button: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'flex-start',
  },
  active: { backgroundColor: colors.brandTint, borderColor: colors.brand },
  label: { color: colors.brandDark, fontSize: 14, fontWeight: '600' },
}));
