import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import type { Job } from '../../shared/apis/jobsApi';
import {
  getTeacherApplications,
  sendTeacherApplication,
} from '../apis/teacherDashboardApi';
import { setTeacherApplications } from '../store/teacherSlice';

function messageFromError(problem: unknown) {
  return problem instanceof Error
    ? problem.message
    : 'Unable to submit the application.';
}

export function useTeacherJobs() {
  const dispatch = useAppDispatch();
  const jobs = useAppSelector(state => state.teacherDashboard.jobs);
  const applications = useAppSelector(
    state => state.teacherDashboard.applications,
  );
  const dashboardError = useAppSelector(state => state.teacherDashboard.error);

  const [selectedJob, setSelectedJob] = useState<Job>();
  const [applyStep, setApplyStep] = useState(0);
  const [coverLetter, setCoverLetter] = useState('');
  const [roleType, setRoleType] = useState('All jobs');
  const [keyStage, setKeyStage] = useState('All stages');
  const [subject, setSubject] = useState('All subjects');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const visibleJobs = jobs.filter(job => {
    const matchesUrgency =
      roleType !== 'Urgent only' ||
      (job.description || '').toLowerCase().includes('marked urgent');
    const matchesStage =
      keyStage === 'All stages' || (job.keyStages || []).includes(keyStage);
    const matchesSubject =
      subject === 'All subjects' || job.subject === subject;

    return matchesUrgency && matchesStage && matchesSubject;
  });

  function startApplication(job: Job) {
    setSelectedJob(job);
    setApplyStep(1);
    setCoverLetter('');
    setFormError('');
  }

  function closeApplication() {
    setSelectedJob(undefined);
    setApplyStep(0);
    setFormError('');
  }

  function reviewApplication() {
    setFormError('');
    setApplyStep(2);
  }

  async function submitApplication() {
    if (!selectedJob) {
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      await sendTeacherApplication(selectedJob.id, coverLetter);
      dispatch(setTeacherApplications(await getTeacherApplications()));
      closeApplication();
    } catch (problem) {
      setFormError(messageFromError(problem));
    }

    setSubmitting(false);
  }

  return {
    jobs: visibleJobs,
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
