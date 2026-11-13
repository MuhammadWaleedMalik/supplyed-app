import type { Booking } from '../../feature/dashboard/shared/apis/bookingsApi';
import type { JobSchedule, JobSlot } from '../../feature/dashboard/shared/apis/jobsApi';
import { zonedToIso } from './londonTime';

const DAY_MS = 86_400_000;

export type ScheduledShift = {
  workDate: string;
  start: string;
  end: string;
};

export type PaymentReleasePeriod = {
  key: string;
  label: string;
  workingDates: string[];
  eligibilityAt: string;
  shiftCount: number;
  conditionalOnCompletion?: boolean;
};

export type PaymentReleasePreview = {
  state: 'ready' | 'missing' | 'empty' | 'milestone';
  message?: string;
  periods: PaymentReleasePeriod[];
  bookingTitle: string;
  assignmentStart?: string | null;
  assignmentEnd?: string | null;
  frequency: string;
  timezone: string;
};

type PreviewBooking = Pick<
  Booking,
  | 'agreedTerms'
  | 'termsStatus'
  | 'job'
  | 'startDate'
  | 'endDate'
  | 'timeZone'
  | 'schedule'
  | 'attendanceShifts'
  | 'status'
  | 'completedAt'
  | 'paymentFrequency'
  | 'periodAnchor'
  | 'payType'
>;

const ACCEPTED_TERM_FIELDS = [
  'startDate',
  'endDate',
  'timeZone',
  'schedule',
  'paymentFrequency',
  'periodAnchor',
  'payType',
] as const;

/** Prefer the immutable terms captured when the booking was accepted. */
function acceptedBookingTerms(booking: PreviewBooking): PreviewBooking {
  const terms = booking.agreedTerms;
  if (!terms || typeof terms !== 'object' || Array.isArray(terms)) return booking;
  const accepted = { ...booking };
  for (const field of ACCEPTED_TERM_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(terms, field))
      Object.assign(accepted, { [field]: terms[field] });
  }
  return accepted;
}

