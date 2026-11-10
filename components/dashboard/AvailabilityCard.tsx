import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { CalendarCheck } from 'lucide-react-native';
import {
  AvailabilityException,
  AvailabilityWeekday,
  getAvailability,
  saveAvailability,
} from '../../feature/dashboard/teacher/apis/availabilityApi';
import { getSessionVersion } from '../../utils/api/session';
import Button from '../Ui/Button';
import Checkbox from '../Ui/Checkbox';
import DateField from '../Ui/DateField';
import Input from '../Ui/Input';
import ChoiceField from './ChoiceField';
import SettingsCardHeader from './SettingsCardHeader';
import { useSettingsStyles } from './settingsStyles';

const DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
const DEFAULT_DAYS = [1, 2, 3, 4, 5];
const TIME = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

function defaultWeekdays(): AvailabilityWeekday[] {
  return DEFAULT_DAYS.map(day => ({
    day,
    slots: [{ start: '08:00', end: '17:00' }],
  }));
}

function problemMessage(problem: unknown) {
  return problem instanceof Error
    ? problem.message
    : 'Unable to update availability.';
}

export default function AvailabilityCard() {
  const styles = useSettingsStyles();
  const [weekdays, setWeekdays] = useState(defaultWeekdays);
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([]);
  const [bookings, setBookings] = useState<
    { id: string; title: string; start: string | null }[]
  >([]);
  const [timeZone, setTimeZone] = useState('Europe/London');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [exceptionDate, setExceptionDate] = useState('');
  const [exceptionKind, setExceptionKind] = useState('Exclude');
  const [exceptionStart, setExceptionStart] = useState('08:00');
  const [exceptionEnd, setExceptionEnd] = useState('17:00');
  const mounted = useRef(true);

  const load = useCallback(async () => {
    const version = getSessionVersion();
    setLoading(true);
    setError('');
    try {
      const snapshot = await getAvailability();
      if (!mounted.current || version !== getSessionVersion()) return;
      if (snapshot.availability) {
        setTimeZone(snapshot.availability.timeZone || 'Europe/London');
        setWeekdays(snapshot.availability.weeklySchedule.weekdays || []);
        setExceptions(snapshot.availability.exceptions || []);
      }
      setBookings(
        (snapshot.bookings || []).map(item => ({
          id: item.id,
          title: item.job.title,
          start: item.startDate,
        })),
      );
    } catch (problem) {
      if (mounted.current && version === getSessionVersion())
        setError(problemMessage(problem));
    } finally {
      if (mounted.current && version === getSessionVersion()) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    load();
    return () => {
      mounted.current = false;
    };
  }, [load]);

  function toggleDay(day: number, enabled: boolean) {
    setSaved('');
    setWeekdays(current =>
      enabled
        ? [...current, { day, slots: [{ start: '08:00', end: '17:00' }] }].sort(
            (left, right) => left.day - right.day,
          )
        : current.filter(item => item.day !== day),
    );
  }

  function changeTime(
    day: number,
    index: number,
    field: 'start' | 'end',
    value: string,
  ) {
    setSaved('');
    setWeekdays(current =>
      current.map(item =>
        item.day === day
          ? {
              ...item,
              slots: item.slots.map((slot, slotIndex) =>
                slotIndex === index ? { ...slot, [field]: value } : slot,
              ),
            }
          : item,
      ),
    );
  }

  function addSlot(day: number) {
    setSaved('');
    setWeekdays(current =>
      current.map(item =>
        item.day === day
          ? {
              ...item,
              slots: [...item.slots, { start: '08:00', end: '17:00' }],
            }
          : item,
      ),
    );
  }

  function removeSlot(day: number, index: number) {
    setSaved('');
    setWeekdays(current =>
      current.map(item =>
        item.day === day
          ? {
              ...item,
              slots: item.slots.filter((_, slotIndex) => slotIndex !== index),
            }
          : item,
      ),
    );
  }

  function addException() {
    setError('');
    if (!exceptionDate) {
      setError('Choose the date for this availability exception.');
      return;
    }
    if (exceptions.some(item => item.date === exceptionDate)) {
      setError('That date already has an exception. Remove it before replacing it.');
      return;
    }
    const kind = exceptionKind.toLowerCase() as AvailabilityException['kind'];
    if (kind !== 'exclude' && (!TIME.test(exceptionStart) || !TIME.test(exceptionEnd) || exceptionStart === exceptionEnd)) {
      setError('Enter valid, different start and end times in HH:mm format.');
      return;
    }
    setExceptions(current => [
      ...current,
      {
        date: exceptionDate,
        kind,
        ...(kind === 'exclude'
          ? {}
          : { slots: [{ start: exceptionStart, end: exceptionEnd }] }),
      },
    ].sort((left, right) => left.date.localeCompare(right.date)));
    setExceptionDate('');
    setSaved('');
  }

  function changeExceptionTime(
    date: string,
    index: number,
    field: 'start' | 'end',
    value: string,
  ) {
    setSaved('');
    setExceptions(current =>
      current.map(exception =>
        exception.date === date
          ? {
              ...exception,
              slots: exception.slots?.map((slot, slotIndex) =>
                slotIndex === index ? { ...slot, [field]: value } : slot,
              ),
            }
          : exception,
      ),
    );
  }

  function addExceptionSlot(date: string) {
    setSaved('');
    setExceptions(current =>
      current.map(exception =>
        exception.date === date
          ? {
              ...exception,
              slots: [
                ...(exception.slots || []),
                { start: '08:00', end: '17:00' },
              ],
            }
          : exception,
      ),
    );
  }

  function removeExceptionSlot(date: string, index: number) {
    setSaved('');
    setExceptions(current =>
      current.map(exception =>
        exception.date === date
          ? {
              ...exception,
              slots: exception.slots?.filter(
                (_, slotIndex) => slotIndex !== index,
              ),
            }
          : exception,
      ),
    );
  }

  async function save() {
    if (saving) return;
    if (!weekdays.length) {
      setError('Choose at least one recurring available day.');
      return;
    }
    if (
      weekdays.some(
        item =>
          !item.slots.length ||
          item.slots.some(
            slot =>
              !TIME.test(slot.start) ||
              !TIME.test(slot.end) ||
              slot.start === slot.end,
          ),
      )
    ) {
      setError('Every selected day needs valid, different start and end times.');
      return;
    }
    if (
      exceptions.some(
        item =>
          item.kind !== 'exclude' &&
          (!item.slots?.length ||
            item.slots.some(
              slot =>
                !TIME.test(slot.start) ||
                !TIME.test(slot.end) ||
                slot.start === slot.end,
            )),
      )
    ) {
      setError('Every availability exception needs valid, non-zero time slots.');
      return;
    }
    const version = getSessionVersion();
    setSaving(true);
    setError('');
    setSaved('');
    try {
      const result = await saveAvailability(timeZone, weekdays, exceptions);
      if (!mounted.current || version !== getSessionVersion()) return;
      setWeekdays(result.weeklySchedule.weekdays);
      setExceptions(result.exceptions || []);
      setSaved('Availability saved. Active applications were rechecked for clashes.');
    } catch (problem) {
      if (mounted.current && version === getSessionVersion())
        setError(problemMessage(problem));
    } finally {
      if (mounted.current && version === getSessionVersion()) setSaving(false);
    }
  }

  return (
    <View style={styles.section}>
      <View style={styles.card}>
        <SettingsCardHeader
          icon={CalendarCheck}
          title="TEACHING AVAILABILITY"
          note="Set your normal weekly hours and date-specific exceptions. Times use the school marketplace time zone."
        />
        <Input
          label="TIME ZONE"
          value={timeZone}
          disabled={saving}
          onChangeText={setTimeZone}
        />
        <Text style={styles.sectionHeading}>Weekly schedule</Text>
        <Text style={styles.cardNote}>Turn on only the days when schools may book you, then set one or more time ranges.</Text>
        {DAYS.map((label, day) => {
          const entry = weekdays.find(item => item.day === day);
          return (
            <View key={label} style={styles.availabilityDay}>
              <Checkbox
                label={label}
                checked={Boolean(entry)}
                disabled={saving}
                onChange={enabled => toggleDay(day, enabled)}
              />
              {entry ? (
                <View style={styles.scheduleBody}>
                  {entry.slots.map((slot, index) => (
                    <View key={`${day}-${index}`} style={styles.availabilitySlot}>
                      <Input
                        label="START (HH:mm)"
                        value={slot.start}
                        disabled={saving}
                        onChangeText={value =>
                          changeTime(day, index, 'start', value)
                        }
                      />
                      <Input
                        label="END (HH:mm)"
                        value={slot.end}
                        disabled={saving}
                        onChangeText={value =>
                          changeTime(day, index, 'end', value)
                        }
                      />
                      {entry.slots.length > 1 ? (
                        <Button
                          title="Remove time slot"
                          variant="link"
                          compact
                          disabled={saving}
                          onPress={() => removeSlot(day, index)}
                        />
                      ) : null}
                    </View>
                  ))}
                  <Button
                    title="Add split availability"
                    variant="social"
                    compact
                    disabled={saving}
                    onPress={() => addSlot(day)}
                  />
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
      <View style={styles.card}>
        <Text style={styles.sectionHeading}>Date exceptions</Text>
        <Text style={styles.cardNote}>Override your normal schedule for a specific date.</Text>
        {exceptions.map(item => (
          <View key={item.date} style={styles.availabilityDay}>
            <Text style={styles.recordValue}>
              {item.date} · {item.kind}
            </Text>
            {item.slots?.map((slot, index) => (
              <View key={`${item.date}-${index}`} style={styles.availabilitySlot}>
                <Input
                  label="START (HH:mm)"
                  value={slot.start}
                  disabled={saving}
                  onChangeText={value =>
                    changeExceptionTime(item.date, index, 'start', value)
                  }
                />
                <Input
                  label="END (HH:mm)"
                  value={slot.end}
                  disabled={saving}
                  onChangeText={value =>
                    changeExceptionTime(item.date, index, 'end', value)
                  }
                />
                {item.slots && item.slots.length > 1 ? (
                  <Button
                    title="Remove exception slot"
                    variant="link"
                    compact
                    disabled={saving}
                    onPress={() => removeExceptionSlot(item.date, index)}
                  />
                ) : null}
              </View>
            ))}
            {item.kind !== 'exclude' ? (
              <Button
                title="Add exception slot"
                variant="social"
                compact
                disabled={saving}
                onPress={() => addExceptionSlot(item.date)}
              />
            ) : null}
            <Button
              title="Remove exception"
              variant="link"
              compact
              disabled={saving}
              onPress={() => {
                setExceptions(current => current.filter(row => row.date !== item.date));
                setSaved('');
              }}
            />
          </View>
        ))}
        {!exceptions.length ? (
          <Text style={styles.cardNote}>No date exceptions saved.</Text>
        ) : null}
        <DateField
          label="Exception date"
          value={exceptionDate}
          onChange={setExceptionDate}
        />
        <ChoiceField
          label="Exception type"
          value={exceptionKind}
          options={['Exclude', 'Replace', 'Add']}
          onChange={setExceptionKind}
        />
        {exceptionKind !== 'Exclude' ? (
          <>
            <Input label="START (HH:mm)" value={exceptionStart} onChangeText={setExceptionStart} />
            <Input label="END (HH:mm)" value={exceptionEnd} onChangeText={setExceptionEnd} />
          </>
        ) : null}
        <Button title="Add exception" variant="social" onPress={addException} disabled={saving} />
      </View>
      {bookings.length ? (
        <View style={styles.card}>
          <Text style={styles.recordLabel}>CONFIRMED WORK</Text>
          {bookings.map(item => (
            <Text key={item.id} style={styles.cardNote}>
              {item.title}{item.start ? ` · ${item.start.slice(0, 10)}` : ''}
            </Text>
          ))}
        </View>
      ) : null}
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      {saved ? <Text style={styles.success}>{saved}</Text> : null}
      <Button title={saving ? 'Saving...' : 'Save availability'} onPress={save} disabled={saving || loading} />
      <Button title={loading ? 'Refreshing...' : 'Refresh availability'} variant="social" onPress={load} disabled={saving || loading} />
    </View>
  );
}
