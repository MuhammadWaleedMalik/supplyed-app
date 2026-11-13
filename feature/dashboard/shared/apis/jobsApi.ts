import {
  plannedPayload,
  scheduleDateWindow,
  validateDateWindow,
  listingInstant,
  type PlannedWorkUnits,
} from '../../../../utils/jobs/workSchedule';
import { readChoices, writeChoices } from '../../../../utils/ui/choices';
import { teachingPayload } from '../../../../utils/onboarding/teachingChoices';
import { checkDropdown } from '../../../dropdowns/apis/dropdownsApi';
import { richTextToPlainText } from '../../../../utils/ui/richText';
import {
  londonDate,
  londonToIso,
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
  canDelete?: boolean;
  termsLocked?: boolean;
  hasBeenPublished?: boolean;
  institution?: { id: string; name: string; imageUrl?: string | null } | null;
  id: string;
  jobType?: 'INSTANT' | 'BRIEF';
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
  currency?: string;
  paymentFrequency?: string;
  periodAnchor?: 'ASSIGNMENT_START' | 'CALENDAR';
  timeZone?: string;
  schedule?: JobSchedule | null;
  workersRequired?: number;
  scheduledMinutes?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  status?: string;
  expiresAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  applicationCount?: number;
};

export type JobSlot = { start: string; end: string };
export type JobSchedule = {
  weekdays: { day: number; slots: JobSlot[] }[];
  exceptions?: {
    date: string;
    kind: 'add' | 'exclude' | 'replace';
    slots?: JobSlot[];
  }[];
};

export const CURRENT_JOB_STATUSES = ['ACTIVE', 'DRAFT', 'RESERVED'] as const;
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
  timeZone: string;
  currency: string;
  paymentFrequency: string;
  periodAnchor: string;
  workersRequired: string;
  schedule: string;
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
  jobType?: 'INSTANT' | 'BRIEF';
};

export type JobPage = {
  jobs: Job[];
  page: number;
  hasNextPage: boolean;
  total?: number;
};

function words(value: string) {
  return readChoices(value);
}

function isoDate(value: string) {
  if (!value.trim()) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parsed = new Date(
    /T\d{2}:\d{2}$/.test(value) ? londonToIso(value) : value,
  );
  if (!Number.isFinite(parsed.getTime()))
    throw new Error('Enter a valid work date.');
  return londonDate(parsed);
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
  return editableDescription(data.description);
}

