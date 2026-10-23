import React from 'react';
import { View } from 'react-native';
import DateField from './DateField';
import Input from './Input';

type Props = {
  label: string;
  value: string;
  minimum?: string;
  timezone?: string;
  error?: string;
  onChange: (value: string) => void;
};
export default function WorkDateField({
  label,
  value,
  minimum,
  onChange,
  timezone = 'Europe/London',
  error,
}: Props) {
  const [date = '', time = ''] = value.split('T');
  return (
    <View>
      <DateField
        label={label}
        value={date}
        error={error}
        minimum={minimum?.slice(0, 10)}
        onChange={next => onChange(next + 'T' + (time || '09:00'))}
      />
      <Input
        label={'Time in ' + timezone + ' (HH:mm)'}
        value={time}
        error={error ? 'Check the date and time above.' : undefined}
        placeholder="09:00"
        onChangeText={next => onChange(date + 'T' + next)}
      />
    </View>
  );
}
