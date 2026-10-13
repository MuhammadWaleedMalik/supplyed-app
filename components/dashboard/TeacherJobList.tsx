import { CalendarDays, MapPin } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';
import type { Job } from '../../feature/dashboard/shared/apis/jobsApi';
import Button from '../Ui/Button';
import { useTheme } from '../Ui/theme';
import { useApplicationStyles } from './applicationStyles';
import { useStyles } from './dashboardStyles';

type Props = {
  jobs: Job[];
  appliedJobIds: string[];
  onApply: (job: Job) => void;
};

export default function TeacherJobList({
  jobs,
  appliedJobIds,
  onApply,
}: Props) {
  const { colors } = useTheme();
  const applicationStyles = useApplicationStyles();
  const styles = useStyles();

  if (!jobs.length) {
    return (
      <View style={[styles.card, styles.emptyCard]}>
        <Text style={styles.cardTitle}>No jobs found</Text>
        <Text style={[styles.cardBody, styles.centerText]}>
          Try changing the subject or key-stage filters.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      {jobs.map(job => {
        const alreadyApplied = appliedJobIds.includes(job.id);
        const unavailable = Boolean(job.status && job.status !== 'ACTIVE');

        return (
          <View key={job.id} style={styles.card}>
            <View style={styles.sectionHead}>
              <Text style={styles.cardTitle}>{job.title}</Text>
              <View style={applicationStyles.status}>
                <Text style={applicationStyles.statusText}>
                  {job.status || 'OPEN'}
                </Text>
              </View>
            </View>

            <Text style={styles.cardBody}>
              {job.description || 'No role description added.'}
            </Text>

            <View style={applicationStyles.metaGrid}>
              <Text style={applicationStyles.meta}>
                {job.subject || 'General'}
              </Text>
              <Text style={applicationStyles.meta}>
                <MapPin color={colors.muted} size={12} />{' '}
                {job.city || 'Flexible'}
              </Text>
              <Text style={applicationStyles.meta}>
                <CalendarDays color={colors.muted} size={12} />{' '}
                {job.startDate?.slice(0, 10) || 'Flexible'}
              </Text>
            </View>

            <Button
              compact
              title={
                alreadyApplied
                  ? 'Already applied'
                  : unavailable
                  ? 'Job unavailable'
                  : 'Apply for this role'
              }
              disabled={alreadyApplied || unavailable}
              onPress={() => onApply(job)}
            />
          </View>
        );
      })}
    </View>
  );
}
