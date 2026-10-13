import { endpoints } from '../../../../constants/endpoints';
import { protectedRequest } from '../../../../utils/api/request';
import { getAllPages } from '../../../../utils/api/pagination';
import type { Review } from './reviewsApi';
import type { BookingInvoice } from './invoicesApi';

export type BookingStatus =
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type BookingInvoiceFilter = 'none' | 'unpaid' | 'paid';

export type BookingPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
};

export type Booking = {
  id: string;
  applicationId: string;
  status: BookingStatus;
  job: {
    id: string;
    title: string;
    description?: string;
    subject?: string | null;
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
  return endpoints.bookingsMine +
    (status && status !== 'ALL' ? '?status=' + encodeURIComponent(status) : '');
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

export function completeBooking(id: string) {
  return protectedRequest<Booking>(endpoints.bookings + '/' + id + '/complete', 'PATCH');
}

export function noShowBooking(id: string) {
  return protectedRequest<Booking>(endpoints.bookings + '/' + id + '/no-show', 'PATCH');
}

export function cancelBooking(id: string, reason: string) {
  return protectedRequest<Booking>(endpoints.bookings + '/' + id + '/cancel', 'PATCH', {
    reason: reason.trim(),
  });
}
