import DateTimePicker from '@react-native-community/datetimepicker';
import { CalendarDays } from 'lucide-react-native';
import React, { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { dateInputValue, inputDate } from '../../utils/jobs/dateUtils';
import { createThemedStyles, useTheme } from './theme';

type Props = {
  label: string;
  value: string;
  minimum?: string;
  error?: string;
  onChange: (value: string) => void;
};

export default function DateField({ label, value, minimum, error, onChange }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();

  const [open, setOpen] = useState(false);
  const selected = value
    ? inputDate(value)
    : inputDate(minimum || dateInputValue(new Date()));

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label + (error ? '. ' + error : '')}
        onPress={() => setOpen(true)}
        style={[styles.button, !!error && styles.invalid]}
      >
        <Text style={[styles.value, !value && styles.placeholder]}>
          {value || 'Select date'}
        </Text>
        <CalendarDays color={colors.brand} size={19} />
      </Pressable>
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      {open ? (
        <DateTimePicker
          value={selected}
          mode="date"
          minimumDate={minimum ? inputDate(minimum) : undefined}
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={(event, date) => {
            if (Platform.OS !== 'ios') setOpen(false);
            if (event.type !== 'dismissed' && date)
              onChange(dateInputValue(date));
          }}
        />
      ) : null}
      {open && Platform.OS === 'ios' ? (
        <Pressable onPress={() => setOpen(false)} style={styles.done}>
          <Text style={styles.doneText}>Done</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const useStyles = createThemedStyles(colors => ({
  field: { width: '100%', gap: 7 },
  label: { color: colors.ink, fontSize: 11, fontWeight: '700' },
  button: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 9,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  value: { color: colors.ink, fontSize: 15, flex: 1 },
  placeholder: { color: '#8d9baa' },
  invalid: { borderColor: '#b42318', backgroundColor: '#fff9f8' },
  error: { color: '#b42318', fontSize: 12, lineHeight: 19 },
  done: { alignSelf: 'flex-end', padding: 10 },
  doneText: { color: colors.brand, fontWeight: '700' },
}));
