import { useEffect, useRef, useState } from 'react';
import { getSessionVersion } from '../../../../utils/api/session';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { getJob, getJobsPage, type Job } from '../../shared/apis/jobsApi';
import {
  getTeacherApplications,
  sendTeacherApplication,
} from '../apis/teacherDashboardApi';
import { setTeacherApplications, setTeacherError } from '../store/teacherSlice';

function messageFromError(problem: unknown) {
  return problem instanceof Error
    ? problem.message
    : 'Unable to submit the application.';
}

export function useTeacherJobs() {
  const dispatch = useAppDispatch();
  const dashboardJobs = useAppSelector(state => state.teacherDashboard.jobs);
  const applications = useAppSelector(
    state => state.teacherDashboard.applications,
  );
  const dashboardError = useAppSelector(state => state.teacherDashboard.error);
  const notificationJobId = useAppSelector(
    state => state.dashboardNavigation.notificationJobId,
  );

  const [selectedJob, setSelectedJob] = useState<Job>();
  const [notificationJob, setNotificationJob] = useState<Job>();
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [applyStep, setApplyStep] = useState(0);
  const [coverLetter, setCoverLetter] = useState('');
  const [roleType, setRoleType] = useState('All jobs');
  const [keyStage, setKeyStage] = useState('All stages');
  const [subject, setSubject] = useState('All subjects');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [jobs, setJobs] = useState<Job[]>(dashboardJobs.slice(0, 20));
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsLoadingMore, setJobsLoadingMore] = useState(false);
  const [jobsHasMore, setJobsHasMore] = useState(false);
  const jobsPage = useRef(0);
  const jobsRequest = useRef(0);
  const loadingJobs = useRef(false);
  const sending = useRef(false);

  useEffect(() => {
    let active = true;
    const version = getSessionVersion();
    setNotificationJob(undefined);
    setNotificationLoading(Boolean(notificationJobId));
    setFormError('');
    if (!notificationJobId) return;

    getJob(notificationJobId)
      .then(job => {
        if (active && version === getSessionVersion()) setNotificationJob(job);
      })
      .catch(problem => {
        if (active && version === getSessionVersion())
          setFormError(problem instanceof Error ? problem.message : 'Unable to load this job.');
      })
      .finally(() => { if (active) setNotificationLoading(false); });
    return () => { active = false; };
  }, [notificationJobId]);

  useEffect(() => {
    if (notificationJobId) return;
    const request = ++jobsRequest.current;
    const version = getSessionVersion();
    loadingJobs.current = true;
    setJobsLoading(true);
    setJobsLoadingMore(false);
    setFormError('');
    getJobsPage(1, {
      urgent: roleType === 'Urgent only' ? true : undefined,
      keyStage,
      subject,
    })
      .then(result => {
        if (
          request !== jobsRequest.current ||
          version !== getSessionVersion()
        )
          return;
        setJobs(result.jobs);
        jobsPage.current = result.page;
        setJobsHasMore(result.hasNextPage);
      })
      .catch(problem => {
        if (
          request === jobsRequest.current &&
          version === getSessionVersion()
        )
          setFormError(
            problem instanceof Error ? problem.message : 'Unable to load jobs.',
          );
      })
      .finally(() => {
        if (request === jobsRequest.current) {
          loadingJobs.current = false;
          setJobsLoading(false);
        }
      });
    return () => {
      jobsRequest.current += 1;
      loadingJobs.current = false;
    };
  }, [roleType, keyStage, subject, notificationJobId]);

  async function loadMoreJobs() {
    if (notificationJobId || loadingJobs.current || !jobsHasMore) return;
    loadingJobs.current = true;
    setJobsLoadingMore(true);
    const request = jobsRequest.current;
    const version = getSessionVersion();
    try {
      const result = await getJobsPage(jobsPage.current + 1, {
        urgent: roleType === 'Urgent only' ? true : undefined,
        keyStage,
        subject,
      });
      if (request !== jobsRequest.current || version !== getSessionVersion())
        return;
      setJobs(current => [
        ...current,
        ...result.jobs.filter(
          job => !current.some(existing => existing.id === job.id),
        ),
      ]);
      jobsPage.current = result.page;
      setJobsHasMore(result.hasNextPage);
    } catch (problem) {
      if (request === jobsRequest.current && version === getSessionVersion())
        setFormError(
          problem instanceof Error
            ? problem.message
            : 'Unable to load more jobs.',
        );
    } finally {
      loadingJobs.current = false;
      if (request === jobsRequest.current) setJobsLoadingMore(false);
    }
  }

  function startApplication(job: Job) {
    setSelectedJob(job);
    setApplyStep(1);
    setCoverLetter('');
    setFormError('');
  }

  function closeApplication() {
    if (submitting) return;
    setSelectedJob(undefined);
    setApplyStep(0);
    setFormError('');
  }

  function reviewApplication() {
    setFormError('');
    setApplyStep(2);
  }

  async function submitApplication() {
    if (!selectedJob || sending.current) {
      return;
    }

    sending.current = true;
    const version = getSessionVersion();
    setSubmitting(true);
    setFormError('');

    try {
      const created = await sendTeacherApplication(selectedJob.id, coverLetter);
      if (getSessionVersion() !== version) return;
      dispatch(setTeacherApplications([...applications.filter(item => item.id !== created.id), { ...created, job: selectedJob }]));
      setSelectedJob(undefined);
      setApplyStep(0);
      try {
        const latest = await getTeacherApplications();
        if (getSessionVersion() === version) dispatch(setTeacherApplications(latest));
      } catch (problem) {
        if (getSessionVersion() === version) dispatch(setTeacherError('Application submitted. Refresh failed: ' + messageFromError(problem)));
      }
    } catch (problem) {
      if (getSessionVersion() === version) setFormError(messageFromError(problem));
    } finally {
      sending.current = false;
      setSubmitting(false);
    }
  }

  return {
    jobs: notificationJobId ? (notificationJob ? [notificationJob] : []) : jobs,
    jobsLoading: notificationJobId ? notificationLoading : jobsLoading,
    notificationJobId,
    jobsLoadingMore,
    jobsHasMore,
    loadMoreJobs,
    applications,
    selectedJob,
    applyStep,
    coverLetter,
    roleType,
    keyStage,
    subject,
    submitting,
    error: formError || dashboardError,
    setCoverLetter,
    setRoleType,
    setKeyStage,
    setSubject,
    setApplyStep,
    startApplication,
    closeApplication,
    reviewApplication,
    submitApplication,
  };
}
