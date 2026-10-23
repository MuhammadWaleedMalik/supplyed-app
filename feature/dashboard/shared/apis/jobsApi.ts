import {
  plannedPayload,
  validateDateWindow,
  listingInstant,
  type PlannedWorkUnits,
} from '../../../../utils/jobs/workSchedule';
import { readChoices, writeChoices } from '../../../../utils/ui/choices';
import { teachingPayload } from '../../../../utils/onboarding/teachingChoices';
import { checkDropdown } from '../../../dropdowns/apis/dropdownsApi';
import { richTextToPlainText } from '../../../../utils/ui/richText';
import {
  londonInput,
  londonToIso,
  zonedToIso,
} from '../../../../utils/jobs/londonTime';
import { endpoints } from '../../../../constants/endpoints';
import { ApiError, protectedRequest } from '../../../../utils/api/request';
import { getAllPages } from '../../../../utils/api/pagination';
import {
  getSessionVersion,
  assertSessionVersion,
} from '../../../../utils/api/session';
import {
  optionalNonNegativeNumber,
  optionalNonNegativeInteger,
} from '../../../../utils/ui/numberValidation';
import { jobDateError } from '../../../../utils/jobs/dateUtils';

export type Job = PlannedWorkUnits & {
  institution?: { id: string; name: string; imageUrl?: string | null } | null;
  id: string;
  postedByUserId: string;
  title: string;
  description?: string;
  subject?: string | null;
  subjects?: string[];
  liveFrom?: string | null;
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
  'FILLED',
  'CLOSED',
  'EXPIRED',
  'SUSPENDED',
] as const;

export type JobForm = {
  addressMode: 'school' | 'different';
  hours: string;
  days: string;
  scheduleError?: string;
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
  liveFrom: string;
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
  return readChoices(value);
}

function isoDate(value: string) {
  if (!value.trim()) return undefined;
  return londonToIso(value);
}

function listingIso(value: string, closing = false) {
  return value
    ? new Date(listingInstant(value, closing)).toISOString()
    : undefined;
}

function numberValue(value: string) {
  return optionalNonNegativeNumber(value, 'Pay and experience');
}

