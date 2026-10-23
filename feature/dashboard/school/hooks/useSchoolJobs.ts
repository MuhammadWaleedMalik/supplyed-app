import { changeSchedule } from '../../../../utils/jobs/workSchedule';
import { richTextToPlainText } from '../../../../utils/ui/richText';
import { useSessionState } from '../../../../utils/ui/useSessionState';
import { useEffect, useRef, useState } from 'react';
import { getSessionVersion } from '../../../../utils/api/session';
import { protectedRequest } from '../../../../utils/api/request';
import { endpoints } from '../../../../constants/endpoints';
import {
  hasSchoolAddress,
  jobAddress,
  JobAddress,
  sameJobAddress,
} from '../../../../utils/jobs/jobAddress';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
  clearJobCopy,
  refreshMarketplace,
} from '../../shared/store/navigationSlice';
import {
  validateJobSchedule,
  getMyJob,
  jobToForm,
  updateDraftJob,
  CURRENT_JOB_STATUSES,
  getMyJobsByStatusesPage,
  JobCreatedError,
  JobCreationUnknownError,
  JobForm,
  type Job,
} from '../../shared/apis/jobsApi';
import {
  createSchoolJob,
} from '../apis/schoolDashboardApi';
import {
  clearSchoolJobSelection,
  selectSchoolJob,
  upsertSchoolJob,
} from '../store/schoolSlice';

const emptyForm: JobForm = {
  addressMode: 'different',
  hours: '',
  days: '',
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
  liveFrom: '',
  qts: 'no',
  urgent: 'no',
};

function messageFromError(problem: unknown) {
  return problem instanceof Error ? problem.message : 'Unable to save the job.';
}

