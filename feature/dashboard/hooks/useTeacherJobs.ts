import { useEffect, useState } from 'react';
import { getRecommendedJobs, Job } from '../apis/jobsApi';

type RecommendedJob = { job: Job; match?: { score?: number } };

export function useTeacherJobs() {
  const [jobs, setJobs] = useState<RecommendedJob[]>([]);
  const [error, setError] = useState('');

  async function loadJobs() {
    try {
      setJobs(await getRecommendedJobs());
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Unable to load jobs.');
    }
  }

  useEffect(() => { loadJobs(); }, []);

  return { jobs, error, loadJobs };
}
