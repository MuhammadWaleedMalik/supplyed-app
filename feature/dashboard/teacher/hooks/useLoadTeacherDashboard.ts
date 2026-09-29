import { useEffect } from 'react';
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
    async function loadDashboard() {
      dispatch(startTeacherLoading());

      try {
        dispatch(setTeacherData(await getTeacherDashboardData()));
      } catch (problem) {
        dispatch(setTeacherError(messageFromError(problem)));
      }
    }

    loadDashboard();
  }, [dispatch]);
}
