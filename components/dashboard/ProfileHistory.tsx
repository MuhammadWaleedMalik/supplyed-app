import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { CalendarDays, ClipboardList, History, Star } from 'lucide-react-native';
import {
  Application,
  getMyApplications,
} from '../../feature/dashboard/shared/apis/applicationsApi';
import {
  Booking,
  getMyBookings,
} from '../../feature/dashboard/shared/apis/bookingsApi';
import { getSchoolDashboardData } from '../../feature/dashboard/school/apis/schoolDashboardApi';
import { displayDate } from '../../utils/ui/marketplaceLabels';
import Button from '../Ui/Button';
import { StatusBadge } from '../Ui/RecordLayout';
import ReviewHistory from './ReviewHistory';
import SettingsCardHeader from './SettingsCardHeader';
import { useSettingsStyles } from './settingsStyles';

export default function ProfileHistory({
  role,
  profileId,
}: {
  role: 'school' | 'teacher';
  profileId: string;
}) {
  const styles = useSettingsStyles();
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
      <View style={styles.card}>
        <SettingsCardHeader
          icon={History}
          title="ACCOUNT HISTORY"
          note="A compact record of applications, bookings and reviews. Open the related dashboard area for full details and actions."
        />
        <Button
          title="Refresh history"
          variant="social"
          onPress={() => setAttempt(value => value + 1)}
        />
        {Object.entries(errors).map(([section, error]) => (
          <Text key={section} accessibilityRole="alert" style={styles.error}>
            {section}: {error}
          </Text>
        ))}
      </View>

      <View style={styles.card}>
        <SettingsCardHeader
          icon={ClipboardList}
          title={role === 'teacher' ? 'APPLICATIONS' : 'APPLICATIONS RECEIVED'}
          note="Latest application outcomes without expanding full proposals or activity timelines."
        />
        {!applications && !errors.applications ? <ActivityIndicator accessibilityLabel="Loading applications" /> : null}
        {applications?.map(application => (
          <View key={application.id} style={styles.availabilityDay}>
            <View style={styles.cardHead}>
              <Text style={[styles.recordValue, styles.cardCopy]} numberOfLines={3}>
                {application.jobName || 'Job title unavailable'}
              </Text>
              <StatusBadge status={application.status} />
            </View>
            <Text style={styles.cardNote}>Received {displayDate(application.createdAt)}</Text>
          </View>
        ))}
        {applications?.length === 0 ? <Text style={styles.cardNote}>No application history yet.</Text> : null}
      </View>

      <View style={styles.card}>
        <SettingsCardHeader
          icon={CalendarDays}
          title="BOOKINGS"
          note="Placement outcomes and reviews you submitted."
        />
        {!bookings && !errors.bookings ? <ActivityIndicator accessibilityLabel="Loading bookings" /> : null}
        {bookings?.map(booking => (
          <View style={styles.availabilityDay} key={booking.id}>
            <View style={styles.cardHead}>
              <Text style={[styles.recordValue, styles.cardCopy]} numberOfLines={3}>{booking.job.title}</Text>
              <StatusBadge status={booking.status} />
            </View>
            <Text style={styles.cardNote}>Starts {displayDate(booking.startDate)}</Text>
            {booking.reviews
              ?.filter(review => review.reviewerType === (role === 'teacher' ? 'INSTRUCTOR' : 'INSTITUTION'))
              .map(review => (
                <View key={review.id} style={styles.availabilitySlot}>
                  <Text style={styles.recordLabel}>YOUR REVIEW · {review.rating}/5</Text>
                  <Text style={styles.cardNote}>{review.comment || 'Rating provided without a comment.'}</Text>
                </View>
              ))}
          </View>
        ))}
        {bookings?.length === 0 ? <Text style={styles.cardNote}>No booking history yet.</Text> : null}
      </View>

      <View style={styles.card}>
        <SettingsCardHeader
          icon={Star}
          title="REVIEWS RECEIVED"
          note="Ratings and feedback left for your completed placements."
        />
        <ReviewHistory type={role === 'teacher' ? 'instructor' : 'institution'} id={profileId} />
      </View>
    </View>
  );
}
