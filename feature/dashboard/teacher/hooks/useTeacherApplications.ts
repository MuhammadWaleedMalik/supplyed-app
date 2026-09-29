import { useState } from 'react';
import { useAppSelector } from '../../../../store/hooks';

export function useTeacherApplications() {
  const applications = useAppSelector(
    state => state.teacherDashboard.applications,
  );
  const loading = useAppSelector(state => state.teacherDashboard.loading);
  const error = useAppSelector(state => state.teacherDashboard.error);

  const [status, setStatus] = useState('ALL');
  const [search, setSearch] = useState('');

  const visibleApplications = applications.filter(application => {
    const matchesStatus = status === 'ALL' || application.status === status;
    const searchText = [
      application.job?.title || '',
      application.job?.subject || '',
      application.status,
    ]
      .join(' ')
      .toLowerCase();

    return matchesStatus && searchText.includes(search.trim().toLowerCase());
  });

  return {
    applications: visibleApplications,
    loading,
    error,
    status,
    search,
    setStatus,
    setSearch,
  };
}
