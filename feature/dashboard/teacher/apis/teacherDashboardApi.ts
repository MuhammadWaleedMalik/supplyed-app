import {
  Application,
  createApplication,
  getMyApplications,
} from '../../shared/apis/applicationsApi';
import { getJobsPage, getJob, Job } from '../../shared/apis/jobsApi';
import type { TeacherApplication } from '../store/teacherSlice';
import { ApiError } from '../../../../utils/api/request';

export type TeacherDashboardData = {
  jobs: Job[];
  applications: TeacherApplication[];
};

export async function getTeacherApplications(): Promise<TeacherApplication[]> {
  const applications = await getMyApplications();

  return Promise.all(
    applications.map(async application => {
      try {
        const job = await getJob(application.jobId);
        return { ...application, job };
      } catch (problem) {
        if (problem instanceof ApiError && problem.status === 404) return application;
        throw problem;
      }
    }),
  );
}

export async function getTeacherDashboardData(): Promise<TeacherDashboardData> {
  const jobs = (await getJobsPage(1)).jobs;
  const applications = await getTeacherApplications();

  return { jobs, applications };
}

export function sendTeacherApplication(
  jobId: string,
  coverLetter: string,
): Promise<Application> {
  return createApplication(jobId, coverLetter);
}
