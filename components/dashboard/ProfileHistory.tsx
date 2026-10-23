import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import {
  Application,
  getMyApplications,
} from '../../feature/dashboard/shared/apis/applicationsApi';
import {
  Booking,
  getMyBookings,
} from '../../feature/dashboard/shared/apis/bookingsApi';
import { useStyles } from './dashboardStyles';
import { getSchoolDashboardData } from '../../feature/dashboard/school/apis/schoolDashboardApi';
import { displayDate, statusLabel } from '../../utils/ui/marketplaceLabels';
import RichText from '../Ui/RichText';
import Button from '../Ui/Button';
import ReviewHistory from './ReviewHistory';
import ApplicationTimeline from './ApplicationTimeline';

export default function ProfileHistory({
  role,
  profileId,
}: {
  role: 'school' | 'teacher';
  profileId: string;
}) {
  const styles = useStyles();
  const [applications, setApplications] = useState<Application[]>();
  const [bookings, setBookings] = useState<Booking[]>();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setErrors({});
    getMyBookings()
      .then(result => {
        if (active) setBookings(result);
      })
      .catch(error => {
        if (active)
          setErrors(current => ({ ...current, bookings: error.message }));
      });
    const history =
      role === 'teacher'
        ? getMyApplications()
        : getSchoolDashboardData().then(data =>
            data.applications.map(application => ({
              ...application,
              jobName: application.jobName || application.job.title,
            })),
          );
    history
      .then(result => {
        if (active) setApplications(result);
      })
      .catch(error => {
        if (active)
          setErrors(current => ({ ...current, applications: error.message }));
      });
    return () => {
      active = false;
    };
  }, [role, attempt]);
  return (
    <View style={styles.section}>
      <Text style={styles.cardTitle}>My history</Text>
      <Button
        title="Refresh history"
        variant="link"
        onPress={() => setAttempt(value => value + 1)}
      />
      {Object.entries(errors).map(([section, error]) => (
        <Text key={section} accessibilityRole="alert" style={styles.cardBody}>
          {section}: {error}
        </Text>
      ))}
      {applications ? (
        <>
          <Text style={styles.cardTitle}>
            {role === 'teacher' ? 'Applications' : 'Applications received'}
          </Text>
          {applications?.map(application => (
            <View key={application.id} style={styles.card}>
              <Text style={styles.cardTitle}>
                {application.jobName || 'Job title unavailable'}
              </Text>
              <Text style={styles.cardBody}>
                {statusLabel(application.status)} ·{' '}
                {displayDate(application.createdAt)}
              </Text>
              <RichText value={application.coverLetter} />
              <ApplicationTimeline applicationId={application.id} />
            </View>
          ))}
        </>
      ) : null}
      <Text style={styles.cardTitle}>Booking history and reviews given</Text>
      {bookings?.map(booking => (
        <View style={styles.card} key={booking.id}>
          <Text style={styles.cardTitle}>{booking.job.title}</Text>
          <Text style={styles.cardBody}>
            {statusLabel(booking.status)} · {displayDate(booking.startDate)}
          </Text>
          {booking.reviews
            ?.filter(
              review =>
                review.reviewerType ===
                (role === 'teacher' ? 'INSTRUCTOR' : 'INSTITUTION'),
            )
            .map(review => (
              <Text key={review.id} style={styles.cardBody}>
                Your review: {review.rating}/5 ·{' '}
                {review.comment || 'No comment'}
              </Text>
            ))}
        </View>
      ))}
      <Text style={styles.cardTitle}>Reviews received</Text>
      <ReviewHistory
        type={role === 'teacher' ? 'instructor' : 'institution'}
        id={profileId}
      />
    </View>
  );
}
