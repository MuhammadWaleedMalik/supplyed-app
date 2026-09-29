function pad(value: number) {
  return String(value).padStart(2, '0');
}

export function dateInputValue(date: Date) {
  return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
}

export function todayInputValue() {
  return dateInputValue(new Date());
}

export function inputDate(value: string) {
  const parts = value.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return new Date();
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

export function isBeforeToday(value: string) {
  return Boolean(value) && value < todayInputValue();
}

export function jobDateError(startDate: string, endDate: string, expiresAt: string) {
  if (isBeforeToday(startDate) || isBeforeToday(endDate) || isBeforeToday(expiresAt))
    return 'Past dates cannot be selected.';
  if (startDate && endDate && endDate < startDate)
    return 'The end date must be on or after the start date.';
  return '';
}
