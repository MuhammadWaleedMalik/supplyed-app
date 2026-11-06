import { endpoints } from '../../../../constants/endpoints';
import { protectedRequest } from '../../../../utils/api/request';

export type AvailabilitySlot = { start: string; end: string };
export type AvailabilityWeekday = { day: number; slots: AvailabilitySlot[] };
export type AvailabilityException = {
  date: string;
  kind: 'add' | 'exclude' | 'replace';
  slots?: AvailabilitySlot[];
};
export type AvailabilityRecord = {
  id: string;
  timeZone: string;
  weeklySchedule: { weekdays: AvailabilityWeekday[] };
  exceptions: AvailabilityException[];
  version: number;
  updatedAt: string;
};
export type AvailabilityBooking = {
  id: string;
  startDate: string | null;
  endDate: string | null;
  timeZone: string;
  schedule: unknown;
  job: { title: string };
};
export type AvailabilitySnapshot = {
  availability: AvailabilityRecord | null;
  bookings: AvailabilityBooking[];
};
export type JobAvailability = {
  available: boolean;
  conflicts?: unknown[];
  reasons?: string[];
  [key: string]: unknown;
};

export function getAvailability() {
  return protectedRequest<AvailabilitySnapshot>(endpoints.availability);
}

export function saveAvailability(
  timeZone: string,
  weekdays: AvailabilityWeekday[],
  exceptions: AvailabilityException[],
) {
  return protectedRequest<AvailabilityRecord>(
    endpoints.availability,
    'PUT',
    {
      timeZone,
      weeklySchedule: { weekdays },
      exceptions,
    },
  );
}

export function checkJobAvailability(jobId: string) {
  return protectedRequest<JobAvailability>(endpoints.availabilityForJob(jobId));
}
