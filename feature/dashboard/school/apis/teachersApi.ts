import { protectedRequest } from '../../../../utils/api/request';
import { bookingPeriods } from '../../../../utils/jobs/teacherSchedule';
import { InstructorPublicProfile } from '../../shared/apis/publicProfileApi';
import { BookingPagination } from '../../shared/apis/bookingsApi';
import { MatchScore } from '../../shared/apis/matchingApi';

export type DirectoryTeacher = InstructorPublicProfile & {
  qtsQualified?: boolean;
  availableToday?: boolean;
  match?: MatchScore;
};

export type TeacherFilters = {
  search: string;
  subject: string;
  skill: string;
  keyStage: string;
  city: string;
  minRating: string;
  minExperience: string;
  maxDailyRate: string;
  maxHourlyRate: string;
  availableToday: boolean;
  qtsQualified: boolean;
  dbsVerified: boolean;
};

export const emptyTeacherFilters: TeacherFilters = {
  search: '',
  subject: '',
  skill: '',
  keyStage: '',
  city: '',
  minRating: '',
  minExperience: '',
  maxDailyRate: '',
  maxHourlyRate: '',
  availableToday: false,
  qtsQualified: false,
  dbsVerified: false,
};

export type TeacherFilterErrors = Partial<Record<keyof TeacherFilters, string>>;

export function validateTeacherFilters(filters: TeacherFilters) {
  const errors: TeacherFilterErrors = {};
  for (const key of ['search', 'subject', 'skill', 'city'] as const) {
    if (filters[key].trim().length > 100)
      errors[key] = 'Use 100 characters or fewer.';
  }
  for (const key of [
    'minRating',
    'minExperience',
    'maxDailyRate',
    'maxHourlyRate',
  ] as const) {
    if (!filters[key].trim()) continue;
    const value = Number(filters[key]);
    if (!Number.isFinite(value) || value < 0)
      errors[key] = 'Enter an amount of 0 or more.';
    if (
      key === 'minExperience' &&
      (!Number.isInteger(value) || value < 0 || value > 100)
    )
      errors[key] = 'Enter a whole number between 0 and 100.';
    if (
      key === 'minRating' &&
      (!Number.isFinite(value) || value < 0 || value > 5)
    )
      errors[key] = 'Choose a rating between 0 and 5.';
  }
  return errors;
}

export function teacherFilterQuery(filters: TeacherFilters) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    const trimmed = typeof value === 'string' ? value.trim() : value;
    if (trimmed !== '' && trimmed !== false) params.set(key, String(trimmed));
  }
  return params.toString();
}

export async function getTeachers(page: number, query: string, jobId: string) {
  const path = jobId
    ? '/matching/jobs/' + encodeURIComponent(jobId) + '/instructors'
    : '/instructors/directory';
  const result = await protectedRequest<{
    instructors: (
      | DirectoryTeacher
      | { instructor: DirectoryTeacher; match: MatchScore }
    )[];
    pagination: BookingPagination;
  }>(
    path + '?page=' + page + '&limit=20' + (!jobId && query ? '&' + query : ''),
  );
  if (!Array.isArray(result.instructors) || !result.pagination)
    throw new Error('The teacher list is unavailable. Please try again.');
  return {
    items: result.instructors.map(item => {
      const teacher =
        'instructor' in item ? { ...item.instructor, match: item.match } : item;
      return { ...teacher, bookings: bookingPeriods(teacher.bookings) };
    }),
    page: result.pagination.page,
    hasMore: result.pagination.hasNextPage,
    total: result.pagination.total,
  };
}
