import React from 'react';
import { Text, View } from 'react-native';
import type { Job } from '../../feature/dashboard/shared/apis/jobsApi';
import type { TeacherApplication } from '../../feature/dashboard/teacher/store/teacherSlice';
import Button from '../Ui/Button';
import { styles } from './dashboardStyles';

type Props = {
  jobs: Job[];
  applications: TeacherApplication[];
  onJobs: () => void;
  onApplications: () => void;
};

export default function TeacherOverview({
  jobs,
  applications,
  onJobs,
  onApplications,
}: Props) {
  const interviews = applications.filter(
    application => application.status === 'INTERVIEW',
  ).length;
  const applicationsInProgress = applications.filter(
    application => !['REJECTED', 'HIRED'].includes(application.status),
  ).length;

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Teacher dashboard</Text>
      <Text style={styles.subtitle}>
        Browse all posted jobs and track only your applications.
      </Text>

      <View style={styles.metricGrid}>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{jobs.length}</Text>
          <Text style={styles.metricLabel}>AVAILABLE JOBS</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{applications.length}</Text>
          <Text style={styles.metricLabel}>MY APPLICATIONS</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{applicationsInProgress}</Text>
          <Text style={styles.metricLabel}>IN PROGRESS</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{interviews}</Text>
          <Text style={styles.metricLabel}>INTERVIEWS</Text>
        </View>
      </View>

      <Text style={styles.cardTitle}>Quick actions</Text>
      <View style={styles.quickButtons}>
        <Button title="Browse jobs" onPress={onJobs} />
        <Button
          title="View my applications"
          variant="social"
          onPress={onApplications}
        />
      </View>

      {jobs.slice(0, 3).map(job => (
        <View key={job.id} style={styles.card}>
          <Text style={styles.cardTitle}>{job.title}</Text>
          <Text style={styles.cardBody}>
            {job.subject || 'General'} | {job.city || 'Flexible'} |{' '}
            {job.status || 'OPEN'}
          </Text>
        </View>
      ))}
    </View>
  );
}