function schedulePayload(value: string): JobSchedule | undefined {
  if (!value.trim()) return undefined;
  let schedule: JobSchedule;
  try {
    schedule = JSON.parse(value) as JobSchedule;
  } catch {
    throw new Error('The work schedule could not be read. Re-enter its hours.');
  }
  if (!Array.isArray(schedule.weekdays) || !schedule.weekdays.length)
    throw new Error('Choose at least one working weekday.');
  const time = /^(?:[01]\d|2[0-3]):00$/;
  const days = new Set<number>();
  for (const weekday of schedule.weekdays) {
    if (
      !Number.isInteger(weekday.day) ||
      weekday.day < 0 ||
      weekday.day > 6 ||
      days.has(weekday.day)
    )
      throw new Error('Choose each working weekday once.');
    days.add(weekday.day);
    if (!Array.isArray(weekday.slots) || !weekday.slots.length)
      throw new Error('Add at least one shift for every working weekday.');
    for (const slot of weekday.slots) {
      if (
        !time.test(slot.start) ||
        !time.test(slot.end) ||
        slot.start === slot.end
      )
        throw new Error(
          'Use whole-hour, non-zero shift times such as 09:00 to 17:00.',
        );
    }
  }
  const exceptionDates = new Set<string>();
  for (const exception of schedule.exceptions || []) {
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(exception.date) ||
      exceptionDates.has(exception.date) ||
      !['add', 'exclude', 'replace'].includes(exception.kind)
    )
      throw new Error('Use one valid action for each schedule exception date.');
    exceptionDates.add(exception.date);
    if (exception.kind === 'exclude') continue;
    if (!exception.slots?.length)
      throw new Error('Add at least one shift for each schedule exception.');
    if (
      exception.slots.some(
        slot =>
          !time.test(slot.start) ||
          !time.test(slot.end) ||
          slot.start === slot.end,
      )
    )
      throw new Error('Use whole-hour, non-zero exception shift times.');
  }
  return {
    weekdays: schedule.weekdays,
    exceptions: schedule.exceptions || [],
  };
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
  const parsedSchedule = schedulePayload(data.schedule);
  const dateWindow = scheduleDateWindow(data.startDate, data.endDate);
  if (
    parsedSchedule &&
    dateWindow &&
    parsedSchedule.weekdays.some(item => !dateWindow.available.has(item.day))
  )
    throw new Error(
      'Choose only weekdays that occur within the assignment date range.',
    );
  const selectableFrequencies: Record<string, string[]> = {
    hourly: ['daily', 'weekly', 'monthly'],
    daily: ['daily', 'weekly', 'monthly'],
    fixed: ['completion'],
  };
  const preservesHistoricalFrequency = Boolean(
    original &&
      data.payType === original.payType &&
      data.paymentFrequency === original.paymentFrequency,
  );
  if (
    data.payType &&
    !selectableFrequencies[data.payType]?.includes(data.paymentFrequency) &&
    !preservesHistoricalFrequency
  )
    throw new Error('Choose a supported payment frequency for this pay basis.');
  if (
    data.startDate &&
    (!before || data.startDate !== before.startDate) &&
    Date.parse(isoDate(data.startDate) + 'T23:59:59Z') < Date.now()
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
  await checkDropdown('currency', [data.currency || 'GBP']);
  return {
    ...units,
    jobType: (data.mode === 'instant' ? 'INSTANT' : 'BRIEF') as
      | 'INSTANT'
      | 'BRIEF',
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
    startDate: data.startDate ? isoDate(data.startDate) : undefined,
    endDate: data.endDate ? isoDate(data.endDate) : undefined,
    keyStages: words(data.keyStages),
    parkingInfo: data.parkingInfo.trim() || undefined,
    payAmount: numberValue(data.payAmount),
    payType: data.payType || undefined,
    currency: data.currency || 'GBP',
    paymentFrequency: data.paymentFrequency || undefined,
    periodAnchor:
      (data.periodAnchor === 'CALENDAR'
        ? 'CALENDAR'
        : 'ASSIGNMENT_START') as 'ASSIGNMENT_START' | 'CALENDAR',
    timeZone: data.timeZone || timezone,
    schedule: schedulePayload(data.schedule),
    workersRequired:
      optionalNonNegativeInteger(data.workersRequired, 'Number of workers') || 1,
    expiresAt: listingIso(data.expiresAt, true),
    liveFrom: listingIso(data.liveFrom),
  };
}

// The API checks these again. Drafts can stay incomplete; published jobs and invitations cannot.
export function validateBookableJob(job: Partial<Job>) {
  if (job.jobType && !['INSTANT', 'BRIEF'].includes(job.jobType))
    throw new Error('Choose targeted matching or open applications.');
  if (!job.title?.trim()) throw new Error('Enter the job title.');
  if (!richTextToPlainText(job.description || ''))
    throw new Error('Enter the role description.');
  if (!job.subject?.trim() && !job.subjects?.length)
    throw new Error('Choose at least one subject.');
  if (!job.keyStages?.length) throw new Error('Choose at least one key stage.');
  if (
    !job.address?.trim() ||
    !job.city?.trim() ||
    !job.postalCode?.trim() ||
    !job.countryCode?.trim()
  )
    throw new Error('Enter the work address, city, postcode and country.');
  const start = Date.parse(job.startDate || '');
  const end = Date.parse(job.endDate || '');
  if (!Number.isFinite(start) || start <= Date.now())
    throw new Error('Choose a future work start.');
  if (!Number.isFinite(end) || end < start)
    throw new Error('Choose an end on or after the start.');
  if (!Number.isFinite(Number(job.payAmount)) || Number(job.payAmount) <= 0)
    throw new Error('Enter a pay amount greater than zero.');
  if (!['hourly', 'daily', 'fixed'].includes(job.payType || ''))
    throw new Error('Choose hourly, daily or fixed pay.');
  const day = (date: number) =>
    Date.parse(
      new Date(date).toLocaleDateString('en-CA', { timeZone: 'Europe/London' }),
    );
  const days = Math.round((day(end) - day(start)) / 86400000) + 1;
  if (
    !job.schedule &&
    job.payType === 'hourly' &&
    (!Number.isInteger(job.hours) ||
      Number(job.hours) <= 0 ||
      Number(job.hours) > days * 24)
  )
    throw new Error(
      'Enter positive whole working hours within the work period.',
    );
  if (
    !job.schedule &&
    job.payType === 'daily' &&
    (!Number.isInteger(job.days) ||
      Number(job.days) <= 0 ||
      Number(job.days) > days)
  )
    throw new Error(
      'Enter positive whole working days within the work period.',
    );
  if (job.payType !== 'hourly' && job.hours != null)
    throw new Error('Hours are only allowed for hourly pay.');
  if (job.payType !== 'daily' && job.days != null)
    throw new Error('Days are only allowed for daily pay.');
  validateDateWindow(job);
  if (job.expiresAt && listingInstant(job.expiresAt, true) <= Date.now())
    throw new Error('Choose a future listing expiry.');
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
  if (filters.jobType) query.set('jobType', filters.jobType);
  const result = await protectedRequest<{
    jobs?: unknown;
    pagination?: { page?: unknown; hasNextPage?: unknown; total?: unknown };
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
    total:
      typeof result.pagination?.total === 'number'
        ? result.pagination.total
        : undefined,
  };
}

