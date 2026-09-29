import { CalendarDays, MapPin } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';
import type { TeacherApplication } from '../../feature/dashboard/teacher/store/teacherSlice';
import Button from '../Ui/Button';
import { colors } from '../Ui/theme';
import { applicationStyles } from './applicationStyles';
import { styles } from './dashboardStyles';

type Props = {
  applications: TeacherApplication[];
  onPoster: (id: string) => void;
};

export default function MyApplicationsList({ applications, onPoster }: Props) {
  if (!applications.length) {
    return (
      <View style={[styles.card, styles.emptyCard]}>
        <Text style={styles.cardTitle}>No applications found</Text>
        <Text style={[styles.cardBody, styles.centerText]}>
          Your submitted applications will appear here.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      {applications.map(application => {
        const job = application.job;

        return (
          <View key={application.id} style={styles.card}>
            <View style={styles.sectionHead}>
              <Text style={styles.cardTitle}>
                {job?.title || 'Application'}
              </Text>
              <View style={applicationStyles.status}>
                <Text style={applicationStyles.statusText}>
                  {application.status}
                </Text>
              </View>
            </View>

            <Text style={styles.cardBody}>
              {job?.subject || 'Teaching role'}
            </Text>

            <View style={applicationStyles.metaGrid}>
              <Text style={applicationStyles.meta}>
                <MapPin color={colors.muted} size={12} />{' '}
                {job?.city || 'Location pending'}
              </Text>
              <Text style={applicationStyles.meta}>
                <CalendarDays color={colors.muted} size={12} />{' '}
                {application.createdAt?.slice(0, 10) || 'Recently'}
              </Text>
            </View>

            <Text style={styles.cardBody}>
              {application.coverLetter || 'No cover letter added.'}
            </Text>

            {job?.postedByUserId ? (
              <Button
                compact
                variant="link"
                title="View school profile"
                onPress={() => onPoster(job.postedByUserId)}
              />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
