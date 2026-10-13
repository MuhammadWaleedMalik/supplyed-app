import { CalendarDays, MapPin } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';
import type { TeacherApplication } from '../../feature/dashboard/teacher/store/teacherSlice';
import Button from '../Ui/Button';
import RichText from '../Ui/RichText';
import { useTheme } from '../Ui/theme';
import { useApplicationStyles } from './applicationStyles';
import { useStyles } from './dashboardStyles';
import { useAppDispatch } from '../../store/hooks';
import { openMessages } from '../../feature/dashboard/shared/store/navigationSlice';

type Props = {
  applications: TeacherApplication[];
  onSchool: (applicationId: string) => void;
};

export default function MyApplicationsList({ applications, onSchool }: Props) {
  const { colors } = useTheme();
  const applicationStyles = useApplicationStyles();
  const styles = useStyles();

  const dispatch = useAppDispatch();
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
                {job?.title || application.jobName || 'Application'}
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

            <RichText value={application.coverLetter} style={styles.cardBody} />

            <Button
              title="Message school"
              variant="social"
              onPress={() => dispatch(openMessages(application.id))}
            />
            <Button
              compact
              variant="link"
              title="View school profile"
              onPress={() => onSchool(application.id)}
            />
          </View>
        );
      })}
    </View>
  );
}
