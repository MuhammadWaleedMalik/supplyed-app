import type { JobSchedule } from '../../feature/dashboard/shared/apis/jobsApi';

const DEFAULT_SLOTS = [{ start: '09:00', end: '17:00' }];

export function reconcileScheduleWeekdays(
  schedule: JobSchedule,
  availableDays: Iterable<number>,
  newlyAvailableDays: Iterable<number>,
  deliberatelyDeselected: Iterable<number> = [],
  preservedWeekdays: JobSchedule['weekdays'] = [],
): JobSchedule {
  const available = new Set(availableDays);
  const newlyAvailable = new Set(newlyAvailableDays);
  const deselected = new Set(deliberatelyDeselected);
  const saved = new Map(
    [...preservedWeekdays, ...schedule.weekdays].map(item => [item.day, item]),
  );
  const selected = new Map(
    schedule.weekdays
      .filter(item => available.has(item.day))
      .map(item => [item.day, item]),
  );
  for (const day of newlyAvailable) {
    if (
      day >= 1 &&
      day <= 5 &&
      available.has(day) &&
      !selected.has(day) &&
      !deselected.has(day)
    )
      selected.set(day, saved.get(day) || { day, slots: DEFAULT_SLOTS });
  }
  return {
    ...schedule,
    weekdays: [...selected.values()].sort((left, right) => left.day - right.day),
    exceptions: schedule.exceptions || [],
  };
}
