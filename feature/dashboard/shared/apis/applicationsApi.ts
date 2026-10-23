import { richTextToPlainText } from '../../../../utils/ui/richText';
import { sanitizeHtml } from '../../../../utils/ui/safeHtml';
import { endpoints } from '../../../../constants/endpoints';
import { ApiError, protectedRequest } from '../../../../utils/api/request';
import {
  assertSessionVersion,
  getSessionVersion,
} from '../../../../utils/api/session';
import { getAllPages } from '../../../../utils/api/pagination';
import type { BookingPagination } from './bookingsApi';
import type { Job } from './jobsApi';

export type ApplicationHistoryEntry = {
  id: string;
  applicationId: string;
  fromStatus: string | null;
  changedBy: string;
  toStatus: string;
  createdAt: string;
};

export async function getApplicationHistory(id: string, page = 1) {
  const result = await protectedRequest<{
    history: ApplicationHistoryEntry[];
    pagination: BookingPagination;
  }>(
    `${endpoints.applications}/${encodeURIComponent(
      id,
    )}/history?page=${page}&limit=20`,
  );
  if (!Array.isArray(result.history) || !result.pagination)
    throw new Error('Unable to read application history.');
  return result;
}

export type Application = {
  id: string;
  jobId: string;
  jobName?: string;
  instructorId: string;
  status: string;
  coverLetter?: string | null;
  school?: {
    id: string;
    name: string;
    imageUrl?: string | null;
  } | null;
  bookingId?: string | null;
  conversationId?: string | null;
  jobDetails?: Partial<Job> | null;
  createdAt?: string;
  updatedAt?: string;
};

export async function createApplication(jobId: string, coverLetter: string) {
  const version = getSessionVersion();
  const plain = richTextToPlainText(coverLetter);
  const serialized = plain ? sanitizeHtml(coverLetter) : undefined;
  if (serialized && serialized.length > 2000)
    throw new Error(
      'Your proposal must be 2,000 characters or fewer including formatting.',
    );
  try {
    return await protectedRequest<Application>(endpoints.applications, 'POST', {
      jobId,
      coverLetter: serialized,
    });
  } catch (error) {
    if (!couldHaveSaved(error)) throw error;
    assertSessionVersion(version);
    // The backend allows one application per teacher/job. Read it after a
    // lost response or duplicate rejection instead of sending another POST.
    try {
      const existing = (await getMyApplications()).find(
        item => item.jobId === jobId,
      );
      assertSessionVersion(version);
      if (existing) return existing;
    } catch {
      // Keep the original request error when the read cannot confirm success.
    }
    throw error;
  }
}

function couldHaveSaved(error: unknown) {
  return (
    error instanceof ApiError &&
    ([0, 408, 409].includes(error.status) || error.status >= 500)
  );
}

export async function getMyApplications(status = '') {
  const path =
    endpoints.applicationsMine +
    (status ? '?status=' + encodeURIComponent(status) : '');
  return getAllPages<Application>(path, 'applications');
}

export function getApplication(id: string) {
  return protectedRequest<Application>(endpoints.applications + '/' + encodeURIComponent(id));
}
export async function getMyApplicationForJob(jobId: string) {
  const query = new URLSearchParams({ jobId, page: '1', limit: '1' });
  const result = await protectedRequest<{ applications: Application[] }>(endpoints.applicationsMine + '?' + query.toString());
  if (!Array.isArray(result.applications)) throw new Error('Unable to check application status.');
  return result.applications[0];
}

export async function getApplicationsPage(page = 1, status = '', jobId = '') {
  const query = new URLSearchParams({ page: String(page), limit: jobId ? '10' : '20' });
  if (status && status !== 'ALL') query.set('status', status);
  const path = jobId ? endpoints.applicationsByJob + '/' + encodeURIComponent(jobId) : endpoints.applicationsMine;
  const result = await protectedRequest<{ applications: Application[]; pagination: BookingPagination }>(path + '?' + query.toString());
  if (!Array.isArray(result.applications) || !result.pagination || result.pagination.page !== page)
    throw new Error('Unable to read applications. Please refresh.');
  return { items: result.applications, page, hasMore: result.pagination.hasNextPage, total: result.pagination.total };
}

export async function getApplicationsForJob(jobId: string, status = '') {
  const path =
    endpoints.applicationsByJob +
    '/' +
    encodeURIComponent(jobId) +
    (status ? '?status=' + encodeURIComponent(status) : '');
  return getAllPages<Application>(path, 'applications');
}

export async function updateApplicationStatus(id: string, status: string) {
  const version = getSessionVersion();
  const path = endpoints.applications + '/' + encodeURIComponent(id);
  try {
    return await protectedRequest<Application>(path + '/status', 'PATCH', {
      status,
    });
  } catch (error) {
    if (
      !couldHaveSaved(error) &&
      !(error instanceof ApiError && error.status === 400)
    )
      throw error;
    assertSessionVersion(version);
    try {
      const latest = await protectedRequest<Application>(path);
      assertSessionVersion(version);
      if (latest.status === status) return latest;
    } catch {
      // A refresh failure must not hide the original action error.
    }
    throw error;
  }
}
