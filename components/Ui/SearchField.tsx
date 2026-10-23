import React from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { createThemedStyles, useTheme } from './theme';

type Props = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  onSubmit?: () => void;
};

export default function SearchField({
  value,
  onChangeText,
  placeholder,
  onSubmit,
}: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.field}>
      <Search size={20} color={colors.muted} />
      <TextInput
        accessibilityLabel={placeholder}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
        autoCorrect={false}
        maxLength={100}
        style={styles.input}
      />
      {value ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          onPress={() => onChangeText('')}
          style={styles.clear}
        >
          <X size={18} color={colors.muted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const useStyles = createThemedStyles(colors => ({
  field: {
    minHeight: 50,
    paddingLeft: 14,
    paddingRight: 2,
    backgroundColor: '#fff',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: { flex: 1, minHeight: 48, color: colors.ink, fontSize: 16 },
  clear: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
