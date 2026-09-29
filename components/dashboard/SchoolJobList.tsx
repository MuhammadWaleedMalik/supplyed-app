import { CalendarDays, FileText, MapPin } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';
import type { Job } from '../../feature/dashboard/shared/apis/jobsApi';
import Button from '../Ui/Button';
import { colors } from '../Ui/theme';
import { styles } from './dashboardStyles';
import { jobStyles } from './jobStyles';

type Props = {
  jobs: Job[];
  selectedId: string;
  onSelect: (id: string) => void;
};

export default function SchoolJobList({ jobs, selectedId, onSelect }: Props) {
  if (!jobs.length)
    return (
      <View style={[styles.card, styles.emptyCard]}>
        <Text style={styles.cardTitle}>No jobs found</Text>
        <Text style={[styles.cardBody, styles.centerText]}>
          Post a role or change the search and status filter.
        </Text>
      </View>
    );

  return (
    <View style={styles.section}>
      {jobs.map(job => {
        const count = job.applicationCount || 0;
        const applicationLabel =
          count === 1 ? '1 application' : count + ' applications';

        return (
          <View key={job.id} style={styles.card}>
            <View style={jobStyles.listHeader}>
              <Text style={styles.cardTitle}>{job.title}</Text>
              <View style={jobStyles.statusBadge}>
                <Text style={jobStyles.statusText}>
                  {job.status || 'DRAFT'}
                </Text>
              </View>
            </View>
            <Text style={styles.cardBody}>
              {job.subject || 'General teaching role'}
            </Text>
            <View style={styles.badges}>
              <Text style={styles.teacherMeta}>
                <MapPin color={colors.muted} size={13} />{' '}
                {job.city || 'Location pending'}
              </Text>
              <Text style={styles.teacherMeta}>
                <CalendarDays color={colors.muted} size={13} />{' '}
                {job.startDate?.slice(0, 10) || 'Flexible date'}
              </Text>
              <Text style={styles.teacherMeta}>
                <FileText color={colors.muted} size={13} /> {applicationLabel}
              </Text>
            </View>
            <Button
              compact
              variant={selectedId === job.id ? 'primary' : 'social'}
              title="Review applications"
              onPress={() => onSelect(job.id)}
            />
          </View>
        );
      })}
    </View>
  );
}
