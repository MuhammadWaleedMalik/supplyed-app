import { endpoints } from '../../../../constants/endpoints';
import { protectedRequest } from '../../../../utils/api/request';
import { getAllPages } from '../../../../utils/api/pagination';
import type { BookingPagination } from './bookingsApi';

export async function getReviewsPage(
  type: 'instructor' | 'institution',
  id: string,
  page = 1,
) {
  const result = await protectedRequest<{
    reviews: Review[];
    pagination: BookingPagination;
  }>(
    `${endpoints.reviews}/${type}/${encodeURIComponent(
      id,
    )}?page=${page}&limit=20`,
  );
  if (!Array.isArray(result.reviews) || !result.pagination)
    throw new Error('Unable to read review history.');
  return result;
}

export type Review = {
  id: string;
  bookingId: string;
  reviewerType: string;
  rating: number;
  comment?: string | null;
  jobTitle?: string;
  reviewerName?: string;
  createdAt?: string;
  updatedAt?: string;
};

export function createReview(
  bookingId: string,
  rating: number,
  comment: string,
) {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5)
    throw new Error('Choose a rating from 1 to 5.');
  if (comment.trim().length > 2000)
    throw new Error('Keep your review within 2,000 characters.');
  return protectedRequest<Review>(endpoints.reviews, 'POST', {
    bookingId,
    rating,
    comment: comment.trim() || undefined,
  });
}

export async function getInstructorReviews(instructorId: string) {
  return getAllPages<Review>(
    endpoints.reviews + '/instructor/' + encodeURIComponent(instructorId),
    'reviews',
  );
}

export async function getInstitutionReviews(institutionId: string) {
  return getAllPages<Review>(
    endpoints.reviews + '/institution/' + encodeURIComponent(institutionId),
    'reviews',
  );
}
