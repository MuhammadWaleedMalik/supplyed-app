export function canSchoolCompleteBooking(
  role: 'school' | 'teacher',
  status: string,
) {
  return role === 'school' && status === 'CONFIRMED';
}

export function canSchoolReportNoShow(
  role: 'school' | 'teacher',
  status: string,
  startDate?: string | null,
  now = Date.now(),
) {
  if (!canSchoolCompleteBooking(role, status)) return false;
  if (!startDate) return true;
  const start = Date.parse(startDate);
  return Number.isFinite(start) && start <= now;
}
