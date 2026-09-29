import { endpoints } from '../../../../constants/endpoints';
import { protectedRequest } from '../../../../utils/api/request';

export type Application = {
  id: string;
  jobId: string;
  instructorId: string;
  status: string;
  coverLetter?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type ApplicationPage = {
  applications?: Application[];
  pagination?: { hasNextPage?: boolean };
};

function listFromReply(reply: Application[] | ApplicationPage) {
  return Array.isArray(reply) ? reply : reply.applications || [];
}

export async function createApplication(jobId: string, coverLetter: string) {
  return protectedRequest<Application>(endpoints.applications, 'POST', {
    jobId,
    coverLetter: coverLetter.trim() || undefined,
  });
}

export async function getMyApplications(status = '') {
  const path = endpoints.applicationsMine + '?page=1&limit=100' +
    (status ? '&status=' + status : '');
  return listFromReply(await protectedRequest<Application[] | ApplicationPage>(path));
}

export async function getApplicationsForJob(jobId: string, status = '') {
  const path = endpoints.applicationsByJob + '/' + jobId + '?page=1&limit=100' +
    (status ? '&status=' + status : '');
  return listFromReply(await protectedRequest<Application[] | ApplicationPage>(path));
}

export function updateApplicationStatus(id: string, status: string) {
  return protectedRequest<Application>(endpoints.applications + '/' + id + '/status', 'PATCH', {
    status,
  });
}
