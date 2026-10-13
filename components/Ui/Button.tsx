import React from 'react';
import { Pressable, Text } from 'react-native';
import { createThemedStyles } from './theme';

type Props = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'text' | 'link' | 'social';
  icon?: React.ReactNode;
  compact?: boolean;
  disabled?: boolean;
};

export default function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  compact,
  disabled,
}: Props) {
  const styles = useStyles();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        compact && styles.compact,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {icon}
      <Text
        numberOfLines={2}
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
    minHeight: 44,
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
    minHeight: 44,
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
