import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import AppIcon from './AppIcon';
import { colors } from './theme';
import { styles } from './inputStyles';
import { getKeyboardType } from '../../utils/ui/inputUtils';

type Props = {
  label?: string;
  placeholder?: string;
  password?: boolean;
  email?: boolean;
  phone?: boolean;
  number?: boolean;
  url?: boolean;
  multiline?: boolean;
  required?: boolean;
  half?: boolean;
  digit?: boolean;
  digitNumber?: number;
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
  url,
  multiline,
  required = true,
  half,
  digit,
  digitNumber,
  value,
  onChangeText,
  onFocus,
  onBlur,
  error,
}: Props) {
  const [visible, setVisible] = useState(false);

  if (digit) {
    return (
      <TextInput
        accessibilityLabel={'Code digit ' + digitNumber}
        keyboardType="number-pad"
        maxLength={1}
        value={value}
        onChangeText={onChangeText}
        style={styles.digit}
        textAlign="center"
      />
    );
  }

  return (
    <View style={[styles.field, half && styles.half]}>
      <Text style={styles.label}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <View style={[styles.inputRow, error && styles.invalid]}>
        <TextInput
          accessibilityLabel={label}
          placeholder={placeholder}
          placeholderTextColor="#8d9baa"
          style={[styles.input, multiline && styles.multiline]}
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          onBlur={onBlur}
          multiline={multiline}
          secureTextEntry={password && !visible}
          keyboardType={getKeyboardType(email, phone, number, url)}
          autoCapitalize={email || phone || number || url ? 'none' : 'sentences'}
        />
        {password ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Hide password' : 'Show password'}
            onPress={() => setVisible(!visible)}
            style={styles.eye}
          >
            <AppIcon name={visible ? 'eyeOff' : 'eye'} color={colors.muted} size={20} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}
