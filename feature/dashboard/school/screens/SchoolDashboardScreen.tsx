import React from 'react';
import { Text } from 'react-native';
import SchoolOverview from '../../../../components/dashboard/SchoolOverview';
import { styles } from '../../../../components/dashboard/dashboardStyles';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { showPage } from '../../shared/store/navigationSlice';

export default function SchoolDashboardScreen() {
  const dispatch = useAppDispatch();
  const jobs = useAppSelector(state => state.schoolDashboard.jobs);
  const loading = useAppSelector(state => state.schoolDashboard.loading);
  const error = useAppSelector(state => state.schoolDashboard.error);

  if (loading && !jobs.length) {
    return <Text style={styles.cardBody}>Loading dashboard...</Text>;
  }

  function openJobs() {
    dispatch(showPage('Jobs'));
  }

  function openApplications() {
    dispatch(showPage('Applications'));
  }

  return (
    <>
      <SchoolOverview
        jobs={jobs}
        onJobs={openJobs}
        onApplications={openApplications}
      />
      {error ? <Text style={styles.cardBody}>{error}</Text> : null}
    </>
  );
}
