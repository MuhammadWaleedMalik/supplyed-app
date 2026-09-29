import { endpoints } from '../../../../constants/endpoints';
import { protectedRequest } from '../../../../utils/api/request';

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
  const reply = await protectedRequest<{ reviews?: Review[] }>(
    endpoints.reviews + '/instructor/' + instructorId + '?page=1&limit=100',
  );
  return reply.reviews || [];
}

export async function getInstitutionReviews(institutionId: string) {
  const reply = await protectedRequest<{ reviews?: Review[] }>(
    endpoints.reviews + '/institution/' + institutionId + '?page=1&limit=100',
  );
  return reply.reviews || [];
}