export function getJobsPage(page: number, filters: JobFilters = {}) {
  return getJobsPageAt(endpoints.jobs, page, filters);
}

export function getMyJobsPage(page: number, filters: JobFilters = {}) {
  return getJobsPageAt(endpoints.jobsMine, page, filters);
}

export function getInstitutionJobsPage(
  institutionId: string,
  page: number,
  filters: JobFilters = {},
) {
  return getJobsPageAt(
    endpoints.jobs + '/institution/' + encodeURIComponent(institutionId),
    page,
    filters,
  );
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
  if (data.status === 'ACTIVE') validateBookableJob(payload);
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
    mode: job.jobType === 'INSTANT' ? 'instant' : 'brief',
    timeZone: job.timeZone || 'Europe/London',
    currency: job.currency || 'GBP',
    paymentFrequency:
      job.paymentFrequency ||
      (job.payType === 'fixed'
        ? 'completion'
        : job.payType === 'hourly'
        ? 'hourly'
        : 'daily'),
    periodAnchor: job.periodAnchor || 'ASSIGNMENT_START',
    workersRequired: String(job.workersRequired || 1),
    schedule: JSON.stringify(
      job.schedule || {
        weekdays: [1, 2, 3, 4, 5].map(day => ({
          day,
          slots: [{ start: '09:00', end: '17:00' }],
        })),
        exceptions: [],
      },
    ),
    title: job.title,
    description: editableDescription(job.description || ''),
    subject: writeChoices(job.subjects || (job.subject ? [job.subject] : [])),
    address: job.address || '',
    city: job.city || '',
    county: job.county || '',
    postalCode: job.postalCode || '',
    countryCode: job.countryCode || 'GB',
    startDate:
      duplicate || !job.startDate ? '' : londonDate(new Date(job.startDate)),
    endDate:
      duplicate || !job.endDate ? '' : londonDate(new Date(job.endDate)),
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
    data.description !== before.description
  )
    changed.description = descriptionWithNotes(data);
  if (data.mode !== before.mode)
    changed.jobType = data.mode === 'instant' ? 'INSTANT' : 'BRIEF';
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
  for (const field of [
    'paymentFrequency',
    'periodAnchor',
    'timeZone',
  ] as const) {
    if (data[field] !== before[field]) changed[field] = data[field];
  }
  if (data.workersRequired !== before.workersRequired)
    changed.workersRequired =
      optionalNonNegativeInteger(data.workersRequired, 'Number of workers') || 1;
  if (data.schedule !== before.schedule)
    changed.schedule = schedulePayload(data.schedule);
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
  if (
    latest.termsLocked &&
    Object.keys(changed).some(
      key => !['status', 'liveFrom', 'expiresAt'].includes(key),
    )
  )
    throw new Error(
      'This job has activity. Its agreed terms cannot be edited; duplicate it as a new draft instead.',
    );
  if (data.status === 'ACTIVE') validateBookableJob({ ...latest, ...changed });
  if (!Object.keys(changed).length) return latest;
  assertSessionVersion(version);
  return protectedRequest<Job>(
    endpoints.jobs + '/' + encodeURIComponent(original.id),
    'PATCH',
    changed,
  );
}
