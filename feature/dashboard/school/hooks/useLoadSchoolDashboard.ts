import { useEffect } from 'react';
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
    async function loadDashboard() {
      dispatch(startSchoolLoading());

      try {
        dispatch(setSchoolData(await getSchoolDashboardData()));
      } catch (problem) {
        dispatch(setSchoolError(messageFromError(problem)));
      }
    }

    loadDashboard();
  }, [dispatch]);
}
