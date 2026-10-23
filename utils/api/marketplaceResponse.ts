import { bookingPeriods } from '../jobs/teacherSchedule';

function units(record: Record<string, unknown>) {
  return {
    ...record,
    hours: record.hours ?? null,
    days: record.days ?? null,
  };
}

// Preserve returned snapshots; never fill booking/invitation units from a live job.
export function normalizeMarketplaceResponse(
  value: unknown,
  path: string,
): unknown {
  if (
    !/^\/(?:jobs|job-invitations|bookings|conversations|invoices|matching|instructors)(?:\/|\?|$)/.test(
      path,
    )
  )
    return value;
  function visit(item: unknown, kind = ''): unknown {
    if (Array.isArray(item)) return item.map(entry => visit(entry, kind));
    if (!item || typeof item !== 'object') return item;
    let result: Record<string, unknown> = {
      ...(item as Record<string, unknown>),
    };
    for (const [key, child] of Object.entries(result)) {
      if (
        [
          'job',
          'jobs',
          'booking',
          'bookings',
          'instructor',
          'instructors',
          'invitation',
          'invitations',
          'conversation',
          'conversations',
          'invoice',
          'invoices',
        ].includes(key)
      )
        result[key] = visit(child, key);
    }
    if (
      ['job', 'jobs', 'booking', 'bookings'].includes(kind) &&
      typeof result.id === 'string'
    )
      result = units(result);
    if (
      ['instructor', 'instructors'].includes(kind) &&
      typeof result.id === 'string'
    )
      result.bookings = bookingPeriods(result.bookings);
    if (
      result.counterpart &&
      typeof result.counterpart === 'object' &&
      typeof result.id === 'string'
    ) {
      // General chats have no job. Keep the existing screen view model safe.
      result.job = result.job || {
        id: '',
        title: 'General',
        hours: null,
        days: null,
      };
    }
    return result;
  }
  const kind = /^\/jobs(?:\/|\?|$)/.test(path)
    ? 'job'
    : /^\/bookings(?:\/|\?|$)/.test(path) ||
      /^\/job-invitations\/[^/]+\/accept/.test(path)
    ? 'booking'
    : /^\/instructors\/profile\//.test(path)
    ? 'instructor'
    : '';
  return visit(value, kind);
}
