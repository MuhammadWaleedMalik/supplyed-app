import React, { useState } from 'react';
import { Text, View } from 'react-native';
import {
  BookingPeriod,
  bookingPeriodLabel,
} from '../../utils/jobs/teacherSchedule';
import Button from '../Ui/Button';
import { useStyles } from './dashboardStyles';

export default function TeacherBookingDates({
  periods,
  preview = false,
}: {
  periods?: BookingPeriod[] | null;
  preview?: boolean;
}) {
  const styles = useStyles();
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={styles.section}>
      <Text style={styles.eyebrow}>CURRENT / UPCOMING BOOKING DATES</Text>
      {periods == null ? (
        <Text style={styles.cardBody}>
          Booking dates are currently unavailable.
        </Text>
      ) : !periods.length ? (
        <Text style={styles.cardBody}>
          No current/upcoming confirmed bookings returned.
        </Text>
      ) : (
        (preview && !expanded ? periods.slice(0, 2) : periods).map(period => (
          <Text key={period.id} style={styles.cardBody}>
            {bookingPeriodLabel(period)}
          </Text>
        ))
      )}
      {preview && periods && periods.length > 2 ? (
        <Button
          title={
            expanded
              ? 'Show fewer dates'
              : `Show all ${periods.length} booking periods`
          }
          variant="link"
          onPress={() => setExpanded(value => !value)}
        />
      ) : null}
    </View>
  );
}
