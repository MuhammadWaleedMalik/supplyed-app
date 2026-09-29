import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { openMessages } from '../../shared/store/navigationSlice';
import {
  getSchoolDashboardData,
  changeApplicationStatus,
} from '../apis/schoolDashboardApi';
import {
  clearSchoolApplicationSelection,
  clearSchoolJobSelection,
  selectSchoolApplication,
  setSchoolData,
  setSchoolError,
} from '../store/schoolSlice';

function messageFromError(problem: unknown) {
  return problem instanceof Error
    ? problem.message
    : 'Unable to update the application.';
}

export function useSchoolApplications() {
  const dispatch = useAppDispatch();
  const applications = useAppSelector(
    state => state.schoolDashboard.applications,
  );
  const selectedJobId = useAppSelector(
    state => state.schoolDashboard.selectedJobId,
  );
  const selectedApplicationId = useAppSelector(
    state => state.schoolDashboard.selectedApplicationId,
  );
  const loading = useAppSelector(state => state.schoolDashboard.loading);
  const error = useAppSelector(state => state.schoolDashboard.error);

  const [status, setStatus] = useState('ALL');
  const [search, setSearch] = useState('');

  const visibleApplications = applications.filter(application => {
    const matchesJob = !selectedJobId || application.jobId === selectedJobId;
    const matchesStatus = status === 'ALL' || application.status === status;
    const searchText = [
      application.job.title,
      application.coverLetter || '',
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
    application => application.id === selectedApplicationId,
  );

  async function updateStatus(id: string, nextStatus: string) {
    try {
      await changeApplicationStatus(id, nextStatus);
      dispatch(setSchoolData(await getSchoolDashboardData()));
    } catch (problem) {
      dispatch(setSchoolError(messageFromError(problem)));
    }
  }

  function showAllApplications() {
    dispatch(clearSchoolJobSelection());
  }

  function openApplication(id: string) {
    dispatch(selectSchoolApplication(id));
  }

  function closeApplication() {
    dispatch(clearSchoolApplicationSelection());
  }

  function messageTeacher(teacherId: string) {
    dispatch(openMessages(teacherId));
  }

  return {
    applications: visibleApplications,
    selectedApplication,
    selectedJobId,
    loading,
    error,
    status,
    search,
    setStatus,
    setSearch,
    updateStatus,
    showAllApplications,
    openApplication,
    closeApplication,
    messageTeacher,
  };
}
