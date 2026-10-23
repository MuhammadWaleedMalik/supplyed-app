import {
  getApplicationsForJob,
  updateApplicationStatus,
} from '../../shared/apis/applicationsApi';
import { createJob, getMyJobs, Job, JobForm } from '../../shared/apis/jobsApi';
import type { SchoolApplication } from '../store/schoolSlice';

export type SchoolDashboardData = {
  jobs: Job[];
  applications: SchoolApplication[];
};

export async function getSchoolDashboardData(): Promise<SchoolDashboardData> {
  const jobs = await getMyJobs();
  const applicationGroups = await Promise.all(
    jobs.map(job => getApplicationsForJob(job.id)),
  );

  const applications: SchoolApplication[] = [];
  const jobsWithCounts = jobs.map((job, index) => {
    const jobApplications = applicationGroups[index];

    for (const application of jobApplications) {
      applications.push({ ...application, job });
    }

    return {
      ...job,
      applicationCount: jobApplications.length,
    };
  });

  return {
    jobs: jobsWithCounts,
    applications,
  };
}

export function createSchoolJob(form: JobForm) {
  return createJob(form);
}

export function changeApplicationStatus(id: string, status: string) {
  return updateApplicationStatus(id, status);
}
