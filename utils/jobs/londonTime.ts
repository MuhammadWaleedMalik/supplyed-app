export function londonDate(value = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value);
  return ['year', 'month', 'day']
    .map(name => parts.find(part => part.type === name)?.value)
    .join('-');
}

export function londonInput(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date);
  return londonDate(date) + 'T' + time;
}

// Compare both UK offsets. A clock change can make a local time missing or ambiguous.
export function londonToIso(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))
    throw new Error('Enter a work date and time in UK time.');
  const utc = Date.parse(value + ':00Z');
  const matches = [utc, utc - 3600000].filter(
    time =>
      Number.isFinite(time) &&
      londonInput(new Date(time).toISOString()) === value,
  );
  if (matches.length !== 1)
    throw new Error(
      'This UK time is invalid or falls during a clock change. Choose an unambiguous time.',
    );
  return new Date(matches[0]).toISOString();
}

export function listingStatus(job: {
  status?: string;
  liveFrom?: string | null;
  expiresAt?: string | null;
}) {
  if (['SUSPENDED', 'CLOSED', 'DRAFT'].includes(job.status || ''))
    return job.status || '';
  const today = londonDate();
  if (
    job.status === 'EXPIRED' ||
    (job.expiresAt &&
      (/^\d{4}-\d{2}-\d{2}$/.test(job.expiresAt)
        ? job.expiresAt < today
        : Date.parse(job.expiresAt) <= Date.now()))
  )
    return 'EXPIRED';
  if (
    job.liveFrom &&
    (/^\d{4}-\d{2}-\d{2}$/.test(job.liveFrom)
      ? job.liveFrom > today
      : Date.parse(job.liveFrom) > Date.now())
  )
    return 'SCHEDULED';
  return job.status === 'ACTIVE' ? 'LIVE' : job.status || 'Unavailable';
}

// Invitation times may use any timezone returned by the backend.
export function zonedToIso(value: string, timezone: string) {
  if (timezone === 'Europe/London') return londonToIso(value);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))
    throw new Error('Enter a date and time.');
  const utc = Date.parse(value + ':00Z');
  if (!Number.isFinite(utc)) throw new Error('Enter a valid date and time.');
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const matches: number[] = [];
  // Current IANA offsets are quarter-hour multiples within these bounds.
  for (let minutes = -14 * 60; minutes <= 14 * 60; minutes += 15) {
    const candidate = utc - minutes * 60000;
    const parts = formatter.formatToParts(new Date(candidate));
    const part = (name: string) =>
      parts.find(item => item.type === name)?.value;
    const local =
      part('year') +
      '-' +
      part('month') +
      '-' +
      part('day') +
      'T' +
      part('hour') +
      ':' +
      part('minute');
    if (local === value) matches.push(candidate);
  }
  if (matches.length !== 1)
    throw new Error(
      'This time is invalid or falls during a clock change. Choose an unambiguous time.',
    );
  return new Date(matches[0]).toISOString();
}