function dateOnly(value: string, timezone: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error('Invalid assignment date.');
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .formatToParts(date)
      .map(part => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function addDays(value: string, days: number) {
  return new Date(Date.parse(value + 'T12:00:00Z') + days * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

function weekday(value: string) {
  return new Date(value + 'T12:00:00Z').getUTCDay();
}

function calendarDays(start: string, end: string) {
  return Math.floor(
    (Date.parse(end + 'T12:00:00Z') -
      Date.parse(start + 'T12:00:00Z')) /
      DAY_MS,
  );
}

function addCalendarMonths(value: string, months: number) {
  const [year, month, day] = value.split('-').map(Number);
  const target = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  return `${target.getUTCFullYear()}-${String(
    target.getUTCMonth() + 1,
  ).padStart(2, '0')}-${String(Math.min(day, lastDay)).padStart(2, '0')}`;
}

function monthIndex(start: string, date: string) {
  let index = 0;
  while (date >= addCalendarMonths(start, index + 1)) index += 1;
  return index;
}

function validSlots(value: unknown): value is JobSlot[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      slot =>
        slot &&
        typeof slot === 'object' &&
        typeof slot.start === 'string' &&
        typeof slot.end === 'string' &&
        /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(slot.start) &&
        /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(slot.end) &&
        slot.start !== slot.end,
    )
  );
}

function readSchedule(value: unknown): JobSchedule | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const raw = value as Partial<JobSchedule>;
  if (
    !Array.isArray(raw.weekdays) ||
    !raw.weekdays.length ||
    raw.weekdays.some(
      entry =>
        !Number.isInteger(entry.day) ||
        entry.day < 0 ||
        entry.day > 6 ||
        !validSlots(entry.slots),
    )
  )
    return null;
  if (
    raw.exceptions &&
    (!Array.isArray(raw.exceptions) ||
      raw.exceptions.some(
        entry =>
          !/^\d{4}-\d{2}-\d{2}$/.test(entry.date) ||
          !['add', 'exclude', 'replace'].includes(entry.kind) ||
          (entry.kind !== 'exclude' && !validSlots(entry.slots)),
      ))
  )
    return null;
  return {
    weekdays: raw.weekdays,
    exceptions: raw.exceptions || [],
  };
}

export function expandBookingSchedule(
  booking: Pick<
    Booking,
    | 'startDate'
    | 'endDate'
    | 'timeZone'
    | 'schedule'
    | 'attendanceShifts'
    | 'status'
    | 'completedAt'
  >,
): ScheduledShift[] | null {
  const timezone = booking.timeZone || 'Europe/London';
  // Activated attendance shifts are the most authoritative accepted expansion.
  if (booking.attendanceShifts?.length) {
    const attendanceShifts = booking.attendanceShifts
      .map(shift => ({
        workDate: shift.workDate,
        start: shift.scheduledStart,
        end: shift.scheduledEnd,
      }))
      .filter(
        shift =>
          /^\d{4}-\d{2}-\d{2}$/.test(shift.workDate) &&
          Number.isFinite(Date.parse(shift.start)) &&
          Number.isFinite(Date.parse(shift.end)),
      )
      .sort((left, right) => left.start.localeCompare(right.start));
    // Some older booking responses include attendance rows without usable
    // scheduled timestamps. They are not evidence of an empty work schedule;
    // fall through to the immutable accepted schedule instead.
    if (attendanceShifts.length) return attendanceShifts;
  }
  if (!booking.startDate || !booking.endDate) return null;
  const schedule = readSchedule(booking.schedule);
  if (!schedule) return null;
  try {
    new Intl.DateTimeFormat('en-GB', { timeZone: timezone }).format(new Date());
    const first = dateOnly(booking.startDate, timezone);
    const last = dateOnly(booking.endDate, timezone);
    if (last < first) return null;
    const recurring = new Map(
      schedule.weekdays.map(entry => [entry.day, entry.slots]),
    );
    const exceptions = new Map(
      (schedule.exceptions || []).map(entry => [entry.date, entry]),
    );
    const shifts: ScheduledShift[] = [];
    for (let date = first; date <= last; date = addDays(date, 1)) {
      const exception = exceptions.get(date);
      const normal = recurring.get(weekday(date)) || [];
      const slots =
        exception?.kind === 'exclude'
          ? []
          : exception?.kind === 'replace'
          ? exception.slots || []
          : [...normal, ...(exception?.slots || [])];
      for (const slot of slots) {
        const start = zonedToIso(date + 'T' + slot.start, timezone);
        const endDate = slot.end <= slot.start ? addDays(date, 1) : date;
        const end = zonedToIso(endDate + 'T' + slot.end, timezone);
        shifts.push({ workDate: date, start, end });
      }
    }
    const completedAt =
      booking.status === 'COMPLETED' && booking.completedAt
        ? Date.parse(booking.completedAt)
        : null;
    return shifts
      .filter(
        shift =>
          completedAt === null || Date.parse(shift.end) <= completedAt,
      )
      .sort((left, right) => left.start.localeCompare(right.start));
  } catch {
    return null;
  }
}

function groupKey(
  shift: ScheduledShift,
  frequency: string,
  anchor: 'ASSIGNMENT_START' | 'CALENDAR',
  assignmentStart: string,
) {
  if (frequency === 'hourly') return shift.start;
  if (frequency === 'daily') return shift.workDate;
  if (frequency === 'weekly') {
    if (anchor === 'CALENDAR')
      return 'week:' + addDays(shift.workDate, -((weekday(shift.workDate) + 6) % 7));
    return 'week:' + (Math.floor(calendarDays(assignmentStart, shift.workDate) / 7) + 1);
  }
  if (frequency === 'monthly') {
    if (anchor === 'CALENDAR') return 'month:' + shift.workDate.slice(0, 7);
    return 'month:' + (monthIndex(assignmentStart, shift.workDate) + 1);
  }
  return 'completion';
}

function periodLabel(key: string, frequency: string, index: number) {
  if (key === 'completion') return 'After completion';
  if (frequency === 'hourly') return `Shift ${index + 1}`;
  if (frequency === 'daily') return key;
  if (key.startsWith('week:'))
    return key.slice(5).includes('-')
      ? 'Week of ' + key.slice(5)
      : 'Week ' + key.slice(5);
  if (key.startsWith('month:'))
    return key.slice(6).includes('-')
      ? key.slice(6)
      : 'Month ' + key.slice(6);
  return key;
}

export function buildPaymentReleasePreview(
  booking: PreviewBooking,
): PaymentReleasePreview {
  const accepted = acceptedBookingTerms(booking);
  const timezone = accepted.timeZone || 'Europe/London';
  const frequency =
    accepted.paymentFrequency ||
    (accepted.payType === 'fixed' ? 'completion' : accepted.payType || '');
  const previewDetails = {
    bookingTitle:
      typeof accepted.agreedTerms?.title === 'string' &&
      accepted.agreedTerms.title.trim()
        ? accepted.agreedTerms.title
        : accepted.job.title,
    assignmentStart: accepted.startDate,
    assignmentEnd: accepted.endDate,
    frequency,
    timezone,
  };
  if (frequency === 'milestone')
    return {
      ...previewDetails,
      state: 'milestone',
      periods: [],
      message:
        'This historical booking uses milestone payments. Release dates require the agreed milestone schedule and cannot be estimated here.',
    };
  if (
    !['hourly', 'daily', 'weekly', 'monthly', 'completion'].includes(frequency)
  )
    return {
      ...previewDetails,
      state: 'missing',
      frequency: frequency || 'Unavailable',
      periods: [],
      message:
        'This legacy booking does not include enough accepted payment terms to calculate a schedule.',
    };
  const shifts = expandBookingSchedule(accepted);
  if (shifts === null)
    return {
      ...previewDetails,
      state: 'missing',
      periods: [],
      message:
        'This legacy booking does not include a complete accepted work schedule. No release dates have been guessed.',
    };
  if (!shifts.length)
    return {
      ...previewDetails,
      state: 'empty',
      periods: [],
      message: 'No scheduled payments to display',
    };
  const assignmentStart = accepted.startDate
    ? dateOnly(accepted.startDate, timezone)
    : shifts[0].workDate;
  const anchor = accepted.periodAnchor === 'CALENDAR' ? 'CALENDAR' : 'ASSIGNMENT_START';
  const groups = new Map<string, ScheduledShift[]>();
  for (const shift of shifts) {
    const key = groupKey(shift, frequency, anchor, assignmentStart);
    groups.set(key, [...(groups.get(key) || []), shift]);
  }
  const periods = [...groups.entries()].map(([key, items], index) => ({
    key,
    label: periodLabel(key, frequency, index),
    workingDates: [...new Set(items.map(item => item.workDate))],
    eligibilityAt:
      frequency === 'completion' && accepted.completedAt
        ? accepted.completedAt
        : items[items.length - 1].end,
    shiftCount: items.length,
    ...(frequency === 'completion' ? { conditionalOnCompletion: true } : {}),
  }));
  return { ...previewDetails, state: 'ready', periods };
}
