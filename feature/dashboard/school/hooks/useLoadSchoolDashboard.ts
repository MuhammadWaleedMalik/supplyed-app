import { useEffect } from 'react';
import { getSessionVersion } from '../../../../utils/api/session';
import { useAppDispatch } from '../../../../store/hooks';
import { getSchoolDashboardData } from '../apis/schoolDashboardApi';
import {
  setSchoolData,
  setSchoolError,
  startSchoolLoading,
} from '../store/schoolSlice';

function messageFromError(problem: unknown) {
  return problem instanceof Error
    ? problem.message
    : 'Unable to load the school dashboard.';
}

export function useLoadSchoolDashboard() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    let mounted = true;
    const version = getSessionVersion();
    const active = () => mounted && getSessionVersion() === version;
    async function loadDashboard() {
      dispatch(startSchoolLoading());

      try {
        const data = await getSchoolDashboardData();
        if (active()) dispatch(setSchoolData(data));
      } catch (problem) {
        if (active()) dispatch(setSchoolError(messageFromError(problem)));
      }
    }

    loadDashboard();
    return () => { mounted = false; };
  }, [dispatch]);
}
