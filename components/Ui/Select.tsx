import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, common } from './theme';

type Props = {
  label: string;
  value: string;
  placeholder: string;
  options: string[];
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
};

export default function Select({
  label,
  value,
  placeholder,
  options,
  onChange,
  required,
  error,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(!open)}
        style={[styles.button, error && styles.invalid]}
      >
        <Text style={[styles.value, !value && styles.placeholder]}>
          {value || placeholder}
        </Text>
        <Text style={styles.arrow}>{open ? '^' : 'v'}</Text>
      </Pressable>
      {open && (
        <View style={styles.options}>
          {options.map(option => (
            <Pressable
              key={option}
              accessibilityRole="button"
              onPress={() => {
                onChange(option);
                setOpen(false);
              }}
              style={styles.option}
            >
              <Text style={styles.value}>{option}</Text>
            </Pressable>
          ))}
        </View>
      )}
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { width: '100%', gap: 7 },
  label: { ...common.bold, fontSize: 11, letterSpacing: 0.8 },
  required: { color: '#db4262' },
  button: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 9,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
  },
  value: { color: colors.ink, fontSize: 15, flex: 1 },
  placeholder: { color: '#8d9baa' },
  arrow: { color: colors.muted, fontSize: 15 },
  options: { borderWidth: 1, borderColor: colors.border, borderRadius: 9 },
  option: { minHeight: 44, paddingHorizontal: 13, justifyContent: 'center' },
  invalid: { borderColor: '#c93251' },
  error: { color: '#c93251', fontSize: 12 },
});
