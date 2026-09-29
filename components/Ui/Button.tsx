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
        numberOfLines={2}
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
    minHeight: 46,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primary: {
    backgroundColor: colors.blue,
  },
  outline: {
    borderWidth: 1,
    borderColor: '#7b8794',
    backgroundColor: 'transparent',
  },
  text: {
    paddingHorizontal: 8,
    backgroundColor: 'transparent',
  },
  link: {
    minHeight: 40,
    paddingHorizontal: 4,
    backgroundColor: 'transparent',
  },
  social: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
  },
  compact: {
    minHeight: 40,
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
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  darkLabel: {
    color: colors.ink,
  },
  linkLabel: {
    color: '#006b93',
  },
});
