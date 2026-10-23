import { londonDate, zonedToIso } from './londonTime';

export type PlannedWorkUnits = { hours?: number | null; days?: number | null };
type Schedule = {
  payType: string;
  startDate: string;
  endDate: string;
  hours: string;
  days: string;
  scheduleError?: string;
};
const MAX = 2147483647;

export function calendarDay(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new Error('Enter a valid calendar date.');
  const time = Date.parse(value + 'T00:00:00Z');
  if (
    !Number.isFinite(time) ||
    new Date(time).toISOString().slice(0, 10) !== value
  )
    throw new Error('Enter a valid calendar date.');
  return time / 86400000;
}

export function shiftCalendarDay(value: string, days: number) {
  const date = new Date((calendarDay(value) + days) * 86400000);
  if (!Number.isFinite(date.getTime()) || date.getUTCFullYear() > 9999)
    throw new Error('Choose a shorter date range.');
  return date.toISOString().slice(0, 10);
}

export function plannedNumber(value: string, label: string) {
  if (!value.trim()) return null;
  const number = Number(value);
  if (
    !/^\d+$/.test(value.trim()) ||
    !Number.isInteger(number) ||
    number < 1 ||
    number > MAX
  )
    throw new Error(`${label} must be a whole number from 1 to 2,147,483,647.`);
  return number;
}

export function plannedPayload(form: Schedule) {
  if (form.scheduleError) throw new Error(form.scheduleError);
  return {
    hours:
      form.payType === 'hourly'
        ? plannedNumber(form.hours, 'Total hours')
        : null,
    days:
      form.payType === 'daily' ? plannedNumber(form.days, 'Total days') : null,
  };
}

function minutes(value: string) {
  return Number(value.slice(11, 13)) * 60 + Number(value.slice(14, 16));
}

// Called only by user edits. Loading a legacy record must preserve null units.
export function changeSchedule<T extends Schedule>(
  current: T,
  key: keyof T,
  value: string,
  timezone = 'Europe/London',
): T {
  const next = { ...current, [key]: value };
  if (
    !['hours', 'days', 'startDate', 'endDate', 'payType'].includes(String(key))
  )
    return next;
  next.scheduleError = '';
  if (next.payType !== 'hourly') next.hours = '';
  if (next.payType !== 'daily') next.days = '';
  if (next.payType === 'fixed') return next;
  try {
    const unit = next.payType === 'hourly' ? 'hours' : 'days';
    if (!next.payType) return next;
    const manual =
      key === unit || (key === 'startDate' && !next.endDate && !!next[unit]);
    if (manual) {
      const total = plannedNumber(next[unit], `Total ${unit}`);
      if (total === null || !next.startDate) return next;
      zonedToIso(next.startDate, timezone);
      if (unit === 'days') {
        const day = shiftCalendarDay(next.startDate.slice(0, 10), total - 1);
        let time = next.endDate.slice(11, 16) || next.startDate.slice(11, 16);
        if (total === 1 && time < next.startDate.slice(11, 16))
          time = next.startDate.slice(11, 16);
        const end = day + 'T' + time;
        zonedToIso(end, timezone);
        next.endDate = end;
      } else {
        const endDay = next.endDate.slice(0, 10) || next.startDate.slice(0, 10);
        const count =
          calendarDay(endDay) - calendarDay(next.startDate.slice(0, 10)) + 1;
        const dailyMinutes = (total * 60) / count;
        const endMinutes = minutes(next.startDate) + dailyMinutes;
        if (count < 1 || !Number.isInteger(dailyMinutes) || endMinutes >= 1440)
          throw new Error(
            'Spread total hours into whole-minute daily shifts ending before midnight. Adjust the total or dates.',
          );
        const end =
          endDay +
          'T' +
          String(Math.floor(endMinutes / 60)).padStart(2, '0') +
          ':' +
          String(endMinutes % 60).padStart(2, '0');
        zonedToIso(end, timezone);
        next.endDate = end;
      }
    } else {
      if (!next.startDate || !next.endDate) {
        next[unit] = '';
        return next;
      }
      zonedToIso(next.startDate, timezone);
      zonedToIso(next.endDate, timezone);
      const count =
        calendarDay(next.endDate.slice(0, 10)) -
        calendarDay(next.startDate.slice(0, 10)) +
        1;
      if (count < 1 || next.endDate < next.startDate)
        throw new Error('Work end must be on or after work start.');
      if (unit === 'days') next.days = String(count);
      else {
        const daily = minutes(next.endDate) - minutes(next.startDate);
        if (daily < 0)
          throw new Error(
            'Daily end time must be on or after daily start time. Overnight shifts are not supported.',
          );
        next.hours = daily === 0 ? '' : String((daily * count) / 60);
      }
      plannedPayload(next);
    }
  } catch (error) {
    next.scheduleError =
      error instanceof Error
        ? error.message
        : 'Check your work dates and planned units.';
  }
  return next;
}

