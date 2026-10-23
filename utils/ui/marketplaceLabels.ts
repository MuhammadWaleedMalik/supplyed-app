const labels: Record<string, string> = {
  ALL: 'All',
  APPLIED: 'Applied',
  VIEWED: 'Viewed',
  SHORTLISTED: 'Shortlisted',
  HIRED: 'Hired',
  REJECTED: 'Not selected',
  ACTIVE: 'Live',
  LIVE: 'Live',
  SCHEDULED: 'Scheduled',
  DRAFT: 'Draft',
  FILLED: 'Filled',
  CLOSED: 'Closed',
  EXPIRED: 'Expired',
  SUSPENDED: 'Suspended',
  CONFIRMED: 'Confirmed',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'No-show',
};

export function statusLabel(value: string) {
  return labels[value] || value.replace(/_/g, ' ').toLowerCase();
}

export function displayDate(value?: string | null) {
  if (!value) return 'Not provided';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Not provided'
    : date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'Europe/London',
      });
}

export function displayPay(
  amount?: number | null,
  unit?: string | null,
  currency = 'GBP',
) {
  if (amount == null || !Number.isFinite(amount)) return 'Pay not provided';
  const units: Record<string, string> = {
    hourly: 'per hour',
    daily: 'per day',
    fixed: 'fixed',
  };
  return `${currency} ${amount.toFixed(2)} ${
    units[unit || ''] || (unit ? unit : '(unit not provided)')
  }`;
}
