import React from 'react';
import { Text, View } from 'react-native';
import type { Job } from '../../feature/dashboard/shared/apis/jobsApi';
import Button from '../Ui/Button';
import { styles } from './dashboardStyles';

type Props = {
  jobs: Job[];
  onJobs: () => void;
  onApplications: () => void;
};

export default function SchoolOverview({
  jobs,
  onJobs,
  onApplications,
}: Props) {
  const activeJobs = jobs.filter(job => job.status === 'ACTIVE').length;
  const draftJobs = jobs.filter(job => job.status === 'DRAFT').length;

  let applicationTotal = 0;
  for (const job of jobs) {
    applicationTotal += job.applicationCount || 0;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.title}>School dashboard</Text>
      <Text style={styles.subtitle}>
        Your posted jobs and the applications received for them.
      </Text>

      <View style={styles.metricGrid}>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{activeJobs}</Text>
          <Text style={styles.metricLabel}>ACTIVE JOBS</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{jobs.length}</Text>
          <Text style={styles.metricLabel}>MY POSTED JOBS</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{applicationTotal}</Text>
          <Text style={styles.metricLabel}>APPLICATIONS RECEIVED</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{draftJobs}</Text>
          <Text style={styles.metricLabel}>DRAFTS</Text>
        </View>
      </View>

      <Text style={styles.cardTitle}>Quick actions</Text>
      <View style={styles.quickButtons}>
        <Button title="Manage jobs" onPress={onJobs} />
        <Button
          title="Review applications"
          variant="social"
          onPress={onApplications}
        />
      </View>

      {jobs.slice(0, 3).map(job => (
        <View key={job.id} style={styles.card}>
          <Text style={styles.cardTitle}>{job.title}</Text>
          <Text style={styles.cardBody}>
            {job.subject || 'General'} | {job.city || 'Location pending'} |{' '}
            {job.applicationCount || 0} applications
          </Text>
        </View>
      ))}
    </View>
  );
}
