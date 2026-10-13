import { endpoints } from '../../../../constants/endpoints';
import { protectedRequest } from '../../../../utils/api/request';
import { getAllPages } from '../../../../utils/api/pagination';

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
