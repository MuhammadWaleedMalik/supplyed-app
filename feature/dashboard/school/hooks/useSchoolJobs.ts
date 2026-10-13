import { useEffect, useRef, useState } from 'react';
import { getSessionVersion } from '../../../../utils/api/session';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { jobDateError } from '../../../../utils/jobs/dateUtils';
import {
  CURRENT_JOB_STATUSES,
  getMyJobsByStatusesPage,
  JobCreatedError,
  JobForm,
  type Job,
} from '../../shared/apis/jobsApi';
import {
  createSchoolJob,
  getSchoolDashboardData,
} from '../apis/schoolDashboardApi';
import {
  clearSchoolJobSelection,
  selectSchoolJob,
  setSchoolData,
  setSchoolError,
  upsertSchoolJob,
} from '../store/schoolSlice';

const emptyForm: JobForm = {
  mode: '',
  title: '',
  description: '',
  subject: '',
  address: '',
  city: '',
  county: '',
  postalCode: '',
  countryCode: 'GB',
  startDate: '',
  endDate: '',
  payAmount: '',
  payType: 'daily',
  status: 'ACTIVE',
  minExperienceYears: '',
  requiredSkills: '',
  keyStages: '',
  parkingInfo: '',
  expiresAt: '',
  qts: 'no',
  urgent: 'no',
};

function messageFromError(problem: unknown) {
  return problem instanceof Error ? problem.message : 'Unable to save the job.';
}

export function useSchoolJobs() {
  const dispatch = useAppDispatch();
  const dashboardJobs = useAppSelector(state => state.schoolDashboard.jobs);
  const applications = useAppSelector(
    state => state.schoolDashboard.applications,
  );
  const selectedJobId = useAppSelector(
    state => state.schoolDashboard.selectedJobId,
  );
  const dashboardError = useAppSelector(state => state.schoolDashboard.error);

  const [form, setForm] = useState<JobForm>(emptyForm);
  const [postingStep, setPostingStep] = useState(0);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [jobs, setJobs] = useState<Job[]>(dashboardJobs.slice(0, 20));
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsLoadingMore, setJobsLoadingMore] = useState(false);
  const [jobsHasMore, setJobsHasMore] = useState(false);
  const jobsPage = useRef(0);
  const jobsRequest = useRef(0);
  const loadingJobs = useRef(false);
  const savingRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const request = ++jobsRequest.current;
      const version = getSessionVersion();
      loadingJobs.current = true;
      setJobsLoading(true);
      setJobsLoadingMore(false);
      setFormError('');
      getMyJobsByStatusesPage(1, CURRENT_JOB_STATUSES, {
        search,
        status: statusFilter,
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
              problem instanceof Error
                ? problem.message
                : 'Unable to load jobs.',
            );
        })
        .finally(() => {
          if (request === jobsRequest.current) {
            loadingJobs.current = false;
            setJobsLoading(false);
          }
        });
    }, search ? 300 : 0);
    return () => {
      clearTimeout(timer);
      jobsRequest.current += 1;
      loadingJobs.current = false;
    };
  }, [search, statusFilter]);

  async function loadMoreJobs() {
    if (loadingJobs.current || !jobsHasMore) return;
    loadingJobs.current = true;
    setJobsLoadingMore(true);
    const request = jobsRequest.current;
    const version = getSessionVersion();
    try {
      const result = await getMyJobsByStatusesPage(
        jobsPage.current + 1,
        CURRENT_JOB_STATUSES,
        { search, status: statusFilter },
      );
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

  const jobsWithCounts = jobs.map(job => ({
    ...job,
    applicationCount: applications.filter(item => item.jobId === job.id).length,
  }));

  function change(name: keyof JobForm, value: string) {
    setFormError('');
    setForm(current => ({ ...current, [name]: value }));
  }

  function startPosting() {
    setForm(emptyForm);
    setFormError('');
    setPostingStep(1);
  }

  function chooseMode(mode: string) {
    change('mode', mode);
    setPostingStep(2);
  }

  function cancelPosting() {
    if (savingRef.current) return;
    setForm(emptyForm);
    setFormError('');
    setPostingStep(0);
  }

  function previousStep() {
    setFormError('');
    setPostingStep(step => Math.max(1, step - 1));
  }

  function continueToRequirements() {
    const dateError = jobDateError(
      form.startDate,
      form.endDate,
      form.expiresAt,
    );
    const detailsAreReady =
      form.title.trim() && form.subject && form.description.trim().length >= 20;

    if (!detailsAreReady) {
      setFormError(
        'Add a title, subject, and a description of at least 20 characters.',
      );
      return;
    }

    if (dateError) {
      setFormError(dateError);
      return;
    }

    setFormError('');
    setPostingStep(3);
  }

  async function saveJob() {
    if (savingRef.current) return;
    const dateError = jobDateError(
      form.startDate,
      form.endDate,
      form.expiresAt,
    );

    if (dateError) {
      setFormError(dateError);
      return;
    }

    savingRef.current = true;
    const version = getSessionVersion();
    setSaving(true);
    setFormError('');

    try {
      const created = await createSchoolJob(form);
      if (getSessionVersion() !== version) return;
      dispatch(upsertSchoolJob(created));
      setJobs(current => [created, ...current.filter(job => job.id !== created.id)]);
      setForm(emptyForm);
      setPostingStep(0);
      try {
        const data = await getSchoolDashboardData();
        if (getSessionVersion() === version) dispatch(setSchoolData(data));
      } catch (problem) {
        if (getSessionVersion() === version) dispatch(setSchoolError('Job saved. Dashboard refresh failed: ' + messageFromError(problem)));
      }
    } catch (problem) {
      if (getSessionVersion() !== version) return;
      if (problem instanceof JobCreatedError) {
        dispatch(upsertSchoolJob(problem.job));
        setJobs(current => [
          problem.job,
          ...current.filter(job => job.id !== problem.job.id),
        ]);
        setForm(emptyForm);
        setPostingStep(0);
      }
      setFormError(messageFromError(problem));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  function openApplications(jobId: string) {
    dispatch(selectSchoolJob(jobId));
  }

  return {
    jobs: jobsWithCounts,
    jobsLoading,
    jobsLoadingMore,
    jobsHasMore,
    loadMoreJobs,
    selectedJobId,
    selectedJob:
      jobsWithCounts.find(job => job.id === selectedJobId) ||
      dashboardJobs.find(job => job.id === selectedJobId),
    closeJob: () => {
      dispatch(clearSchoolJobSelection());
    },
    form,
    postingStep,
    statusFilter,
    search,
    saving,
    error: formError || dashboardError,
    setStatusFilter,
    setSearch,
    change,
    startPosting,
    chooseMode,
    cancelPosting,
    previousStep,
    continueToRequirements,
    saveJob,
    openApplications,
  };
}
