import { useInvitationTags } from '../../feature/dashboard/shared/hooks/useInvitationTags';
import React from 'react';
import { statusLabel } from '../../utils/ui/marketplaceLabels';
import { Text, View } from 'react-native';
import type { SchoolApplication } from '../../feature/dashboard/school/store/schoolSlice';
import Button from '../Ui/Button';
import { useApplicationStyles } from './applicationStyles';
import { useStyles } from './dashboardStyles';
import TeacherProfileSummary from './TeacherProfileSummary';

type Props = {
  applications: SchoolApplication[];
  onOpen: (id: string) => void;
};

export default function SchoolApplicationList({ applications, onOpen }: Props) {
  const invitations = useInvitationTags();
  const applicationStyles = useApplicationStyles();
  const styles = useStyles();

  if (!applications.length) {
    return (
      <View style={[styles.card, styles.emptyCard]}>
        <Text style={styles.cardTitle}>No applications found</Text>
        <Text style={[styles.cardBody, styles.centerText]}>
          New teacher applications will appear here.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      {invitations.error ? (
        <Text style={styles.cardBody}>{invitations.error}</Text>
      ) : null}
      {applications.map(application => (
        <View key={application.id} style={styles.card}>
          <View style={styles.sectionHead}>
            <Text style={styles.cardTitle}>Teacher application</Text>
            <View style={applicationStyles.status}>
              <Text style={applicationStyles.statusText}>
                {statusLabel(application.status)}
              </Text>
            </View>
          </View>

          <TeacherProfileSummary teacherId={application.instructorId} compact />
          <Text style={styles.teacherMeta}>{application.job.title}</Text>
          <Text style={styles.teacherMeta}>
            Received {application.createdAt?.slice(0, 10) || 'recently'}
          </Text>
          {invitations.items?.some(
            item =>
              item.job.id === application.jobId &&
              item.instructor.id === application.instructorId,
          ) ? (
            <Text style={styles.teacherMeta}>Invited</Text>
          ) : null}
          <Button
            compact
            title="Open application"
            onPress={() => onOpen(application.id)}
          />
        </View>
      ))}
    </View>
  );
}
