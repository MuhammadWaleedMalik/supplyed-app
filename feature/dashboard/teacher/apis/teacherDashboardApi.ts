import {
  Application,
  createApplication,
  getMyApplications,
} from '../../shared/apis/applicationsApi';
import { getJobsPage, Job } from '../../shared/apis/jobsApi';
import type { TeacherApplication } from '../store/teacherSlice';

export type TeacherDashboardData = {
  jobs: Job[];
  applications: TeacherApplication[];
};

export async function getTeacherApplications(): Promise<TeacherApplication[]> {
  const applications = await getMyApplications();

  return Promise.all(
    applications.map(async application => {
      const historical = application.agreedTerms
        ? ({
            ...application.agreedTerms,
            id: application.jobId,
            postedByUserId: '',
            title:
              application.jobName ||
              application.agreedTerms.title ||
              'Job title unavailable',
          } as Job)
        : undefined;
      return historical ? { ...application, job: historical } : application;
    }),
  );
}

export async function getTeacherDashboardData(): Promise<TeacherDashboardData> {
  const applications = await getTeacherApplications();
  let jobs: Job[] = [];
  try {
    jobs = (await getJobsPage(1)).jobs;
  } catch {
    // Discovery loads its own pages and errors. It must not block application history.
  }

  return { jobs, applications };
}

export function sendTeacherApplication(
  jobId: string,
  coverLetter: string,
): Promise<Application> {
  return createApplication(jobId, coverLetter);
}
