import React from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';
import { createThemedStyles } from './theme';

type Props = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'text' | 'link' | 'social' | 'danger';
  icon?: React.ReactNode;
  compact?: boolean;
  disabled?: boolean;
  loading?: boolean;
};

export default function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  compact,
  disabled,
  loading,
}: Props) {
  const styles = useStyles();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled || loading), busy: !!loading }}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        compact && styles.compact,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {loading ? <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? '#fff' : '#5f707b'} /> : icon}
      <Text
        style={[
          styles.label,
          (variant === 'text' ||
            variant === 'social' ||
            variant === 'outline') &&
            styles.darkLabel,
          variant === 'link' && styles.linkLabel,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const useStyles = createThemedStyles(colors => ({
  button: {
    minHeight: 48,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primary: {
    backgroundColor: colors.brandDark,
  },
  danger: { backgroundColor: '#b42318' },
  outline: {
    borderWidth: 1,
    borderColor: colors.brandBorder,
    backgroundColor: '#ffffff',
  },
  text: {
    paddingHorizontal: 8,
    backgroundColor: 'transparent',
  },
  link: {
    minHeight: 48,
    paddingHorizontal: 4,
    backgroundColor: 'transparent',
  },
  social: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.brandBorder,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
  },
  compact: {
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  pressed: {
    opacity: 0.72,
  },
  disabled: {
    opacity: 0.48,
  },
  label: {
    flexShrink: 1,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  darkLabel: {
    color: colors.ink,
  },
  linkLabel: {
    color: colors.brandDark,
  },
}));
