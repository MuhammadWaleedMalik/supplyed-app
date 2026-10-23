import type { Booking } from '../../feature/dashboard/shared/apis/bookingsApi';

export type AgendaView = 'All' | 'Today' | 'Upcoming' | 'Past';

export function ukDay(value: string | Date = new Date()) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  return ['year', 'month', 'day']
    .map(key => parts.find(part => part.type === key)?.value)
    .join('-');
}

export function isInAgenda(
  booking: Booking,
  view: AgendaView,
  today = ukDay(),
) {
  if (view === 'All') return true;
  const start = booking.startDate ? ukDay(booking.startDate) : '';
  const end = booking.endDate ? ukDay(booking.endDate) : start;
  if (!start || !end) return false;
  if (view === 'Today') return start <= today && end >= today;
  return view === 'Upcoming' ? start > today : end < today;
}
