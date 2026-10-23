import { plannedLabel } from '../../utils/jobs/workSchedule';
import { useInvitationTags } from '../../feature/dashboard/shared/hooks/useInvitationTags';
import { CalendarDays, FileText, MapPin } from 'lucide-react-native';
import { listingStatus } from '../../utils/jobs/londonTime';
import React from 'react';
import { Text, View } from 'react-native';
import type { Job } from '../../feature/dashboard/shared/apis/jobsApi';
import Button from '../Ui/Button';
import { useTheme } from '../Ui/theme';
import { useStyles } from './dashboardStyles';
import { useJobStyles } from './jobStyles';

type Props = {
  jobs: Job[];
  onSelect: (id: string) => void;
};

export default function SchoolJobList({ jobs, onSelect }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const invitations = useInvitationTags();
  const jobStyles = useJobStyles();

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
      {invitations.error ? (
        <Text style={styles.cardBody}>{invitations.error}</Text>
      ) : null}
      {jobs.map(job => {
        const count = job.applicationCount;
        const applicationLabel =
          count == null
            ? 'Applicant count unavailable'
            : count === 1
            ? '1 application'
            : count + ' applications';

        return (
          <View key={job.id} style={styles.card}>
            <View style={jobStyles.listHeader}>
              <Text style={styles.cardTitle}>{job.title}</Text>
              <View style={jobStyles.statusBadge}>
                <Text style={jobStyles.statusText}>{listingStatus(job)}</Text>
              </View>
            </View>
            <Text style={styles.cardBody}>
              {job.subjects?.join(', ') ||
                job.subject ||
                'General teaching role'}
            </Text>
            {job.payType !== 'fixed' ? (
              <Text style={styles.cardBody}>{plannedLabel(job)}</Text>
            ) : null}
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
            {invitations.items ? (
              <Text style={styles.teacherMeta}>
                {
                  invitations.items.filter(item => item.job.id === job.id)
                    .length
                }{' '}
                invitations
              </Text>
            ) : null}
            <Button
              compact
              variant="social"
              title="View job & applicants"
              onPress={() => onSelect(job.id)}
            />
          </View>
        );
      })}
    </View>
  );
}
