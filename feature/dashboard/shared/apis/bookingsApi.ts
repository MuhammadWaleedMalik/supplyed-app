import type { PlannedWorkUnits } from '../../../../utils/jobs/workSchedule';
import type { Job } from './jobsApi';
import { endpoints } from '../../../../constants/endpoints';
import { protectedRequest } from '../../../../utils/api/request';
import { getAllPages } from '../../../../utils/api/pagination';
import type { Review } from './reviewsApi';
import type { BookingInvoice } from './invoicesApi';

export type BookingStatus = 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export type AttendanceStatus =
  | 'AWAITING_CONFIRMATION'
  | 'PRESENT'
  | 'ABSENT';

export type AttendanceCorrectionRequest = {
  id: string;
  requestedById: string;
  requestedStatus: AttendanceStatus;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
};

export type AttendanceShift = {
  id: string;
  workDate: string;
  scheduledStart: string;
  scheduledEnd: string;
  timeZone: string;
  status: AttendanceStatus;
  decisionSource: string | null;
  reason: string | null;
  responseDeadline: string | null;
  decidedAt: string | null;
  correctionRequests: AttendanceCorrectionRequest[];
};

export type BookingInvoiceFilter = 'none' | 'unpaid' | 'paid';

export type BookingPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
};

export type Booking = PlannedWorkUnits & {
  agreedTerms?: Partial<Job> | null;
  termsStatus?: 'RECORDED' | 'LEGACY_PARTIAL';
  id: string;
  applicationId: string;
  source: 'APPLICATION' | 'DIRECT_HIRE';
  status: BookingStatus;
  job: {
    id: string;
    title: string;
    description?: string;
    subject?: string | null;
    subjects?: string[];
    keyStages?: string[];
    address?: string | null;
    city?: string | null;
    county?: string | null;
    postalCode?: string | null;
    parkingInfo?: string | null;
  };
  instructor: { id: string; fullName: string; imageUrl?: string | null };
  institution: { id: string; name: string; imageUrl?: string | null };
  startDate?: string | null;
  endDate?: string | null;
  payAmount?: number | null;
  payType?: string | null;
  currency?: string;
  paymentFrequency?: string | null;
  periodAnchor?: 'ASSIGNMENT_START' | 'CALENDAR';
  timeZone?: string;
  schedule?: unknown;
  scheduledMinutes?: number | null;
  attendancePolicyEffectiveAt?: string | null;
  attendanceShifts?: AttendanceShift[];
  attendancePayroll?: {
    scheduledMinutes?: number;
    payableMinutes?: number;
    payableAmountPence?: number;
  } | null;
  attendanceAdjustments?: {
    id: string;
    shiftId: string;
    amountPence: number;
    reason: string;
    status: string;
  }[];
  completedAt?: string | null;
  cancelledAt?: string | null;
  cancelledById?: string | null;
  cancelReason?: string | null;
  reviews?: Review[];
  invoice?: BookingInvoice | null;
  createdAt?: string;
  updatedAt?: string;
};

export type BookingQuery = {
  page?: number;
  limit?: number;
  status?: BookingStatus;
  search?: string;
  jobId?: string;
  from?: string;
  to?: string;
  invoice?: BookingInvoiceFilter;
};

export type BookingsPage = {
  bookings: Booking[];
  pagination: BookingPagination;
};

function pathWithStatus(status: string) {
  return (
    endpoints.bookingsMine +
    (status && status !== 'ALL' ? '?status=' + encodeURIComponent(status) : '')
  );
}

function bookingsPath(query: BookingQuery) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '')
      params.set(key, String(value));
  });
  const suffix = params.toString();
  return endpoints.bookingsMine + (suffix ? '?' + suffix : '');
}

export async function getMyBookingsPage(
  query: BookingQuery = {},
): Promise<BookingsPage> {
  const result = await protectedRequest<Partial<BookingsPage>>(
    bookingsPath({ page: 1, limit: 20, ...query }),
  );
  if (
    !Array.isArray(result.bookings) ||
    !result.pagination ||
    typeof result.pagination.page !== 'number' ||
    typeof result.pagination.hasNextPage !== 'boolean'
  )
    throw new Error('The server returned an invalid bookings page.');
  return result as BookingsPage;
}

export async function getMyBookings(status = 'ALL') {
  return getAllPages<Booking>(pathWithStatus(status), 'bookings');
}

export function getBooking(id: string) {
  return protectedRequest<Booking>(
    endpoints.bookings + '/' + encodeURIComponent(id),
  );
}

export function completeBooking(id: string) {
  return protectedRequest<Booking>(
    endpoints.bookings + '/' + encodeURIComponent(id) + '/complete',
    'PATCH',
  );
}

export function noShowBooking(id: string) {
  return protectedRequest<Booking>(
    endpoints.bookings + '/' + encodeURIComponent(id) + '/no-show',
    'PATCH',
  );
}

export function cancelBooking(id: string, reason: string) {
  if (!reason.trim()) throw new Error('Enter a reason before cancelling.');
  if (reason.trim().length > 1000)
    throw new Error('Keep your cancellation reason within 1,000 characters.');
  return protectedRequest<Booking>(
    endpoints.bookings + '/' + encodeURIComponent(id) + '/cancel',
    'PATCH',
    {
      reason: reason.trim(),
    },
  );
}

export function activateAttendance(bookingId: string) {
  return protectedRequest<Booking>(
    endpoints.bookings + '/' + encodeURIComponent(bookingId) + '/attendance/activate',
    'POST',
  );
}

export function recordAttendance(
  bookingId: string,
  shiftId: string,
  status: 'PRESENT' | 'ABSENT',
  reason?: string,
) {
  return protectedRequest<Booking>(
    endpoints.bookings +
      '/' +
      encodeURIComponent(bookingId) +
      '/attendance/' +
      encodeURIComponent(shiftId),
    'PATCH',
    { status, ...(reason?.trim() ? { reason: reason.trim() } : {}) },
  );
}

export function correctAttendance(
  bookingId: string,
  shiftId: string,
  status: 'PRESENT' | 'ABSENT',
  reason: string,
) {
  if (reason.trim().length < 3)
    throw new Error('Enter at least 3 characters explaining the correction.');
  return protectedRequest<Booking>(
    endpoints.bookings +
      '/' +
      encodeURIComponent(bookingId) +
      '/attendance/' +
      encodeURIComponent(shiftId) +
      '/correct',
    'PATCH',
    { status, reason: reason.trim() },
  );
}

export function reviewAttendanceCorrection(
  bookingId: string,
  requestId: string,
  decision: 'APPROVED' | 'REJECTED',
  reason: string,
) {
  if (reason.trim().length < 3)
    throw new Error('Enter at least 3 characters explaining the decision.');
  return protectedRequest<Booking>(
    endpoints.bookings +
      '/' +
      encodeURIComponent(bookingId) +
      '/attendance/correction-requests/' +
      encodeURIComponent(requestId),
    'PATCH',
    { decision, reason: reason.trim() },
  );
}
