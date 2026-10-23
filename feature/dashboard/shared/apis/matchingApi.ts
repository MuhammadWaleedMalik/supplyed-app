import { protectedRequest } from '../../../../utils/api/request';
import type { Application } from './applicationsApi';
import type { Job } from './jobsApi';
import type { BookingPagination } from './bookingsApi';

export type MatchScore = {
  score: number;
  distanceMiles: number | null;
  factors: {
    key: string;
    label: string;
    weight: number;
    value: number;
    applicable: boolean;
    detail: string;
  }[];
  flags: {
    scheduleConflict: boolean;
    outsideTravelRadius: boolean;
    distanceKnown: boolean;
  };
};
export type MatchedInstructor = {
  id: string;
  fullName: string;
  city?: string | null;
  subjects: string[];
  keyStages: string[];
  skills: string[];
  experience?: number | null;
  ratingAverage: number;
  ratingCount: number;
  dbsVerified: boolean;
};
export type RankedApplication = {
  application: Application;
  instructor: MatchedInstructor;
  match: MatchScore;
};
export type RecommendedJob = { job: Job; match: MatchScore };

export async function getRecommendedJobs(page = 1) {
  const result = await protectedRequest<{
    jobs: RecommendedJob[];
    pagination: BookingPagination;
  }>(`/matching/jobs/recommended?page=${page}&limit=20`);
  if (!Array.isArray(result.jobs) || !result.pagination)
    throw new Error('Unable to read job recommendations.');
  return result;
}
export async function getRankedApplications(jobId: string, page = 1) {
  const result = await protectedRequest<{
    applications: RankedApplication[];
    pagination: BookingPagination;
  }>(
    `/matching/jobs/${encodeURIComponent(
      jobId,
    )}/applications?page=${page}&limit=20`,
  );
  if (!Array.isArray(result.applications) || !result.pagination)
    throw new Error('Unable to read applicant matches.');
  return result;
}
export function getJobMatch(jobId: string) {
  return protectedRequest<MatchScore>(
    `/matching/jobs/${encodeURIComponent(jobId)}/score`,
  );
}
