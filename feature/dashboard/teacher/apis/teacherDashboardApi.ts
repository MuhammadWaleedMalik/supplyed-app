import {
  Application,
  createApplication,
  getMyApplications,
} from '../../shared/apis/applicationsApi';
import { getAllJobs, getJob, Job } from '../../shared/apis/jobsApi';
import type { TeacherApplication } from '../store/teacherSlice';

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
      } catch {
        return application;
      }
    }),
  );
}

export async function getTeacherDashboardData(): Promise<TeacherDashboardData> {
  const jobs = await getAllJobs();
  const applications = await getTeacherApplications();

  return { jobs, applications };
}

export function sendTeacherApplication(
  jobId: string,
  coverLetter: string,
): Promise<Application> {
  return createApplication(jobId, coverLetter);
}
