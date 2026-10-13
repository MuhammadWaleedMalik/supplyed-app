import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { getTeacherApplications } from '../apis/teacherDashboardApi';
import { setTeacherApplications, setTeacherError } from '../store/teacherSlice';
import { getSessionVersion } from '../../../../utils/api/session';

export function useTeacherApplications() {
  const dispatch = useAppDispatch();
  const applications = useAppSelector(
    state => state.teacherDashboard.applications,
  );
  const loading = useAppSelector(state => state.teacherDashboard.loading);
  const error = useAppSelector(state => state.teacherDashboard.error);
  const applicationId = useAppSelector(state => state.dashboardNavigation.notificationApplicationId);
  const jobId = useAppSelector(state => state.dashboardNavigation.notificationApplicationJobId);
  const [refreshing, setRefreshing] = useState(false);

  const [status, setStatus] = useState('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setRefreshing(false);
    if (!applicationId && !jobId) return;
    let active = true;
    const version = getSessionVersion();
    setRefreshing(true);
    getTeacherApplications()
      .then(items => {
        if (!active || version !== getSessionVersion()) return;
        dispatch(setTeacherApplications(items));
        if (applicationId && !items.some(item => item.id === applicationId))
          dispatch(setTeacherError('This application is unavailable.'));
      })
      .catch(problem => {
        if (active && version === getSessionVersion())
          dispatch(setTeacherError(problem instanceof Error ? problem.message : 'Unable to load applications.'));
      })
      .finally(() => { if (active) setRefreshing(false); });
    return () => { active = false; };
  }, [applicationId, dispatch, jobId]);

  const visibleApplications = applications.filter(application => {
    const matchesStatus = status === 'ALL' || application.status === status;
    const searchText = [
      application.job?.title || application.jobName || '',
      application.job?.subject || '',
      application.status,
    ]
      .join(' ')
      .toLowerCase();

    return (!applicationId || application.id === applicationId) &&
      (!jobId || application.jobId === jobId) &&
      matchesStatus && searchText.includes(search.trim().toLowerCase());
  });

  return {
    applications: visibleApplications,
    loading: loading || refreshing,
    error,
    status,
    search,
    setStatus,
    setSearch,
  };
}
