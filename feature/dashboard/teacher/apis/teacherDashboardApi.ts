import {
  Application,
  createApplication,
  getMyApplications,
} from '../../shared/apis/applicationsApi';
import { getJobsPage, getJob, Job } from '../../shared/apis/jobsApi';
import type { TeacherApplication } from '../store/teacherSlice';

export type TeacherDashboardData = {
  jobs: Job[];
  applications: TeacherApplication[];
};

export async function getTeacherApplications(): Promise<TeacherApplication[]> {
  const applications = await getMyApplications();

  return Promise.all(
    applications.map(async application => {
      const historical = application.jobDetails
        ? ({
            ...application.jobDetails,
            id: application.jobId,
            postedByUserId: '',
            title:
              application.jobName ||
              application.jobDetails.title ||
              'Job title unavailable',
          } as Job)
        : undefined;
      try {
        const job = await getJob(application.jobId);
        return { ...application, job };
      } catch {
        // Embedded history remains usable after the public listing is hidden.
        return historical ? { ...application, job: historical } : application;
      }
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