export function useSchoolJobs() {
  const dispatch = useAppDispatch();
  const dashboardJobs = useAppSelector(state => state.schoolDashboard.jobs);
  const selectedJobId = useAppSelector(
    state => state.schoolDashboard.selectedJobId,
  );
  const dashboardError = useAppSelector(state => state.schoolDashboard.error);
  const duplicateJobId = useAppSelector(
    state => state.dashboardNavigation.duplicateJobId,
  );

  const notificationJobId = useAppSelector(
    state => state.dashboardNavigation.notificationJobId,
  );
  const [linkedJob, setLinkedJob] = useState<Job>();
  const [editingJob, setEditingJob] = useState<Job>();
  const [duplicating, setDuplicating] = useState(false);
  const [openingEditor, setOpeningEditor] = useState(false);
  const [schoolAddress, setSchoolAddress] = useState<JobAddress>();
  const alternateAddress = useRef<JobAddress>(jobAddress());
  const editorRequest = useRef(0);
  useEffect(
    () => () => {
      editorRequest.current += 1;
    },
    [],
  );
  const [form, setForm] = useState<JobForm>(emptyForm);
  const [postingStep, setPostingStep] = useState(0);
  const [statusFilter, setStatusFilter] = useSessionState(
    'school.jobs.statusFilter',
    'ALL',
  );
  const [search, setSearch] = useSessionState('school.jobs.search', '');
  const [saving, setSaving] = useState(false);
  const [creationUncertain, setCreationUncertain] = useState(false);
  const [formError, setFormError] = useState('');
  const [jobs, setJobs] = useState<Job[]>(dashboardJobs.slice(0, 20));
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsRevision, setJobsRevision] = useState(0);
  const [jobsLoadingMore, setJobsLoadingMore] = useState(false);
  const [jobsHasMore, setJobsHasMore] = useState(false);
  const jobsPage = useRef(0);
  const jobsRequest = useRef(0);
  const loadingJobs = useRef(false);
  const savingRef = useRef(false);
  useEffect(() => {
    setLinkedJob(undefined);
    if (!notificationJobId) return;
    let active = true;
    const version = getSessionVersion();
    setFormError('');
    getMyJob(notificationJobId)
      .then(job => {
        if (active && version === getSessionVersion()) {
          setLinkedJob(job);
          dispatch(selectSchoolJob(job.id));
        }
      })
      .catch(problem => {
        if (active && version === getSessionVersion())
          setFormError(messageFromError(problem));
      });
    return () => {
      active = false;
      dispatch(clearSchoolJobSelection());
    };
  }, [dispatch, notificationJobId]);
  useEffect(() => {
    if (!duplicateJobId) return;
    let active = true;
    const version = getSessionVersion();
    setOpeningEditor(true);
    setFormError('');
    getMyJob(duplicateJobId)
      .then(job => {
        if (!active || version !== getSessionVersion()) return;
        setEditingJob(undefined);
        setDuplicating(true);
        setForm(jobToForm(job, true));
        dispatch(clearSchoolJobSelection());
        setPostingStep(2);
      })
      .catch(problem => {
        if (active && version === getSessionVersion())
          setFormError(messageFromError(problem));
      })
      .finally(() => {
        if (active && version === getSessionVersion()) {
          setOpeningEditor(false);
          dispatch(clearJobCopy());
        }
      });
    return () => {
      active = false;
    };
  }, [dispatch, duplicateJobId]);

  useEffect(() => {
    const timer = setTimeout(
      () => {
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
      },
      search ? 300 : 0,
    );
    return () => {
      clearTimeout(timer);
      jobsRequest.current += 1;
      loadingJobs.current = false;
    };
  }, [search, statusFilter, jobsRevision]);

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
    applicationCount:
      job.applicationCount ??
      dashboardJobs.find(saved => saved.id === job.id)?.applicationCount,
  }));

  function change(name: keyof JobForm, value: string) {
    setFormError('');
    setForm(current => changeSchedule(current, name, value));
  }

  async function loadSchoolAddress() {
    const version = getSessionVersion();
    const profile = await protectedRequest<Partial<JobAddress>>(
      endpoints.schoolMe,
    );
    if (version !== getSessionVersion())
      throw new Error('Your session changed. Reopen the job form.');
    const address = jobAddress(profile);
    if (!hasSchoolAddress(address))
      throw new Error(
        'Your school profile does not have a complete address. Use a different job address or update the profile.',
      );
    setSchoolAddress(address);
    return address;
  }

  function initializeAddress(base: JobForm, address?: JobAddress) {
    const saved = jobAddress(base);
    if (address && sameJobAddress(saved, address)) {
      alternateAddress.current = jobAddress();
      return { ...base, ...address, addressMode: 'school' as const };
    }
    alternateAddress.current = saved;
    return { ...base, addressMode: 'different' as const };
  }

  function changeAddressMode(mode: 'school' | 'different') {
    setForm(current => {
      if (mode === current.addressMode) return current;
      if (mode === 'school') {
        if (!schoolAddress) {
          setFormError(
            'The school address is unavailable. Retry the job form or use a different address.',
          );
          return current;
        }
        alternateAddress.current = jobAddress(current);
        return { ...current, ...schoolAddress, addressMode: 'school' };
      }
      return {
        ...current,
        ...alternateAddress.current,
        addressMode: 'different',
      };
    });
  }

  async function startPosting() {
    if (openingEditor) return;
    setOpeningEditor(true);
    const version = getSessionVersion();
    setCreationUncertain(false);
    setEditingJob(undefined);
    setDuplicating(false);
    setFormError('');
    try {
      const address = await loadSchoolAddress();
      if (version !== getSessionVersion()) return;
      alternateAddress.current = jobAddress();
      setForm({ ...emptyForm, ...address, addressMode: 'school' });
    } catch (problem) {
      if (version !== getSessionVersion()) return;
      alternateAddress.current = jobAddress();
      setForm(emptyForm);
      setFormError(messageFromError(problem));
    } finally {
      if (version !== getSessionVersion()) return;
      setOpeningEditor(false);
      setPostingStep(1);
    }
  }

  function chooseMode(mode: string) {
    change('mode', mode);
    setPostingStep(2);
  }

  function cancelPosting() {
    if (savingRef.current) return;
    setEditingJob(undefined);
    setDuplicating(false);
    setForm(emptyForm);
    setFormError('');
    setPostingStep(0);
  }

  function previousStep() {
    setFormError('');
    setPostingStep(step =>
      Math.max(editingJob || duplicating ? 2 : 1, step - 1),
    );
  }

  function continueToRequirements() {
    let dateError = '';
    const detailsAreReady =
      form.title.trim() &&
      form.subject &&
      richTextToPlainText(form.description).length >=
        (form.status === 'ACTIVE' ? 20 : 1) &&
      form.description.length <= 10000;

    if (!detailsAreReady) {
      setFormError(
        'Add a title, subject, and a description of at least 20 characters.',
      );
      return;
    }

    try {
      validateJobSchedule(form, editingJob);
    } catch (problem) {
      dateError = messageFromError(problem);
    }
    if (dateError) {
      setPostingStep(2);
      setFormError(dateError);
      return;
    }

    setFormError('');
    setPostingStep(current => Math.min(4, current + 1));
  }

  async function saveJob() {
    if (savingRef.current || creationUncertain) return;
    let dateError = '';

    try {
      validateJobSchedule(form, editingJob);
    } catch (problem) {
      dateError = messageFromError(problem);
    }
    if (dateError) {
      setPostingStep(2);
      setFormError(dateError);
      return;
    }

    savingRef.current = true;
    const version = getSessionVersion();
    setSaving(true);
    setFormError('');

    try {
      const created = editingJob
        ? await updateDraftJob(editingJob, form)
        : await createSchoolJob(
            duplicating ? { ...form, status: 'DRAFT' } : form,
          );
      if (getSessionVersion() !== version) return;
      dispatch(upsertSchoolJob(created));
      dispatch(refreshMarketplace());
      setSearch('');
      setStatusFilter('ALL');
      setJobs(current => [
        created,
        ...current.filter(job => job.id !== created.id),
      ]);
      setForm(emptyForm);
      setEditingJob(undefined);
      setDuplicating(false);
      setPostingStep(0);
      setJobsRevision(value => value + 1);
    } catch (problem) {
      if (getSessionVersion() !== version) return;
      if (problem instanceof JobCreationUnknownError) {
        setCreationUncertain(true);
        if (problem.jobs)
          setJobs(
            problem.jobs.filter(job =>
              ['ACTIVE', 'DRAFT'].includes(job.status || ''),
            ),
          );
      }
      if (problem instanceof JobCreatedError) {
        dispatch(upsertSchoolJob(problem.job));
        setJobs(current => [
          problem.job,
          ...current.filter(job => job.id !== problem.job.id),
        ]);
        setEditingJob(problem.job);
        setForm({ ...jobToForm(problem.job), status: 'ACTIVE' });
      }
      setFormError(messageFromError(problem));
      setPostingStep(2);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  async function openEditor(job: Job, duplicate = false) {
    if (openingEditor || savingRef.current) return;
    const request = ++editorRequest.current;
    const version = getSessionVersion();
    setOpeningEditor(true);
    setFormError('');
    try {
      const [current, address] = await Promise.all([
        getMyJob(job.id),
        loadSchoolAddress().catch(problem => {
          setFormError(messageFromError(problem));
          return undefined;
        }),
      ]);
      if (request !== editorRequest.current || version !== getSessionVersion())
        return;
      if (!duplicate && !['DRAFT', 'ACTIVE'].includes(current.status || ''))
        throw new Error(
          'Only drafts and active jobs can be edited. Duplicate this job to prepare a new draft.',
        );
      setEditingJob(duplicate ? undefined : current);
      setDuplicating(duplicate);
      setForm(initializeAddress(jobToForm(current, duplicate), address));
      dispatch(clearSchoolJobSelection());
      setPostingStep(2);
    } catch (problem) {
      if (request === editorRequest.current && version === getSessionVersion())
        setFormError(messageFromError(problem));
    } finally {
      if (request === editorRequest.current) setOpeningEditor(false);
    }
  }

  function openApplications(jobId: string) {
    dispatch(selectSchoolJob(jobId));
  }

  return {
    refreshJobs: () => {
      dispatch(clearSchoolJobSelection());
      setJobsRevision(value => value + 1);
    },
    editingJob,
    duplicating,
    openingEditor,
    openEditor,
    jobs: jobsWithCounts,
    jobsLoading,
    jobsLoadingMore,
    jobsHasMore,
    loadMoreJobs,
    selectedJobId,
    selectedJob:
      jobsWithCounts.find(job => job.id === selectedJobId) ||
      dashboardJobs.find(job => job.id === selectedJobId) ||
      (linkedJob?.id === selectedJobId ? linkedJob : undefined),
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
    changeAddressMode,
    schoolAddress,
    startPosting,
    chooseMode,
    cancelPosting,
    previousStep,
    continueToRequirements,
    saveJob,
    openApplications,
  };
}
