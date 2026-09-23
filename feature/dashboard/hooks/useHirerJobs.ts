import { useEffect, useState } from 'react';
import { createJob, getMyJobs, Job, JobForm } from '../apis/jobsApi';

const emptyForm: JobForm = {
  title: '',
  description: '',
  subject: '',
  city: '',
  startDate: '',
  endDate: '',
  payAmount: '',
  status: 'DRAFT',
};

export function useHirerJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [form, setForm] = useState<JobForm>(emptyForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadJobs() {
    try {
      setJobs(await getMyJobs());
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Unable to load jobs.');
    }
  }

  function change(name: keyof JobForm, value: string) {
    setForm(current => ({ ...current, [name]: value }));
  }

  async function saveJob() {
    if (!form.title.trim()) {
      setError('Enter a job title.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await createJob(form);
      setForm(emptyForm);
      await loadJobs();
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Unable to save job.');
    }
    setLoading(false);
  }

  useEffect(() => { loadJobs(); }, []);

  return { jobs, form, error, loading, change, saveJob, loadJobs };
}
