import { useEffect, useRef, useState } from 'react';
import { getSessionVersion } from '../../../../utils/api/session';
import {
  getMyJobsByStatusesPage,
  HISTORY_JOB_STATUSES,
  type Job,
} from '../../shared/apis/jobsApi';

export function useSchoolJobHistory() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');
  const [refreshToken, setRefreshToken] = useState(0);
  const page = useRef(0);
  const request = useRef(0);
  const requestInFlight = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const requestId = ++request.current;
      const sessionVersion = getSessionVersion();
      requestInFlight.current = true;
      setLoading(true);
      setLoadingMore(false);
      setError('');

      getMyJobsByStatusesPage(1, HISTORY_JOB_STATUSES, { search, status })
        .then(result => {
          if (
            requestId !== request.current ||
            sessionVersion !== getSessionVersion()
          )
            return;
          setJobs(result.jobs);
          page.current = result.page;
          setHasMore(result.hasNextPage);
        })
        .catch(problem => {
          if (
            requestId === request.current &&
            sessionVersion === getSessionVersion()
          ) {
            setError(
              problem instanceof Error
                ? problem.message
                : 'Unable to load job history.',
            );
          }
        })
        .finally(() => {
          if (requestId === request.current) {
            requestInFlight.current = false;
            setLoading(false);
          }
        });
    }, search ? 300 : 0);

    return () => {
      clearTimeout(timer);
      request.current += 1;
      requestInFlight.current = false;
    };
  }, [refreshToken, search, status]);

  async function loadMore() {
    if (requestInFlight.current || !hasMore) return;
    requestInFlight.current = true;
    setLoadingMore(true);
    setError('');
    const requestId = request.current;
    const sessionVersion = getSessionVersion();

    try {
      const result = await getMyJobsByStatusesPage(
        page.current + 1,
        HISTORY_JOB_STATUSES,
        { search, status },
      );
      if (
        requestId !== request.current ||
        sessionVersion !== getSessionVersion()
      )
        return;
      setJobs(current => [
        ...current,
        ...result.jobs.filter(
          job => !current.some(existing => existing.id === job.id),
        ),
      ]);
      page.current = result.page;
      setHasMore(result.hasNextPage);
    } catch (problem) {
      if (
        requestId === request.current &&
        sessionVersion === getSessionVersion()
      ) {
        setError(
          problem instanceof Error
            ? problem.message
            : 'Unable to load more job history.',
        );
      }
    } finally {
      requestInFlight.current = false;
      if (requestId === request.current) setLoadingMore(false);
    }
  }

  return {
    jobs,
    search,
    status,
    loading,
    loadingMore,
    hasMore,
    error,
    setSearch,
    setStatus,
    loadMore,
    refresh: () => setRefreshToken(current => current + 1),
  };
}
