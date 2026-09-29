import { Check, ChevronDown, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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

  function chooseOption(option: string) {
    onChange(option);
    setOpen(false);
  }

  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.button,
          error && styles.invalid,
          pressed && styles.buttonPressed,
        ]}
      >
        <Text
          numberOfLines={1}
          style={[styles.value, !value && styles.placeholder]}
        >
          {value || placeholder}
        </Text>
        <ChevronDown color={colors.muted} size={19} />
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.overlay}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close options"
            onPress={() => setOpen(false)}
            style={styles.backdrop}
          />

          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <View style={styles.sheetCopy}>
                <Text style={styles.sheetLabel}>SELECT</Text>
                <Text style={styles.sheetTitle}>{label}</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close options"
                onPress={() => setOpen(false)}
                style={styles.closeButton}
              >
                <X color={colors.ink} size={20} />
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={styles.optionList}
              keyboardShouldPersistTaps="handled"
            >
              {options.map(option => {
                const selected = option === value;

                return (
                  <Pressable
                    key={option}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => chooseOption(option)}
                    style={({ pressed }) => [
                      styles.option,
                      selected && styles.selectedOption,
                      pressed && styles.optionPressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        selected && styles.selectedOptionText,
                      ]}
                    >
                      {option}
                    </Text>
                    {selected ? (
                      <Check color={colors.blue} size={19} strokeWidth={2.5} />
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    width: '100%',
    gap: 7,
  },
  label: {
    ...common.bold,
    fontSize: 12,
  },
  required: {
    color: '#c93652',
  },
  button: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#c7d0d9',
    borderRadius: 8,
    paddingHorizontal: 14,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  buttonPressed: {
    backgroundColor: colors.soft,
  },
  value: {
    flex: 1,
    color: colors.ink,
    fontSize: 14,
    fontWeight: '500',
  },
  placeholder: {
    color: '#7b8794',
    fontWeight: '400',
  },
  invalid: {
    borderColor: '#c93652',
  },
  error: {
    color: '#c93652',
    fontSize: 12,
    lineHeight: 18,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(9, 20, 29, 0.48)',
  },
  sheet: {
    maxHeight: '72%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: '#ffffff',
    paddingBottom: 18,
  },
  sheetHeader: {
    minHeight: 70,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sheetCopy: {
    flex: 1,
    gap: 3,
  },
  sheetLabel: {
    color: colors.blue,
    fontSize: 10,
    fontWeight: '800',
  },
  sheetTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionList: {
    padding: 10,
  },
  option: {
    minHeight: 50,
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectedOption: {
    backgroundColor: colors.paleBlue,
  },
  optionPressed: {
    backgroundColor: colors.soft,
  },
  optionText: {
    flex: 1,
    color: colors.ink,
    fontSize: 15,
  },
  selectedOptionText: {
    color: '#006b93',
    fontWeight: '700',
  },
});
