import React, { ComponentRef, useRef } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { colors } from '../Ui/theme';

const positions = [0, 1, 2, 3, 4, 5];
type CodeInputRef = ComponentRef<typeof TextInput>;

type Props = {
  digits: string[];
  onChange: (index: number, value: string) => void;
};

export default function CodeInputs({ digits, onChange }: Props) {
  const refs = useRef<Array<CodeInputRef | null>>([]);

  function changeCode(index: number, value: string) {
    const numbers = value.replace(/\D/g, '');
    onChange(index, numbers);
    if (numbers.length === 1 && index < 5) refs.current[index + 1]?.focus();
    if (numbers.length > 1) refs.current[Math.min(index + numbers.length, 5)]?.focus();
  }

  function pressKey(index: number, key: string) {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  }

  return (
    <View style={styles.row}>
      {positions.map(index => (
        <TextInput
          key={index}
          ref={input => { refs.current[index] = input; }}
          accessibilityLabel={'Code digit ' + (index + 1)}
          keyboardType="number-pad"
          maxLength={6}
          value={digits[index]}
          onChangeText={value => changeCode(index, value)}
          onKeyPress={({ nativeEvent }) => pressKey(index, nativeEvent.key)}
          style={styles.input}
          textAlign="center"
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 54,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 9,
    backgroundColor: '#ffffff',
    color: colors.ink,
    fontSize: 22,
  },
});
