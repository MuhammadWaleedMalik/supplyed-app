import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { createThemedStyles, useTheme } from './theme';

/** A consistent, accessible navigation bar for detail pages and full-screen flows. */
export default function DetailHeader({
  title,
  subtitle,
  onBack,
  backLabel = 'Go back',
  disabled = false,
  action,
}: {
  title: string;
  subtitle?: string;
  onBack: () => void;
  backLabel?: string;
  disabled?: boolean;
  action?: React.ReactNode;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.header}>
      <Pressable
        onPress={onBack}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={backLabel}
        accessibilityState={{ disabled }}
        style={({ pressed }) => [
          styles.back,
          (pressed || disabled) && styles.dim,
        ]}
      >
        <ChevronLeft size={23} color={colors.ink} strokeWidth={2} />
      </Pressable>
      <View style={styles.copy}>
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  );
}
const useStyles = createThemedStyles(colors => ({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  back: {
    height: 44,
    width: 44,
    borderRadius: 14,
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dim: { opacity: 0.5 },
  copy: { flex: 1, minWidth: 0, gap: 3 },
  title: { fontSize: 17, fontWeight: '700', color: colors.ink, lineHeight: 24 },
  subtitle: { fontSize: 12, lineHeight: 18, color: colors.muted },
}));
