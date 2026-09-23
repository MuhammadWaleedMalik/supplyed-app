import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from './theme';

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
  return (
    <Pressable
      accessibilityRole="button"
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
        style={[
          styles.label,
          (variant === 'text' || variant === 'social') && styles.darkLabel,
          variant === 'link' && styles.linkLabel,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primary: { backgroundColor: colors.blue },
  outline: { borderWidth: 1, borderColor: '#555b60' },
  text: { paddingHorizontal: 8, backgroundColor: 'transparent' },
  link: { paddingHorizontal: 4, backgroundColor: 'transparent' },
  social: {
    borderWidth: 1,
    borderColor: colors.border,
    width: '100%',
    paddingHorizontal: 10,
  },
  compact: { minHeight: 44, paddingHorizontal: 14, paddingVertical: 8 },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.5 },
  label: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  darkLabel: { color: colors.ink },
  linkLabel: { color: colors.blue },
});
