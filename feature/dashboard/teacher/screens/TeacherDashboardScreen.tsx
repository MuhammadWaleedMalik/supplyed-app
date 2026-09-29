import React from 'react';
import { Text } from 'react-native';
import TeacherOverview from '../../../../components/dashboard/TeacherOverview';
import { styles } from '../../../../components/dashboard/dashboardStyles';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { showPage } from '../../shared/store/navigationSlice';

export default function TeacherDashboardScreen() {
  const dispatch = useAppDispatch();
  const jobs = useAppSelector(state => state.teacherDashboard.jobs);
  const applications = useAppSelector(
    state => state.teacherDashboard.applications,
  );
  const loading = useAppSelector(state => state.teacherDashboard.loading);
  const error = useAppSelector(state => state.teacherDashboard.error);

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
      <TeacherOverview
        jobs={jobs}
        applications={applications}
        onJobs={openJobs}
        onApplications={openApplications}
      />
      {error ? <Text style={styles.cardBody}>{error}</Text> : null}
    </>
  );
}
