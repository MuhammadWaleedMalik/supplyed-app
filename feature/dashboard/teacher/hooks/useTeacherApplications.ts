import { useEffect, useMemo, useState } from 'react';
import { useSessionState } from '../../../../utils/ui/useSessionState';
import { useAppSelector } from '../../../../store/hooks';
import {
  getApplication,
  getApplicationsPage,
  Application,
} from '../../shared/apis/applicationsApi';
import { usePagedResource } from '../../shared/hooks/usePagedResource';
import {
  createMergedPager,
  newestFirst,
} from '../../../../utils/api/mergedPager';
import { getSessionVersion } from '../../../../utils/api/session';
import { richTextToPlainText } from '../../../../utils/ui/richText';
import type { TeacherApplication } from '../store/teacherSlice';
import type { Job } from '../../shared/apis/jobsApi';

export function applicationWithJob(
  application: Application,
): TeacherApplication {
  return {
    ...application,
    job: application.jobDetails
      ? ({
          ...application.jobDetails,
          id: application.jobId,
          title:
            application.jobName ||
            application.jobDetails.title ||
            'Teaching role',
          postedByUserId: '',
        } as Job)
      : undefined,
  };
}
export function useTeacherApplications() {
  const applicationId = useAppSelector(
    state => state.dashboardNavigation.notificationApplicationId,
  );
  const jobId = useAppSelector(
    state => state.dashboardNavigation.notificationApplicationJobId,
  );
  const revision = useAppSelector(
    state => state.dashboardNavigation.dataRevision,
  );
  const [status, setStatus] = useSessionState(
    'teacher.applications.status.v2',
    'APPLIED',
  );
  const [search, setSearch] = useSessionState(
    'teacher.applications.search',
    '',
  );
  const [linked, setLinked] = useState<TeacherApplication>();
  const [linkError, setLinkError] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);
  const [query, setQuery] = useState(search);
  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim().toLowerCase()), 300);
    return () => clearTimeout(timer);
  }, [search]);
  const loader = useMemo(
    () =>
      createMergedPager(
        [
          async (page: number) => {
            const result = await getApplicationsPage(page, jobId ? '' : status);
            return { ...result, items: result.items.map(applicationWithJob) };
          },
        ],
        newestFirst,
        item =>
          (!jobId || item.jobId === jobId) &&
          (!query ||
            [
              item.jobName,
              item.job?.title,
              item.status,
              richTextToPlainText(item.coverLetter),
            ]
              .join(' ')
              .toLowerCase()
              .includes(query)),
      ),
    [status, query, jobId],
  );
  const pages = usePagedResource(loader, !applicationId, String(revision));
  useEffect(() => {
    let active = true;
    const version = getSessionVersion();
    setLinked(undefined);
    setLinkError('');
    setLinkLoading(!!applicationId);
    if (applicationId)
      getApplication(applicationId)
        .then(item => {
          if (active && version === getSessionVersion())
            setLinked(applicationWithJob(item));
        })
        .catch(problem => {
          if (active)
            setLinkError(problem.message || 'Unable to load application.');
        })
        .finally(() => {
          if (active) setLinkLoading(false);
        });
    return () => {
      active = false;
    };
  }, [applicationId, revision]);
  return {
    ...pages,
    applications: applicationId ? (linked ? [linked] : []) : pages.items,
    loading: pages.loading || linkLoading,
    error: linkError || pages.error,
    status,
    search,
    setStatus,
    setSearch,
    hasMore: !applicationId && pages.hasMore,
  };
}
