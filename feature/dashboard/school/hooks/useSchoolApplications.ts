import { useEffect, useRef, useState } from 'react';
import { getSessionVersion } from '../../../../utils/api/session';
import { richTextToPlainText } from '../../../../utils/ui/richText';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { openMessages } from '../../shared/store/navigationSlice';
import {
  getSchoolDashboardData,
  changeApplicationStatus,
} from '../apis/schoolDashboardApi';
import {
  clearSchoolApplicationSelection,
  selectSchoolApplication,
  setSchoolData,
  setSchoolError,
} from '../store/schoolSlice';

function messageFromError(problem: unknown) {
  return problem instanceof Error
    ? problem.message
    : 'Unable to update the application.';
}

export function useSchoolApplications(jobId = '') {
  const dispatch = useAppDispatch();
  const applications = useAppSelector(
    state => state.schoolDashboard.applications,
  );
  const selectedApplicationId = useAppSelector(
    state => state.schoolDashboard.selectedApplicationId,
  );
  const loading = useAppSelector(state => state.schoolDashboard.loading);
  const error = useAppSelector(state => state.schoolDashboard.error);
  const notificationApplicationId = useAppSelector(state => state.dashboardNavigation.notificationApplicationId);
  const notificationJobId = useAppSelector(state => state.dashboardNavigation.notificationApplicationJobId);
  const [refreshing, setRefreshing] = useState(false);

  const [status, setStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const updating = useRef(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setRefreshing(false);
    if (!notificationApplicationId && !notificationJobId) return;
    let active = true;
    const version = getSessionVersion();
    dispatch(clearSchoolApplicationSelection());
    setRefreshing(true);
    getSchoolDashboardData()
      .then(data => {
        if (!active || version !== getSessionVersion()) return;
        dispatch(setSchoolData(data));
        if (!notificationApplicationId) return;
        const found = data.applications.some(item => item.id === notificationApplicationId &&
          (!notificationJobId || item.jobId === notificationJobId));
        if (found) dispatch(selectSchoolApplication(notificationApplicationId));
        else dispatch(setSchoolError('This application is unavailable.'));
      })
      .catch(problem => {
        if (active && version === getSessionVersion())
          dispatch(setSchoolError(messageFromError(problem)));
      })
      .finally(() => { if (active) setRefreshing(false); });
    return () => { active = false; };
  }, [dispatch, notificationApplicationId, notificationJobId]);

  const visibleApplications = applications.filter(application => {
    const matchesJob = !jobId || application.jobId === jobId;
    const matchesStatus = status === 'ALL' || application.status === status;
    const searchText = [
      application.job.title,
      richTextToPlainText(application.coverLetter).replace(/\s+/g, ' '),
      application.status,
    ]
      .join(' ')
      .toLowerCase();

    return (
      matchesJob &&
      matchesStatus &&
      searchText.includes(search.trim().toLowerCase())
    );
  });

  const selectedApplication = applications.find(
    application =>
      application.id === selectedApplicationId &&
      (!jobId || application.jobId === jobId),
  );

  async function updateStatus(id: string, nextStatus: string) {
    if (updating.current) return;
    updating.current = true;
    setBusy(true);
    const version = getSessionVersion();
    try {
      await changeApplicationStatus(id, nextStatus);
      if (getSessionVersion() !== version) return;
      const data = await getSchoolDashboardData();
      if (getSessionVersion() === version) dispatch(setSchoolData(data));
    } catch (problem) {
      if (getSessionVersion() === version) dispatch(setSchoolError(messageFromError(problem)));
    } finally {
      updating.current = false;
      setBusy(false);
    }
  }

  function openApplication(id: string) {
    dispatch(selectSchoolApplication(id));
  }

  function closeApplication() {
    dispatch(clearSchoolApplicationSelection());
  }

  function messageTeacher(applicationId: string) {
    dispatch(openMessages(applicationId));
  }

  return {
    applications: visibleApplications,
    selectedApplication,
    loading: loading || busy || refreshing,
    error,
    status,
    search,
    setStatus,
    setSearch,
    updateStatus,
    openApplication,
    closeApplication,
    messageTeacher,
  };
}
