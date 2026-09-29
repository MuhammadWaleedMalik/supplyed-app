import { endpoints } from '../../../../constants/endpoints';
import { protectedRequest } from '../../../../utils/api/request';
import type { Review } from './reviewsApi';

export type Booking = {
  id: string;
  applicationId: string;
  status: string;
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
  createdAt?: string;
  updatedAt?: string;
};

type BookingPage = {
  bookings?: Booking[];
  pagination?: { hasNextPage?: boolean };
};

function pathWithStatus(status: string) {
  return endpoints.bookingsMine + '?page=1&limit=100' +
    (status && status !== 'ALL' ? '&status=' + status : '');
}

export async function getMyBookings(status = 'ALL') {
  const reply = await protectedRequest<BookingPage | Booking[]>(pathWithStatus(status));
  if (Array.isArray(reply)) return reply;
  return reply.bookings || [];
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
