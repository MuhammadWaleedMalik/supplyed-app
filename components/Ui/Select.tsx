import { Check, ChevronDown, Search, X } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { readChoices, writeChoices } from '../../utils/ui/choices';
import Button from './Button';
import { createThemedStyles, useTheme } from './theme';

type Option = {
  value: string;
  label: string;
  aliases?: string[];
  group?: string | null;
};

type Props = {
  label: string;
  value: string;
  placeholder: string;
  options: (string | Option)[];
  multiple?: boolean;
  maxSelections?: number;
  disabled?: boolean;
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
  multiple,
  maxSelections,
  disabled,
}: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const choices = useMemo(
    () =>
      options.map(option =>
        typeof option === 'string' ? { value: option, label: option } : option,
      ),
    [options],
  );
  const filteredChoices = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return choices.filter(option =>
      [option.label, option.value, option.group, ...(option.aliases || [])]
        .join(' ')
        .toLocaleLowerCase()
        .includes(query),
    );
  }, [choices, search]);
  const selectedValues = multiple ? readChoices(value) : value ? [value] : [];
  const retired = selectedValues.filter(
    item => !choices.some(option => option.value === item),
  );
  const selectedLabels = selectedValues.map(
    item => choices.find(option => option.value === item)?.label || item,
  );
  const display =
    selectedLabels.slice(0, 2).join(', ') +
    (selectedLabels.length > 2 ? ` +${selectedLabels.length - 2} more` : '');
  const atLimit = !!maxSelections && selectedValues.length >= maxSelections;

  function chooseOption(option: string) {
    if (multiple) {
      const selected = selectedValues.includes(option);
      if (!selected && atLimit) return;
      onChange(
        writeChoices(
          selected
            ? selectedValues.filter(item => item !== option)
            : [...selectedValues, option],
        ),
      );
    } else {
      onChange(option);
      setOpen(false);
    }
  }

  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: display || placeholder }}
        accessibilityState={{ expanded: open, disabled: !!disabled }}
        disabled={disabled}
        onPress={() => {
          setSearch('');
          setOpen(true);
        }}
        style={({ pressed }) => [
          styles.button,
          error && styles.invalid,
          disabled && styles.disabled,
          pressed && styles.buttonPressed,
        ]}
      >
        <Text
          numberOfLines={1}
          style={[styles.value, !value && styles.placeholder]}
        >
          {display || placeholder}
        </Text>
        <ChevronDown color={colors.muted} size={19} />
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!disabled && retired.length ? (
        <Text style={styles.error}>
          Review saved choices: {retired.join(', ')}. They are no longer in this
          menu.
        </Text>
      ) : null}

      <Modal
        visible={open && !disabled}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close options"
            onPress={() => setOpen(false)}
            style={styles.backdrop}
          />
          <View
            style={[
              styles.sheet,
              {
                height: Math.min(
                  height * 0.82,
                  680,
                  260 + choices.length * 64 + (multiple ? 64 : 0),
                ),
                paddingBottom: Math.max(insets.bottom, 16),
              },
            ]}
            accessibilityViewIsModal
          >
            <View style={styles.handle} />
            <View style={styles.sheetHeader}>
              <View style={styles.sheetCopy}>
                <Text style={styles.sheetTitle}>{label}</Text>
                {multiple ? (
                  <Text style={styles.hint} accessibilityLiveRegion="polite">
                    {selectedValues.length} selected
                    {maxSelections ? ` · Choose up to ${maxSelections}` : ''}
                  </Text>
                ) : null}
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close options"
                onPress={() => setOpen(false)}
                style={styles.closeButton}
              >
                <X color={colors.ink} size={22} />
              </Pressable>
            </View>
            <View style={styles.searchRow}>
              <Search color={colors.muted} size={19} />
              <TextInput
                accessibilityLabel={'Search ' + label}
                placeholder="Search choices"
                placeholderTextColor={colors.muted}
                value={search}
                onChangeText={setSearch}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                style={styles.search}
              />
              {search ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Clear search"
                  onPress={() => setSearch('')}
                  style={styles.closeButton}
                >
                  <X color={colors.muted} size={18} />
                </Pressable>
              ) : null}
            </View>
            {value ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  onChange('');
                  if (!multiple) setOpen(false);
                }}
                style={styles.clearButton}
              >
                <Text style={styles.clearText}>Clear selection</Text>
              </Pressable>
            ) : null}
            <FlatList
              style={styles.list}
              data={filteredChoices}
              extraData={value}
              keyExtractor={option => option.value}
              initialNumToRender={12}
              maxToRenderPerBatch={12}
              windowSize={5}
              contentContainerStyle={styles.optionList}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              renderItem={({ item: option }) => {
                const selected = selectedValues.includes(option.value);
                const unavailable = !!multiple && atLimit && !selected;
                return (
                  <Pressable
                    accessibilityRole={multiple ? 'checkbox' : 'radio'}
                    accessibilityState={{
                      checked: selected,
                      disabled: unavailable,
                    }}
                    disabled={unavailable}
                    onPress={() => chooseOption(option.value)}
                    style={({ pressed }) => [
                      styles.option,
                      selected && styles.selectedOption,
                      unavailable && styles.disabled,
                      pressed && styles.buttonPressed,
                    ]}
                  >
                    <View style={styles.optionCopy}>
                      <Text
                        style={[
                          styles.optionText,
                          selected && styles.selectedOptionText,
                        ]}
                      >
                        {option.label}
                      </Text>
                      {option.group ? (
                        <Text style={styles.hint}>{option.group}</Text>
                      ) : null}
                    </View>
                    {selected ? (
                      <Check
                        color={colors.brandDark}
                        size={21}
                        strokeWidth={2.5}
                      />
                    ) : null}
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={styles.optionText}>
                    {search.trim()
                      ? 'No matching choices'
                      : 'No choices available'}
                  </Text>
                  <Text style={styles.hint}>
                    {search.trim()
                      ? 'Try a different name or abbreviation.'
                      : 'Try refreshing the choices.'}
                  </Text>
                </View>
              }
              ListFooterComponent={
                <>
                  {retired.map(item => (
                    <Pressable
                      key={item}
                      accessibilityRole="button"
                      onPress={() =>
                        multiple
                          ? onChange(
                              writeChoices(
                                selectedValues.filter(
                                  selected => selected !== item,
                                ),
                              ),
                            )
                          : onChange('')
                      }
                      style={styles.option}
                    >
                      <Text style={styles.error}>
                        Remove saved choice: {item}
                      </Text>
                    </Pressable>
                  ))}
                </>
              }
            />
            {multiple ? (
              <View style={styles.footer}>
                <Button title="Done" onPress={() => setOpen(false)} />
              </View>
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const useStyles = createThemedStyles((colors, common) => ({
  field: { width: '100%', gap: 7 },
  label: { ...common.bold, fontSize: 12 },
  required: { color: '#c93652' },
  button: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  buttonPressed: { backgroundColor: colors.soft },
  disabled: { opacity: 0.5 },
  value: { flex: 1, color: colors.ink, fontSize: 15, fontWeight: '500' },
  placeholder: { color: colors.muted, fontWeight: '400' },
  invalid: { borderColor: '#c93652' },
  error: { color: '#c93652', fontSize: 12, lineHeight: 18 },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(9, 20, 29, 0.48)',
  },
  sheet: {
    flexShrink: 1,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginTop: 10,
  },
  sheetHeader: {
    minHeight: 72,
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sheetCopy: { flex: 1, gap: 4 },
  sheetTitle: { color: colors.ink, fontSize: 20, fontWeight: '700' },
  hint: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  closeButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingLeft: 14,
    borderRadius: 12,
    backgroundColor: colors.soft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  search: {
    flex: 1,
    minHeight: 48,
    paddingVertical: 10,
    paddingRight: 12,
    color: colors.ink,
    fontSize: 16,
  },
  clearButton: {
    minHeight: 48,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  clearText: { color: colors.brandDark, fontSize: 14, fontWeight: '600' },
  list: { flex: 1 },
  optionList: { paddingHorizontal: 12, paddingBottom: 12 },
  option: {
    minHeight: 54,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionCopy: { flex: 1, gap: 2 },
  selectedOption: { backgroundColor: colors.brandTint },
  optionText: { color: colors.ink, fontSize: 15, lineHeight: 22 },
  selectedOptionText: { color: colors.brandDark, fontWeight: '700' },
  empty: { padding: 24, gap: 8, alignItems: 'center' },
  footer: {
    paddingTop: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
}));
