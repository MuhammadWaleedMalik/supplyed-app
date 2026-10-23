import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import AppIcon from './AppIcon';
import { useTheme } from './theme';
import { useStyles } from './inputStyles';
import { getKeyboardType } from '../../utils/ui/inputUtils';

type Props = {
  label?: string;
  placeholder?: string;
  password?: boolean;
  email?: boolean;
  phone?: boolean;
  number?: boolean;
  decimal?: boolean;
  maxLength?: number;
  url?: boolean;
  multiline?: boolean;
  required?: boolean;
  half?: boolean;
  digit?: boolean;
  digitNumber?: number;
  disabled?: boolean;
  value?: string;
  onChangeText?: (text: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  error?: string;
};

export default function Input({
  label,
  placeholder,
  password,
  email,
  phone,
  number,
  decimal,
  maxLength,
  url,
  multiline,
  required = true,
  half,
  digit,
  digitNumber,
  disabled,
  value,
  onChangeText,
  onFocus,
  onBlur,
  error,
}: Props) {
  const { colors } = useTheme();
  const styles = useStyles();

  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  const handleFocus = () => {
    setFocused(true);
    onFocus?.();
  };
  const handleBlur = () => {
    setFocused(false);
    onBlur?.();
  };

  if (digit) {
    return (
      <TextInput
        accessibilityLabel={'Code digit ' + digitNumber}
        keyboardType="number-pad"
        maxLength={1}
        value={value}
        onChangeText={onChangeText}
        style={[styles.digit, focused && styles.focused]}
        onFocus={handleFocus}
        onBlur={handleBlur}
        selectionColor={colors.brand}
        textAlign="center"
      />
    );
  }

  return (
    <View style={[styles.field, half && styles.half]}>
      <Text style={styles.label}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <View
        style={[
          styles.inputRow,
          focused && styles.focused,
          error && styles.invalid,
          disabled && { backgroundColor: colors.soft },
        ]}
      >
        {phone ? <Text style={styles.label}>+44</Text> : null}
        <TextInput
          accessibilityLabel={label}
          placeholder={placeholder}
          placeholderTextColor="#8d9baa"
          style={[styles.input, multiline && styles.multiline]}
          value={phone && value?.startsWith('+44') ? value.slice(3) : value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          selectionColor={colors.brand}
          editable={!disabled}
          maxLength={maxLength}
          multiline={multiline}
          secureTextEntry={password && !visible}
          keyboardType={
            decimal ? 'decimal-pad' : getKeyboardType(email, phone, number, url)
          }
          autoCapitalize={
            email || phone || number || decimal || url ? 'none' : 'sentences'
          }
        />
        {password ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Hide password' : 'Show password'}
            onPress={() => setVisible(!visible)}
            style={styles.eye}
          >
            <AppIcon
              name={visible ? 'eyeOff' : 'eye'}
              color={colors.muted}
              size={20}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}
