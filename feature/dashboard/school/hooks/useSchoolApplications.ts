import { useSessionState } from '../../../../utils/ui/useSessionState';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getSessionVersion } from '../../../../utils/api/session';
import { richTextToPlainText } from '../../../../utils/ui/richText';
import {
  createMergedPager,
  newestFirst,
} from '../../../../utils/api/mergedPager';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
  openMessages,
  refreshMarketplace,
} from '../../shared/store/navigationSlice';
import {
  getApplication,
  getApplicationsPage,
  updateApplicationStatus,
  Application,
} from '../../shared/apis/applicationsApi';
import { getMyJobs, getMyJob, Job } from '../../shared/apis/jobsApi';
import { usePagedResource } from '../../shared/hooks/usePagedResource';
import {
  SchoolApplication,
  upsertSchoolApplication,
  upsertSchoolJob,
  clearSchoolApplicationSelection,
  selectSchoolApplication,
} from '../store/schoolSlice';

export function useSchoolApplications(jobId = '') {
  const dispatch = useAppDispatch();
  const saved = useAppSelector(state => state.schoolDashboard.applications);
  const selectedId = useAppSelector(
    state => state.schoolDashboard.selectedApplicationId,
  );
  const linkedId = useAppSelector(
    state => state.dashboardNavigation.notificationApplicationId,
  );
  const revision = useAppSelector(
    state => state.dashboardNavigation.dataRevision,
  );
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsReady, setJobsReady] = useState(false);
  const [detail, setDetail] = useState<SchoolApplication>();
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [detailLoading, setDetailLoading] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useSessionState(
    'school.applications.status.v2',
    'APPLIED',
  );
  const [search, setSearch] = useSessionState('school.applications.search', '');
  const [query, setQuery] = useState(search);
  const [busy, setBusy] = useState(false);
  const updating = useRef(false);
  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim().toLowerCase()), 300);
    return () => clearTimeout(timer);
  }, [search]);
  useEffect(() => {
    let active = true;
    const version = getSessionVersion();
    setJobsReady(false);
    setError('');
    getMyJobs()
      .then(items => {
        if (!active || version !== getSessionVersion()) return;
        setJobs(items);
        setJobsReady(true);
        items.forEach(job => dispatch(upsertSchoolJob(job)));
      })
      .catch(problem => {
        if (active) setError(problem.message || 'Unable to load jobs.');
      });
    return () => {
      active = false;
    };
  }, [dispatch, attempt]);
  const loader = useMemo(
    () =>
      createMergedPager(
        jobs
          .filter(job => !jobId || job.id === jobId)
          .map(job => async (page: number) => {
            const result = await getApplicationsPage(page, status, job.id);
            return {
              ...result,
              items: result.items.map(item => ({ ...item, job })),
            };
          }),
        newestFirst,
        item =>
          !query ||
          [item.job.title, item.status, richTextToPlainText(item.coverLetter)]
            .join(' ')
            .toLowerCase()
            .includes(query),
      ),
    [jobs, status, query, jobId],
  );
  const pages = usePagedResource(loader, jobsReady, String(revision));
  useEffect(() => {
    if (linkedId) dispatch(selectSchoolApplication(linkedId));
  }, [linkedId, dispatch]);
  useEffect(() => {
    let active = true;
    const version = getSessionVersion();
    setDetail(undefined);
    setError('');
    if (!selectedId) {
      setDetailLoading(false);
      return;
    }
    setDetailLoading(true);
    getApplication(selectedId)
      .then(async (item: Application) => {
        const job = await getMyJob(item.jobId);
        if (active && version === getSessionVersion())
          setDetail({ ...item, job });
      })
      .catch(problem => {
        if (active)
          setError(problem.message || 'Unable to open this application.');
      })
      .finally(() => {
        if (active) setDetailLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedId, revision, attempt]);
  async function updateStatus(id: string, nextStatus: string) {
    if (updating.current) return false;
    updating.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    const version = getSessionVersion();
    try {
      const updated = await updateApplicationStatus(id, nextStatus);
      if (version !== getSessionVersion()) return false;
      setDetail(current =>
        current?.id === id ? { ...current, ...updated } : current,
      );
      if (detail?.id === id)
        dispatch(upsertSchoolApplication({ ...detail, ...updated }));
      setNotice(
        nextStatus === 'HIRED'
          ? 'Teacher hired. The confirmed booking is ready in Bookings.'
          : 'Application status updated.',
      );
      dispatch(refreshMarketplace());
      return true;
    } catch (problem) {
      const message =
        problem instanceof Error
          ? problem.message
          : 'Unable to update the application.';
      if (version === getSessionVersion()) {
        setError(message);
        setAttempt(value => value + 1);
      }
      throw new Error(message);
    } finally {
      updating.current = false;
      setBusy(false);
    }
  }
  const selectedApplication =
    detail ||
    pages.items.find(item => item.id === selectedId) ||
    saved.find(item => item.id === selectedId);
  return {
    ...pages,
    jobs,
    applications: pages.items,
    selectedApplication,
    detailLoading,
    selectedId,
    loading: pages.loading || (!jobsReady && !error),
    busy,
    error: error || pages.error,
    notice,
    status,
    search,
    setStatus,
    setSearch,
    updateStatus,
    refresh: () => {
      setAttempt(value => value + 1);
      pages.refresh();
    },
    openApplication: (id: string) => dispatch(selectSchoolApplication(id)),
    closeApplication: () => {
      dispatch(clearSchoolApplicationSelection());
    },
    messageTeacher: (id: string) => dispatch(openMessages(id)),
  };
}
