import React, { useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import Button from '../../../../components/Ui/Button';
import Input from '../../../../components/Ui/Input';
import ChoiceField from '../../../../components/dashboard/ChoiceField';
import { styles } from '../../../../components/dashboard/dashboardStyles';
import { jobStyles } from '../../../../components/dashboard/jobStyles';
import { AccountType } from '../../../../utils/onboarding/onboardingData';
import {
  Booking,
  cancelBooking,
  completeBooking,
  getMyBookings,
  noShowBooking,
} from '../apis/bookingsApi';
import { createReview } from '../apis/reviewsApi';

const statuses = ['ALL', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];

function dateText(value?: string | null) {
  return value ? value.slice(0, 10) : 'Not set';
}

function payText(booking: Booking) {
  if (!booking.payAmount) return 'Pay not set';
  return String(booking.payAmount) + ' ' + (booking.payType || 'pay');
}

function canActToday(value?: string | null) {
  if (!value) return true;
  const start = new Date(value).getTime();
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return start <= today.getTime();
}

function reviewWindowOpen(booking: Booking) {
  if (booking.status !== 'COMPLETED' || !booking.completedAt) return false;
  const completed = new Date(booking.completedAt).getTime();
  const now = Date.now();
  return now - completed <= 14 * 24 * 60 * 60 * 1000;
}

function hasMyReview(booking: Booking, type: AccountType) {
  const reviewerType = type === 'teacher' ? 'INSTRUCTOR' : 'INSTITUTION';
  return Boolean(
    booking.reviews?.some(review => review.reviewerType === reviewerType),
  );
}

function actionError(problem: unknown) {
  return problem instanceof Error ? problem.message : 'Unable to update booking.';
}

type Props = { type: AccountType };

export default function BookingsScreen({ type }: Props) {
  const [status, setStatus] = useState('ALL');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelId, setCancelId] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [reviewId, setReviewId] = useState('');
  const [rating, setRating] = useState('5');
  const [comment, setComment] = useState('');

  async function loadBookings(nextStatus = status) {
    setLoading(true);
    setError('');
    try {
      setBookings(await getMyBookings(nextStatus));
    } catch (problem) {
      setError(actionError(problem));
    }
    setLoading(false);
  }

  useEffect(() => {
    loadBookings(status);
  }, [status]);

  function confirmComplete(booking: Booking) {
    Alert.alert('Mark booking complete?', 'This outcome is final.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Mark complete', onPress: () => updateBooking(() => completeBooking(booking.id)) },
    ]);
  }

  function confirmNoShow(booking: Booking) {
    Alert.alert('Report no-show?', 'This outcome is final.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Report no-show', onPress: () => updateBooking(() => noShowBooking(booking.id)) },
    ]);
  }

  async function updateBooking(action: () => Promise<unknown>) {
    setError('');
    try {
      await action();
      await loadBookings();
    } catch (problem) {
      setError(actionError(problem));
    }
  }

  async function sendCancel() {
    if (!cancelReason.trim()) {
      setError('Enter a reason before cancelling.');
      return;
    }
    await updateBooking(() => cancelBooking(cancelId, cancelReason));
    setCancelId('');
    setCancelReason('');
  }

  async function sendReview() {
    await updateBooking(() => createReview(reviewId, Number(rating), comment));
    setReviewId('');
    setRating('5');
    setComment('');
  }

  return (
    <View style={jobStyles.shell}>
      <View style={jobStyles.progressCopy}>
        <Text style={jobStyles.listTitle}>Bookings</Text>
        <Text style={jobStyles.modeBody}>
          Confirmed work, cancellations, completion, and reviews.
        </Text>
      </View>

      <View style={styles.filters}>
        {statuses.map(item => {
          const active = item === status;
          return (
            <Pressable
              key={item}
              onPress={() => setStatus(item)}
              style={[styles.filter, active && styles.filterActive]}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>
                {item.replace('_', ' ')}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {loading ? <Text style={jobStyles.modeBody}>Loading bookings...</Text> : null}
      {!loading && !bookings.length ? (
        <View style={[styles.card, styles.emptyCard]}>
          <Text style={styles.cardTitle}>No bookings yet</Text>
          <Text style={[styles.cardBody, styles.centerText]}>
            Hired applications will appear here as bookings.
          </Text>
        </View>
      ) : null}

      {bookings.map(booking => {
        const partyName = type === 'school'
          ? booking.instructor.fullName
          : booking.institution.name;
        const showSchoolActions =
          type === 'school' &&
          booking.status === 'CONFIRMED' &&
          canActToday(booking.startDate);
        const showCancel = booking.status === 'CONFIRMED';
        const showReview = reviewWindowOpen(booking) && !hasMyReview(booking, type);

        return (
          <View key={booking.id} style={styles.card}>
            <View style={styles.sectionHead}>
              <View style={styles.teacherCopy}>
                <Text style={styles.cardTitle}>{booking.job.title}</Text>
                <Text style={styles.cardBody}>{partyName}</Text>
              </View>
              <View style={jobStyles.statusBadge}>
                <Text style={jobStyles.statusText}>{booking.status}</Text>
              </View>
            </View>

            <Text style={styles.cardBody}>
              {dateText(booking.startDate)} to {dateText(booking.endDate)} | {payText(booking)}
            </Text>
            <Text style={styles.cardBody}>
              {[booking.job.address, booking.job.city, booking.job.postalCode]
                .filter(Boolean)
                .join(', ') || 'Address not set'}
            </Text>
            {booking.job.parkingInfo ? (
              <Text style={styles.teacherMeta}>Parking: {booking.job.parkingInfo}</Text>
            ) : null}
            {booking.cancelReason ? (
              <Text style={styles.teacherMeta}>Reason: {booking.cancelReason}</Text>
            ) : null}

            {showSchoolActions ? (
              <View style={styles.quickButtons}>
                <Button title="Mark complete" onPress={() => confirmComplete(booking)} compact />
                <Button title="Report no-show" variant="social" onPress={() => confirmNoShow(booking)} compact />
              </View>
            ) : null}

            {showCancel ? (
              <View style={styles.quickButtons}>
                {cancelId === booking.id ? (
                  <>
                    <Input
                      label="CANCEL REASON"
                      placeholder="Why is this booking cancelled?"
                      multiline
                      value={cancelReason}
                      onChangeText={setCancelReason}
                    />
                    <Button title="Confirm cancellation" onPress={sendCancel} compact />
                    <Button title="Keep booking" variant="link" onPress={() => setCancelId('')} compact />
                  </>
                ) : (
                  <Button title="Cancel booking" variant="link" onPress={() => setCancelId(booking.id)} compact />
                )}
              </View>
            ) : null}

            {showReview ? (
              <View style={styles.quickButtons}>
                {reviewId === booking.id ? (
                  <>
                    <ChoiceField label="Rating" value={rating} options={['1', '2', '3', '4', '5']} onChange={setRating} />
                    <Input
                      label="COMMENT"
                      placeholder="Optional review comment"
                      multiline
                      required={false}
                      value={comment}
                      onChangeText={setComment}
                    />
                    <Button title="Submit review" onPress={sendReview} compact />
                    <Button title="Cancel review" variant="link" onPress={() => setReviewId('')} compact />
                  </>
                ) : (
                  <Button title="Leave a review" onPress={() => setReviewId(booking.id)} compact />
                )}
              </View>
            ) : null}
          </View>
        );
      })}

      {error ? <Text style={jobStyles.error}>{error}</Text> : null}
    </View>
  );
}

