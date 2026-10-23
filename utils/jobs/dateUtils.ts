import { listingInstant } from './workSchedule';
import { londonDate, londonToIso } from './londonTime';

function pad(value: number) {
  return String(value).padStart(2, '0');
}

export function dateInputValue(date: Date) {
  return (
    date.getFullYear() +
    '-' +
    pad(date.getMonth() + 1) +
    '-' +
    pad(date.getDate())
  );
}

export function todayInputValue() {
  return londonDate();
}

export function inputDate(value: string) {
  const parts = value.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return new Date();
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

export function isBeforeToday(value: string) {
  return Boolean(value) && value < todayInputValue();
}

export function jobDateError(
  startDate: string,
  endDate: string,
  expiresAt: string,
) {
  try {
    if (expiresAt) listingInstant(expiresAt, true);
    if (startDate.includes('T') && !/(?:Z|[+-]\d{2}:\d{2})$/.test(startDate))
      londonToIso(startDate);
    if (endDate.includes('T') && !/(?:Z|[+-]\d{2}:\d{2})$/.test(endDate))
      londonToIso(endDate);
  } catch (error) {
    return error instanceof Error ? error.message : 'Invalid work time.';
  }
  for (const value of [
    startDate.slice(0, 10),
    endDate.slice(0, 10),
    expiresAt.slice(0, 10),
  ]) {
    if (
      value &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(value) ||
        dateInputValue(inputDate(value)) !== value)
    )
      return 'Enter a valid calendar date.';
  }
  if (
    isBeforeToday(startDate) ||
    isBeforeToday(endDate) ||
    isBeforeToday(expiresAt)
  )
    return 'Past dates cannot be selected.';
  if (startDate && endDate && endDate < startDate)
    return 'The end date must be on or after the start date.';
  return '';
}
