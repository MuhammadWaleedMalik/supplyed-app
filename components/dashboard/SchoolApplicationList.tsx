import React from 'react';
import { Text, View } from 'react-native';
import type { SchoolApplication } from '../../feature/dashboard/school/store/schoolSlice';
import Button from '../Ui/Button';
import RichText from '../Ui/RichText';
import { useApplicationStyles } from './applicationStyles';
import { useStyles } from './dashboardStyles';
import TeacherProfileSummary from './TeacherProfileSummary';

type Props = {
  applications: SchoolApplication[];
  onOpen: (id: string) => void;
};

export default function SchoolApplicationList({ applications, onOpen }: Props) {
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
      {applications.map(application => (
        <View key={application.id} style={styles.card}>
          <View style={styles.sectionHead}>
            <Text style={styles.cardTitle}>Teacher application</Text>
            <View style={applicationStyles.status}>
              <Text style={applicationStyles.statusText}>
                {application.status}
              </Text>
            </View>
          </View>

          <TeacherProfileSummary teacherId={application.instructorId} compact />
          <Text style={styles.teacherMeta}>{application.job.title}</Text>
          <RichText
            value={application.coverLetter}
            numberOfLines={3}
            style={styles.cardBody}
          />
          <Text style={styles.teacherMeta}>
            Received {application.createdAt?.slice(0, 10) || 'recently'}
          </Text>
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
