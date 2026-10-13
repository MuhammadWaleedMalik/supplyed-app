import { endpoints } from '../../../../constants/endpoints';
import { protectedRequest } from '../../../../utils/api/request';
import { getAllPages } from '../../../../utils/api/pagination';

export type Application = {
  id: string;
  jobId: string;
  jobName?: string;
  instructorId: string;
  status: string;
  coverLetter?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export async function createApplication(jobId: string, coverLetter: string) {
  return protectedRequest<Application>(endpoints.applications, 'POST', {
    jobId,
    coverLetter: coverLetter.trim() || undefined,
  });
}

export async function getMyApplications(status = '') {
  const path = endpoints.applicationsMine + (status ? '?status=' + encodeURIComponent(status) : '');
  return getAllPages<Application>(path, 'applications');
}

export async function getApplicationsForJob(jobId: string, status = '') {
  const path = endpoints.applicationsByJob + '/' + encodeURIComponent(jobId) +
    (status ? '?status=' + encodeURIComponent(status) : '');
  return getAllPages<Application>(path, 'applications');
}

export function updateApplicationStatus(id: string, status: string) {
  return protectedRequest<Application>(endpoints.applications + '/' + id + '/status', 'PATCH', {
    status,
  });
}
