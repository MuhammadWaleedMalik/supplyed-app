import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import type {
  JobSchedule,
  JobSlot,
} from '../../feature/dashboard/shared/apis/jobsApi';
import Button from '../Ui/Button';
import Checkbox from '../Ui/Checkbox';
import DateField from '../Ui/DateField';
import Input from '../Ui/Input';
import ChoiceField from './ChoiceField';
import { useJobStyles } from './jobStyles';

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const fallback: JobSchedule = {
  weekdays: [1, 2, 3, 4, 5].map(day => ({
    day,
    slots: [{ start: '09:00', end: '17:00' }],
  })),
  exceptions: [],
};

function read(value: string): JobSchedule {
  try {
    const parsed = JSON.parse(value) as JobSchedule;
    return Array.isArray(parsed.weekdays) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export default function JobScheduleEditor({
  value,
  disabled,
  onChange,
}: {
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  const styles = useJobStyles();
  const schedule = useMemo(() => read(value), [value]);
  const [exceptionDate, setExceptionDate] = useState('');
  const [exceptionKind, setExceptionKind] = useState('Exclude');
  const [exceptionStart, setExceptionStart] = useState('09:00');
  const [exceptionEnd, setExceptionEnd] = useState('17:00');

  function write(next: JobSchedule) {
    onChange(
      JSON.stringify({ ...next, exceptions: next.exceptions || [] }),
    );
  }

  function toggleDay(day: number, enabled: boolean) {
    write({
      ...schedule,
      weekdays: enabled
        ? [
            ...schedule.weekdays,
            { day, slots: [{ start: '09:00', end: '17:00' }] },
          ].sort((left, right) => left.day - right.day)
        : schedule.weekdays.filter(item => item.day !== day),
    });
  }

  function changeSlot(
    day: number,
    index: number,
    field: keyof JobSlot,
    nextValue: string,
  ) {
    write({
      ...schedule,
      weekdays: schedule.weekdays.map(item =>
        item.day === day
          ? {
              ...item,
              slots: item.slots.map((slot, slotIndex) =>
                slotIndex === index ? { ...slot, [field]: nextValue } : slot,
              ),
            }
          : item,
      ),
    });
  }

  function addSlot(day: number) {
    write({
      ...schedule,
      weekdays: schedule.weekdays.map(item =>
        item.day === day
          ? {
              ...item,
              slots: [...item.slots, { start: '09:00', end: '17:00' }],
            }
          : item,
      ),
    });
  }

  function removeSlot(day: number, index: number) {
    write({
      ...schedule,
      weekdays: schedule.weekdays.map(item =>
        item.day === day
          ? {
              ...item,
              slots: item.slots.filter((_, slotIndex) => slotIndex !== index),
            }
          : item,
      ),
    });
  }

  function addException() {
    if (!exceptionDate) return;
    const kind = exceptionKind.toLowerCase() as
      | 'add'
      | 'exclude'
      | 'replace';
    const next = {
      date: exceptionDate,
      kind,
      ...(kind === 'exclude'
        ? {}
        : { slots: [{ start: exceptionStart, end: exceptionEnd }] }),
    };
    write({
      ...schedule,
      exceptions: [
        ...(schedule.exceptions || []).filter(
          item => item.date !== exceptionDate,
        ),
        next,
      ].sort((left, right) => left.date.localeCompare(right.date)),
    });
    setExceptionDate('');
  }

  function changeExceptionSlot(
    date: string,
    index: number,
    field: keyof JobSlot,
    nextValue: string,
  ) {
    write({
      ...schedule,
      exceptions: schedule.exceptions?.map(exception =>
        exception.date === date
          ? {
              ...exception,
              slots: exception.slots?.map((slot, slotIndex) =>
                slotIndex === index ? { ...slot, [field]: nextValue } : slot,
              ),
            }
          : exception,
      ),
    });
  }

  function addExceptionSlot(date: string) {
    write({
      ...schedule,
      exceptions: schedule.exceptions?.map(exception =>
        exception.date === date
          ? {
              ...exception,
              slots: [
                ...(exception.slots || []),
                { start: '09:00', end: '17:00' },
              ],
            }
          : exception,
      ),
    });
  }

  function removeExceptionSlot(date: string, index: number) {
    write({
      ...schedule,
      exceptions: schedule.exceptions?.map(exception =>
        exception.date === date
          ? {
              ...exception,
              slots: exception.slots?.filter(
                (_, slotIndex) => slotIndex !== index,
              ),
            }
          : exception,
      ),
    });
  }

  return (
    <View style={styles.formSection}>
      <Text style={styles.sectionTitle}>Recurring working hours</Text>
      <Text style={styles.modeBody}>
        Use whole-hour times. Add split shifts when the working day has a gap.
      </Text>
      {DAY_NAMES.map((name, day) => {
        const weekday = schedule.weekdays.find(item => item.day === day);
        return (
          <View key={name} style={styles.formSection}>
            <Checkbox
              label={name}
              checked={Boolean(weekday)}
              disabled={disabled}
              onChange={enabled => toggleDay(day, enabled)}
            />
            {weekday?.slots.map((slot, index) => (
              <View key={`${day}-${index}`} style={styles.formSection}>
                <Input
                  label="START (HH:00)"
                  value={slot.start}
                  disabled={disabled}
                  onChangeText={next => changeSlot(day, index, 'start', next)}
                />
                <Input
                  label="END (HH:00)"
                  value={slot.end}
                  disabled={disabled}
                  onChangeText={next => changeSlot(day, index, 'end', next)}
                />
                {weekday.slots.length > 1 ? (
                  <Button
                    title="Remove shift"
                    variant="link"
                    compact
                    disabled={disabled}
                    onPress={() => removeSlot(day, index)}
                  />
                ) : null}
              </View>
            ))}
            {weekday ? (
              <Button
                title="Add split shift"
                variant="social"
                compact
                disabled={disabled}
                onPress={() => addSlot(day)}
              />
            ) : null}
          </View>
        );
      })}

      <Text style={styles.sectionTitle}>Date exceptions</Text>
      {(schedule.exceptions || []).map(item => (
        <View key={item.date} style={styles.formSection}>
          <Text style={styles.modeBody}>
            {item.date} · {item.kind}
          </Text>
          {item.slots?.map((slot, index) => (
            <View key={`${item.date}-${index}`} style={styles.formSection}>
              <Input
                label="START (HH:00)"
                value={slot.start}
                disabled={disabled}
                onChangeText={next =>
                  changeExceptionSlot(item.date, index, 'start', next)
                }
              />
              <Input
                label="END (HH:00)"
                value={slot.end}
                disabled={disabled}
                onChangeText={next =>
                  changeExceptionSlot(item.date, index, 'end', next)
                }
              />
              {item.slots && item.slots.length > 1 ? (
                <Button
                  title="Remove exception shift"
                  variant="link"
                  compact
                  disabled={disabled}
                  onPress={() => removeExceptionSlot(item.date, index)}
                />
              ) : null}
            </View>
          ))}
          {item.kind !== 'exclude' ? (
            <Button
              title="Add exception shift"
              variant="social"
              compact
              disabled={disabled}
              onPress={() => addExceptionSlot(item.date)}
            />
          ) : null}
          <Button
            title="Remove"
            variant="link"
            compact
            disabled={disabled}
            onPress={() =>
              write({
                ...schedule,
                exceptions: schedule.exceptions?.filter(
                  exception => exception.date !== item.date,
                ),
              })
            }
          />
        </View>
      ))}
      <DateField
        label="EXCEPTION DATE"
        value={exceptionDate}
        onChange={setExceptionDate}
      />
      <ChoiceField
        label="EXCEPTION TYPE"
        value={exceptionKind}
        options={['Exclude', 'Replace', 'Add']}
        onChange={setExceptionKind}
      />
      {exceptionKind !== 'Exclude' ? (
        <>
          <Input
            label="START (HH:00)"
            value={exceptionStart}
            onChangeText={setExceptionStart}
          />
          <Input
            label="END (HH:00)"
            value={exceptionEnd}
            onChangeText={setExceptionEnd}
          />
        </>
      ) : null}
      <Button
        title="Add or replace exception"
        variant="social"
        disabled={disabled || !exceptionDate}
        onPress={addException}
      />
    </View>
  );
}
