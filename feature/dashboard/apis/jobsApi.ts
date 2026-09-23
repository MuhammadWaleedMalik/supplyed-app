import { endpoints } from '../../../constants/endpoints';
import { protectedRequest } from '../../../utils/api/request';

export type Job = {
  id: string;
  title: string;
  description?: string;
  subject?: string;
  city?: string;
  status?: string;
  payAmount?: number;
  payType?: string;
  startDate?: string;
  endDate?: string;
};

export type JobForm = {
  title: string;
  description: string;
  subject: string;
  city: string;
  startDate: string;
  endDate: string;
  payAmount: string;
  status: string;
};

function cleanJob(data: JobForm) {
  return {
    title: data.title.trim(),
    description: data.description.trim(),
    subject: data.subject.trim(),
    city: data.city.trim(),
    startDate: data.startDate.trim(),
    endDate: data.endDate.trim(),
    payAmount: Number(data.payAmount) || undefined,
    payType: data.payAmount ? 'daily' : undefined,
    status: data.status,
  };
}

export async function getMyJobs() {
  const reply = await protectedRequest<Job[] | { jobs?: Job[] }>(endpoints.jobsMine);
  if (Array.isArray(reply)) return reply;
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

export async function getRecommendedJobs() {
  const reply = await protectedRequest<{ jobs?: { job: Job; match?: { score?: number } }[] }>(
    endpoints.matchingRecommendedJobs + '?page=1&limit=20&minScore=0',
  );
  return reply.jobs || [];
}
export function getJob(id: string) {
  return protectedRequest<Job>(endpoints.jobs + '/' + id);
}

export function getRecommendedInstructors(jobId: string) {
  return protectedRequest(
    endpoints.matchingJobs + '/' + jobId + '/instructors?page=1&limit=20&minScore=50',
  );
}

export function getRankedApplications(jobId: string) {
  return protectedRequest(
    endpoints.matchingJobs + '/' + jobId + '/applications?page=1&limit=20&minScore=0',
  );
}

export function getJobMatchScore(jobId: string) {
  return protectedRequest(endpoints.matchingJobs + '/' + jobId + '/score');
}

