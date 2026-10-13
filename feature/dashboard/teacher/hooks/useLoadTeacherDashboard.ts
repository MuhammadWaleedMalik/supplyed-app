import { useEffect } from 'react';
import { getSessionVersion } from '../../../../utils/api/session';
import { useAppDispatch } from '../../../../store/hooks';
import { getTeacherDashboardData } from '../apis/teacherDashboardApi';
import {
  setTeacherData,
  setTeacherError,
  startTeacherLoading,
} from '../store/teacherSlice';

function messageFromError(problem: unknown) {
  return problem instanceof Error
    ? problem.message
    : 'Unable to load the teacher dashboard.';
}

export function useLoadTeacherDashboard() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    let mounted = true;
    const version = getSessionVersion();
    const active = () => mounted && getSessionVersion() === version;
    async function loadDashboard() {
      dispatch(startTeacherLoading());

      try {
        const data = await getTeacherDashboardData();
        if (active()) dispatch(setTeacherData(data));
      } catch (problem) {
        if (active()) dispatch(setTeacherError(messageFromError(problem)));
      }
    }

    loadDashboard();
    return () => { mounted = false; };
  }, [dispatch]);
}
