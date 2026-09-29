import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { jobDateError } from '../../../../utils/jobs/dateUtils';
import type { JobForm } from '../../shared/apis/jobsApi';
import { showPage } from '../../shared/store/navigationSlice';
import {
  createSchoolJob,
  getSchoolDashboardData,
} from '../apis/schoolDashboardApi';
import { selectSchoolJob, setSchoolData } from '../store/schoolSlice';

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
  const jobs = useAppSelector(state => state.schoolDashboard.jobs);
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

  const visibleJobs = jobs.filter(job => {
    const isActive = job.status === 'ACTIVE';
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' ? isActive : !isActive);
    const searchText = [job.title, job.subject || '', job.city || '']
      .join(' ')
      .toLowerCase();

    return matchesStatus && searchText.includes(search.trim().toLowerCase());
  });

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
    const dateError = jobDateError(
      form.startDate,
      form.endDate,
      form.expiresAt,
    );

    if (dateError) {
      setFormError(dateError);
      return;
    }

    setSaving(true);
    setFormError('');

    try {
      await createSchoolJob(form);
      dispatch(setSchoolData(await getSchoolDashboardData()));
      setForm(emptyForm);
      setPostingStep(0);
    } catch (problem) {
      setFormError(messageFromError(problem));
    }

    setSaving(false);
  }

  function openApplications(jobId: string) {
    dispatch(selectSchoolJob(jobId));
    dispatch(showPage('Applications'));
  }

  return {
    jobs: visibleJobs,
    selectedJobId,
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