export function editableDescription(value: string) {
  return value
    .replace(/\n\nPosting route: (?:Open brief|Instant matching)\./g, '')
    .replace(/\n\nQTS requested\./g, '')
    .replace(/\n\nMarked urgent by the hiring account\./g, '')
    .trim();
}
function descriptionWithNotes(data: JobForm) {
  const lines = [
    data.description
      .replace(/\n\nPosting route: (?:Open brief|Instant matching)\./g, '')
      .replace(/\n\nQTS requested\./g, '')
      .replace(/\n\nMarked urgent by the hiring account\./g, '')
      .trim(),
  ];
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

export function validateJobSchedule(
  data: JobForm,
  original?: Job,
  timezone = 'Europe/London',
) {
  const before = original ? jobToForm(original) : undefined;
  const effective = { ...data };
  for (const field of [
    'startDate',
    'endDate',
    'liveFrom',
    'expiresAt',
  ] as const) {
    if (before && data[field] === before[field])
      effective[field] = original?.[field] || '';
  }
  validateDateWindow(effective, timezone);
  plannedPayload(data);
  if (
    data.startDate &&
    (!before || data.startDate !== before.startDate) &&
    Date.parse(zonedToIso(data.startDate, timezone)) < Date.now()
  )
    throw new Error('Choose a future work start.');
  if (
    data.expiresAt &&
    (!before || data.expiresAt !== before.expiresAt) &&
    listingInstant(data.expiresAt, true) <= Date.now()
  )
    throw new Error('Choose a future listing expiry.');
  if (before?.expiresAt && !data.expiresAt)
    throw new Error('Choose a replacement listing expiry.');
}

export async function cleanJob(data: JobForm, timezone = 'Europe/London') {
  validateJobSchedule(data, undefined, timezone);
  const units = plannedPayload(data);
  const teaching = await teachingPayload(data.subject, data.requiredSkills);
  await checkDropdown('keyStage', words(data.keyStages));
  if (data.city) await checkDropdown('city', [data.city]);
  if (data.county) await checkDropdown('region', [data.county]);
  await checkDropdown('country', [data.countryCode]);
  if (data.payType) await checkDropdown('payType', [data.payType]);
  return {
    ...units,
    title: data.title.trim(),
    description: descriptionWithNotes(data),
    subjects: teaching.subjects,
    otherSubjects: teaching.otherSubjects,
    requiredSkills: teaching.skills,
    otherSkills: teaching.otherSkills,
    minExperienceYears: optionalNonNegativeInteger(
      data.minExperienceYears,
      'Minimum experience',
    ),
    address: data.address.trim() || undefined,
    city: data.city.trim() || undefined,
    county: data.county.trim() || undefined,
    postalCode: data.postalCode.trim().toUpperCase() || undefined,
    countryCode: data.countryCode.trim().toUpperCase() || 'GB',
    startDate: data.startDate
      ? zonedToIso(data.startDate, timezone)
      : undefined,
    endDate: data.endDate ? zonedToIso(data.endDate, timezone) : undefined,
    keyStages: words(data.keyStages),
    parkingInfo: data.parkingInfo.trim() || undefined,
    payAmount: numberValue(data.payAmount),
    payType: data.payType || undefined,
    expiresAt: listingIso(data.expiresAt, true),
    liveFrom: listingIso(data.liveFrom),
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
  if (filters.urgent !== undefined) query.set('urgent', String(filters.urgent));
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
    new Map(
      pages.flatMap(result => result.jobs).map(job => [job.id, job]),
    ).values(),
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
    super(
      'The job was created, but activation could not be confirmed. Refresh your jobs before taking further action.',
    );
  }
}

export class JobCreationUnknownError extends Error {
  constructor(public jobs?: Job[]) {
    super(
      'The creation result is uncertain. Close this form and review your owned jobs before posting again. Your entered form is kept until you close it.',
    );
  }
}

export async function createJob(data: JobForm) {
  const version = getSessionVersion();
  if (!['DRAFT', 'ACTIVE'].includes(data.status))
    throw new Error('Choose draft or published status.');
  if (
    !data.title.trim() ||
    data.title.trim().length > 200 ||
    !data.subject.trim() ||
    !richTextToPlainText(data.description) ||
    data.description.length > 10000 ||
    data.address.trim().length > 250 ||
    data.parkingInfo.trim().length > 1000 ||
    (data.status === 'ACTIVE' &&
      richTextToPlainText(data.description).length < 20)
  )
    throw new Error(
      'Add a title of up to 200 characters, a subject, valid location details, and a description of at least 20 characters.',
    );
  validateJobSchedule(data);
  const payload = await cleanJob(data);
  await checkDropdown('jobStatus', [data.status]);
  if (payload.description.length > 10000)
    throw new Error(
      'Shorten the role description and posting notes to 10,000 characters.',
    );
  if (payload.startDate && Date.parse(payload.startDate) < Date.now())
    throw new Error('Choose a future work start.');
  let created: Job;
  try {
    assertSessionVersion(version);
    created = await protectedRequest<Job>(endpoints.jobs, 'POST', payload);
  } catch (error) {
    if (
      !(error instanceof ApiError) ||
      (error.status !== 0 && error.status < 500)
    )
      throw error;
    let jobs: Job[] | undefined;
    try {
      jobs = await getMyJobs();
    } catch {
      /* Do not retry a possibly completed POST. */
    }
    // Similar job terms cannot prove which POST succeeded. Let the school review.
    throw new JobCreationUnknownError(jobs);
  }

  if (data.status === 'ACTIVE') {
    try {
      assertSessionVersion(version);
      return await protectedRequest<Job>(
        endpoints.jobs + '/' + encodeURIComponent(created.id),
        'PATCH',
        { status: 'ACTIVE' },
      );
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
  return protectedRequest<Job>(
    endpoints.jobsMine + '/' + encodeURIComponent(id),
  );
}

export function getAccessibleJob(id: string) {
  return protectedRequest<Job>(
    endpoints.jobs + '/accessible/' + encodeURIComponent(id),
  );
}

export function jobToForm(job: Job, duplicate = false): JobForm {
  return {
    addressMode: 'different',
    hours: job.hours == null ? '' : String(job.hours),
    days: job.days == null ? '' : String(job.days),
    mode: job.description?.includes('Posting route: Instant matching.')
      ? 'instant'
      : 'brief',
    title: job.title,
    description: editableDescription(job.description || ''),
    subject: writeChoices(job.subjects || (job.subject ? [job.subject] : [])),
    address: job.address || '',
    city: job.city || '',
    county: job.county || '',
    postalCode: job.postalCode || '',
    countryCode: job.countryCode || 'GB',
    startDate: duplicate ? '' : job.startDate ? londonInput(job.startDate) : '',
    endDate: duplicate ? '' : job.endDate ? londonInput(job.endDate) : '',
    expiresAt: duplicate ? '' : job.expiresAt || '',
    liveFrom: duplicate ? '' : job.liveFrom || '',
    payAmount: job.payAmount == null ? '' : String(job.payAmount),
    payType: job.payType || 'daily',
    status: duplicate ? 'DRAFT' : job.status === 'ACTIVE' ? 'ACTIVE' : 'DRAFT',
    minExperienceYears:
      job.minExperienceYears == null ? '' : String(job.minExperienceYears),
    requiredSkills: writeChoices(job.requiredSkills || []),
    keyStages: writeChoices(job.keyStages || []),
    parkingInfo: job.parkingInfo || '',
    qts: job.description?.includes('QTS requested.') ? 'yes' : 'no',
    urgent: job.description?.includes('Marked urgent by the hiring account.')
      ? 'yes'
      : 'no',
  };
}

export async function updateDraftJob(original: Job, data: JobForm) {
  const version = getSessionVersion();
  const before = jobToForm(original);
  validateJobSchedule(data, original);
  if (
    !data.title.trim() ||
    data.title.trim().length > 200 ||
    !richTextToPlainText(data.description) ||
    data.description.length > 10000 ||
    data.address.trim().length > 250 ||
    data.parkingInfo.trim().length > 1000 ||
    (data.status === 'ACTIVE' &&
      richTextToPlainText(data.description).length < 20)
  )
    throw new Error(
      'Add a title and a valid description. Published descriptions need at least 20 visible characters.',
    );
  const latest = await getMyJob(original.id);
  assertSessionVersion(version);
  // A lost activation response can be retried without creating or editing another job.
  const activationOnly =
    original.status === 'DRAFT' &&
    data.status === 'ACTIVE' &&
    Object.keys(before).every(
      key =>
        key === 'status' ||
        data[key as keyof JobForm] === before[key as keyof JobForm],
    );
  if (activationOnly && latest.status === 'ACTIVE') return latest;
  if (
    !['DRAFT', 'ACTIVE'].includes(latest.status || '') ||
    (original.updatedAt && latest.updatedAt !== original.updatedAt)
  )
    throw new Error(
      'This job has changed. Reopen the latest job before saving.',
    );
  const changed: Record<string, unknown> = {};
  for (const field of [
    'title',
    'address',
    'city',
    'county',
    'postalCode',
    'countryCode',
    'parkingInfo',
  ] as const) {
    if (data[field] !== before[field]) changed[field] = data[field].trim();
  }
  if (
    data.description !== before.description ||
    data.qts !== before.qts ||
    data.urgent !== before.urgent ||
    data.mode !== before.mode
  )
    changed.description = descriptionWithNotes(data);
  if (
    data.subject !== before.subject ||
    data.requiredSkills !== before.requiredSkills
  ) {
    const teaching = await teachingPayload(data.subject, data.requiredSkills);
    Object.assign(changed, {
      subjects: teaching.subjects,
      otherSubjects: teaching.otherSubjects,
      requiredSkills: teaching.skills,
      otherSkills: teaching.otherSkills,
    });
  }
  if (data.keyStages !== before.keyStages) {
    await checkDropdown('keyStage', words(data.keyStages));
    changed.keyStages = words(data.keyStages);
  }
  for (const field of ['startDate', 'endDate'] as const) {
    if (data[field] === before[field]) continue;
    if (!data[field] && original[field])
      throw new Error('Replace the existing work date instead of clearing it.');
    const date = isoDate(data[field]);
    if (date && Date.parse(date) < Date.now())
      throw new Error('Choose a future work time.');
    changed[field] = date;
  }
  const start = String(changed.startDate || original.startDate || '');
  const end = String(changed.endDate || original.endDate || '');
  if (start && end && Date.parse(end) < Date.parse(start))
    throw new Error('The end must be after the start.');
  for (const field of ['expiresAt', 'liveFrom'] as const) {
    if (data[field] === before[field]) continue;
    if (field === 'expiresAt' && original.expiresAt && !data.expiresAt)
      throw new Error('Choose a replacement listing expiry.');
    const invalidDate = jobDateError('', '', data[field]);
    if (invalidDate) throw new Error(invalidDate);
    changed[field] = data[field]
      ? listingIso(data[field], field === 'expiresAt')
      : null;
  }
  validateDateWindow({ ...latest, ...changed });
  const units = plannedPayload(data);
  for (const field of ['hours', 'days'] as const) {
    if (data[field] !== before[field] || data.payType !== before.payType)
      changed[field] = units[field];
  }
  if (data.payAmount !== before.payAmount)
    changed.payAmount = numberValue(data.payAmount) ?? null;
  if (data.payType !== before.payType) {
    await checkDropdown('payType', [data.payType]);
    changed.payType = data.payType;
  }
  if (data.minExperienceYears !== before.minExperienceYears)
    changed.minExperienceYears =
      optionalNonNegativeInteger(data.minExperienceYears, 'Experience') ?? null;
  for (const [field, name] of [
    ['city', 'city'],
    ['county', 'region'],
    ['countryCode', 'country'],
  ] as const) {
    if (field in changed)
      await checkDropdown(name, changed[field] ? [String(changed[field])] : []);
  }
  if (data.status === 'ACTIVE' && original.status === 'DRAFT')
    changed.status = 'ACTIVE';
  if (!Object.keys(changed).length) return latest;
  assertSessionVersion(version);
  return protectedRequest<Job>(
    endpoints.jobs + '/' + encodeURIComponent(original.id),
    'PATCH',
    changed,
  );
}
