import { endpoints } from '../../../../constants/endpoints';
import { protectedRequest } from '../../../../utils/api/request';
import { getAllPages } from '../../../../utils/api/pagination';
import { optionalNonNegativeNumber, optionalNonNegativeInteger } from '../../../../utils/ui/numberValidation';
import { jobDateError } from '../../../../utils/jobs/dateUtils';

export type Job = {
  id: string;
  postedByUserId: string;
  title: string;
  description?: string;
  subject?: string | null;
  requiredSkills?: string[];
  minExperienceYears?: number | null;
  address?: string | null;
  city?: string | null;
  county?: string | null;
  postalCode?: string | null;
  countryCode?: string;
  keyStages?: string[];
  parkingInfo?: string | null;
  payAmount?: number | null;
  payType?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status?: string;
  expiresAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  applicationCount?: number;
};

export const CURRENT_JOB_STATUSES = ['ACTIVE', 'DRAFT'] as const;
export const HISTORY_JOB_STATUSES = [
  'CLOSED',
  'EXPIRED',
  'SUSPENDED',
] as const;

export type JobForm = {
  mode: string;
  title: string;
  description: string;
  subject: string;
  address: string;
  city: string;
  county: string;
  postalCode: string;
  countryCode: string;
  startDate: string;
  endDate: string;
  payAmount: string;
  payType: string;
  status: string;
  minExperienceYears: string;
  requiredSkills: string;
  keyStages: string;
  parkingInfo: string;
  expiresAt: string;
  qts: string;
  urgent: string;
};

export type JobFilters = {
  search?: string;
  status?: string;
  subject?: string;
  keyStage?: string;
  urgent?: boolean;
};

export type JobPage = {
  jobs: Job[];
  page: number;
  hasNextPage: boolean;
};

function words(value: string) {
  return Array.from(
    new Set(
      value
        .split(',')
        .map(item => item.trim())
        .filter(Boolean),
    ),
  );
}

function isoDate(value: string) {
  if (!value.trim()) {
    return undefined;
  }

  const date = new Date(value.trim());
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function numberValue(value: string) {
  return optionalNonNegativeNumber(value, 'Pay and experience');
}

function descriptionWithNotes(data: JobForm) {
  const lines = [data.description.trim()];
  lines.push(
    'Posting route: ' +
      (data.mode === 'brief' ? 'Open brief.' : 'Instant matching.'),
  );

  if (data.qts === 'yes') {
    lines.push('QTS requested.');
  }
  if (data.urgent === 'yes') {
    lines.push('Marked urgent by the hiring account.');
  }

  return lines.filter(Boolean).join('\n\n');
}

function cleanJob(data: JobForm) {
  return {
    title: data.title.trim(),
    description: descriptionWithNotes(data),
    subject: data.subject.trim() || undefined,
    requiredSkills: words(data.requiredSkills),
    minExperienceYears: optionalNonNegativeInteger(data.minExperienceYears, 'Minimum experience'),
    address: data.address.trim() || undefined,
    city: data.city.trim() || undefined,
    county: data.county.trim() || undefined,
    postalCode: data.postalCode.trim().toUpperCase() || undefined,
    countryCode: data.countryCode.trim().toUpperCase() || 'GB',
    startDate: isoDate(data.startDate),
    endDate: isoDate(data.endDate),
    keyStages: words(data.keyStages),
    parkingInfo: data.parkingInfo.trim() || undefined,
    payAmount: numberValue(data.payAmount),
    payType: data.payAmount ? data.payType : undefined,
    expiresAt: isoDate(data.expiresAt),
  };
}

export async function getAllJobs() {
  return getAllPages<Job>(endpoints.jobs, 'jobs');
}

export async function getMyJobs() {
  return getAllPages<Job>(endpoints.jobsMine, 'jobs');
}

async function getJobsPageAt(
  path: string,
  page: number,
  filters: JobFilters,
): Promise<JobPage> {
  const query = new URLSearchParams({ page: String(page), limit: '20' });
  if (filters.search?.trim()) query.set('search', filters.search.trim());
  if (path === endpoints.jobsMine && filters.status && filters.status !== 'ALL')
    query.set('status', filters.status);
  if (filters.subject && filters.subject !== 'All subjects')
    query.set('subject', filters.subject);
  if (filters.keyStage && filters.keyStage !== 'All stages')
    query.set('keyStage', filters.keyStage);
  if (filters.urgent !== undefined)
    query.set('urgent', String(filters.urgent));
  const result = await protectedRequest<{
    jobs?: unknown;
    pagination?: { page?: unknown; hasNextPage?: unknown };
  }>(path + '?' + query.toString());
  if (!Array.isArray(result.jobs))
    throw new Error('The server returned an invalid jobs page.');
  return {
    jobs: result.jobs as Job[],
    page:
      typeof result.pagination?.page === 'number'
        ? result.pagination.page
        : page,
    hasNextPage: result.pagination?.hasNextPage === true,
  };
}

export function getJobsPage(page: number, filters: JobFilters = {}) {
  return getJobsPageAt(endpoints.jobs, page, filters);
}

export function getMyJobsPage(page: number, filters: JobFilters = {}) {
  return getJobsPageAt(endpoints.jobsMine, page, filters);
}

export async function getMyJobsByStatusesPage(
  page: number,
  statuses: readonly string[],
  filters: JobFilters = {},
): Promise<JobPage> {
  const selectedStatuses =
    filters.status && filters.status !== 'ALL'
      ? statuses.filter(status => status === filters.status)
      : statuses;

  if (!selectedStatuses.length) {
    return { jobs: [], page, hasNextPage: false };
  }

  const pages = await Promise.all(
    selectedStatuses.map(status =>
      getJobsPageAt(endpoints.jobsMine, page, { ...filters, status }),
    ),
  );
  const jobs = Array.from(
    new Map(pages.flatMap(result => result.jobs).map(job => [job.id, job])).values(),
  ).sort((left, right) => {
    const dateDifference =
      new Date(right.createdAt || 0).getTime() -
      new Date(left.createdAt || 0).getTime();
    return dateDifference || right.id.localeCompare(left.id);
  });

  return {
    jobs,
    page,
    hasNextPage: pages.some(result => result.hasNextPage),
  };
}

export class JobCreatedError extends Error {
  constructor(public job: Job) {
    super('The job was created, but activation could not be confirmed. Refresh your jobs before taking further action.');
  }
}

export async function createJob(data: JobForm) {
  if (!data.title.trim() || !data.subject.trim() || data.description.trim().length < 20)
    throw new Error('Add a title, subject, and a description of at least 20 characters.');
  const dateError = jobDateError(data.startDate, data.endDate, data.expiresAt);
  if (dateError) throw new Error(dateError);
  const payload = cleanJob(data);
  const created = await protectedRequest<Job>(endpoints.jobs, 'POST', payload);

  if (data.status === 'ACTIVE') {
    try {
      return await protectedRequest<Job>(endpoints.jobs + '/' + encodeURIComponent(created.id), 'PATCH', { status: 'ACTIVE' });
    } catch {
      throw new JobCreatedError(created);
    }
  }

  return created;
}

export function getJob(id: string) {
  return protectedRequest<Job>(endpoints.jobs + '/' + encodeURIComponent(id));
}

export function getMyJob(id: string) {
  return protectedRequest<Job>(endpoints.jobsMine + '/' + encodeURIComponent(id));
}
