import React from 'react';
import { Text, View } from 'react-native';
import type { SchoolApplication } from '../../feature/dashboard/school/store/schoolSlice';
import Button from '../Ui/Button';
import { applicationStyles } from './applicationStyles';
import { styles } from './dashboardStyles';

type Props = {
  applications: SchoolApplication[];
  onOpen: (id: string) => void;
};

export default function SchoolApplicationList({ applications, onOpen }: Props) {
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

          <Text style={styles.teacherMeta}>{application.job.title}</Text>
          <Text numberOfLines={3} style={styles.cardBody}>
            {application.coverLetter || 'No cover letter added.'}
          </Text>
          <Text style={styles.teacherMeta}>
            Received {application.createdAt?.slice(0, 10) || 'recently'}
          </Text>
          <Button
            compact
            title="Review application"
            onPress={() => onOpen(application.id)}
          />
        </View>
      ))}
    </View>
  );
}
