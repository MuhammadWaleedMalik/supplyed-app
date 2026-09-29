import { endpoints } from '../../../../constants/endpoints';
import { protectedRequest } from '../../../../utils/api/request';

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
  applicationCount?: number;
};

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
  if (!value.trim()) {
    return undefined;
  }

  const next = Number(value);
  return Number.isFinite(next) && next >= 0 ? next : undefined;
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
    minExperienceYears: numberValue(data.minExperienceYears),
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
  const reply = await protectedRequest<Job[] | { jobs?: Job[] }>(
    endpoints.jobs,
  );

  if (Array.isArray(reply)) {
    return reply;
  }

  return reply.jobs || [];
}

export async function getMyJobs() {
  const reply = await protectedRequest<Job[] | { jobs?: Job[] }>(
    endpoints.jobsMine,
  );

  if (Array.isArray(reply)) {
    return reply;
  }

  return reply.jobs || [];
}

export async function createJob(data: JobForm) {
  const payload = cleanJob(data);
  const created = await protectedRequest<Job>(endpoints.jobs, 'POST', payload);

  if (data.status === 'ACTIVE') {
    return protectedRequest<Job>(endpoints.jobs + '/' + created.id, 'PATCH', {
      status: 'ACTIVE',
    });
  }

  return created;
}

export function getJob(id: string) {
  return protectedRequest<Job>(endpoints.jobs + '/' + id);
}
