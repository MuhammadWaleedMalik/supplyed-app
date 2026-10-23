import type { PlannedWorkUnits } from './workSchedule';
export type BookingPeriod = PlannedWorkUnits & {
  id: string;
  startDate: string;
  endDate: string;
};

// Explicit whitelist: discovery must never retain another school's job/contact data.
export function bookingPeriods(value: unknown): BookingPeriod[] | null {
  if (!Array.isArray(value)) return null;
  const periods: BookingPeriod[] = [];
  for (const item of value) {
    if (
      !item ||
      typeof item.id !== 'string' ||
      typeof item.startDate !== 'string' ||
      typeof item.endDate !== 'string' ||
      !Number.isFinite(Date.parse(item.startDate)) ||
      !Number.isFinite(Date.parse(item.endDate)) ||
      Date.parse(item.endDate) < Date.parse(item.startDate)
    )
      return null;
    periods.push({
      id: item.id,
      startDate: item.startDate,
      endDate: item.endDate,
      hours: typeof item.hours === 'number' ? item.hours : null,
      days: typeof item.days === 'number' ? item.days : null,
    });
  }
  return periods.sort(
    (a, b) =>
      a.startDate.localeCompare(b.startDate) || a.id.localeCompare(b.id),
  );
}

export function bookingPeriodLabel(period: BookingPeriod) {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Europe/London',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  };
  const start = new Date(period.startDate);
  const end = new Date(period.endDate);
  const day = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
  return (
    new Intl.DateTimeFormat('en-GB', options).format(start) +
    ' – ' +
    new Intl.DateTimeFormat(
      'en-GB',
      day.format(start) === day.format(end)
        ? {
            timeZone: 'Europe/London',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short',
          }
        : options,
    ).format(end)
  );
}