export function hourlySummary(form: Schedule) {
  if (
    form.payType !== 'hourly' ||
    !form.hours ||
    !form.startDate ||
    !form.endDate ||
    form.scheduleError
  )
    return '';
  try {
    const count =
      calendarDay(form.endDate.slice(0, 10)) -
      calendarDay(form.startDate.slice(0, 10)) +
      1;
    const daily = (minutes(form.endDate) - minutes(form.startDate)) / 60;
    return `${daily} hours per day × ${count} days = ${
      daily * count
    } total working hours.`;
  } catch {
    return '';
  }
}

export function plannedLabel(value: PlannedWorkUnits) {
  if (value.hours != null) return `${value.hours} planned hours`;
  if (value.days != null) return `${value.days} planned days`;
  return 'Planned units not provided';
}

export function listingInstant(value: string, closing = false) {
  if (value.length === 10) {
    calendarDay(value);
    return Date.parse(
      zonedToIso(
        (closing ? shiftCalendarDay(value, 1) : value) + 'T00:00',
        'Europe/London',
      ),
    );
  }
  if (
    !/T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value) ||
    !Number.isFinite(Date.parse(value))
  )
    throw new Error('Enter a valid listing date.');
  calendarDay(value.slice(0, 10));
  return Date.parse(value);
}

export function listingInput(value: string, closing = false) {
  if (!value || value.length === 10) return value;
  const time = listingInstant(value);
  // Display the last included UK day for an exclusive midnight cutoff.
  return londonDate(new Date(time - (closing ? 1 : 0)));
}

export function dateWindowErrors(
  value: {
    startDate?: string | null;
    endDate?: string | null;
    liveFrom?: string | null;
    expiresAt?: string | null;
  },
  timezone = 'Europe/London',
) {
  const errors: Partial<Record<'liveFrom' | 'expiresAt' | 'startDate' | 'endDate', string>> = {};
  const work = (date?: string | null) =>
    date
      ? Date.parse(
          /(?:Z|[+-]\d{2}:\d{2})$/.test(date)
            ? date
            : zonedToIso(date, timezone),
        )
      : undefined;
  function parse(field: keyof typeof errors, read: () => number | undefined) {
    try { const result = read(); if (result !== undefined && !Number.isFinite(result)) throw new Error('Enter a valid date and time.'); return result; } catch (problem) {
      errors[field] = problem instanceof Error ? problem.message : 'Enter a valid date and time.';
      return undefined;
    }
  }
  const start = parse('startDate', () => work(value.startDate));
  const end = parse('endDate', () => work(value.endDate));
  const open = parse('liveFrom', () => value.liveFrom ? listingInstant(value.liveFrom) : undefined);
  const close = parse('expiresAt', () => value.expiresAt ? listingInstant(value.expiresAt, true) : undefined);
  if (start !== undefined && end !== undefined && end <= start)
    errors.endDate = 'Job end date must be later than the job start date.';
  if (open !== undefined && start !== undefined && open >= start)
    errors.startDate = 'Job start date must be later than the job live date.';
  if (open !== undefined && close !== undefined && close <= open)
    errors.expiresAt = 'Listing expiry must be later than the job live date.';
  if (close !== undefined && start !== undefined && close >= start)
    errors.startDate = 'Job start date must be later than the listing expiry date.';
  return errors;
}

export function validateDateWindow(
  value: Parameters<typeof dateWindowErrors>[0],
  timezone = 'Europe/London',
) {
  const error = Object.values(dateWindowErrors(value, timezone))[0];
  if (error) throw new Error(error);
}
