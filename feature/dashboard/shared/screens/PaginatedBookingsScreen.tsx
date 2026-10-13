import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  Text,
  View,
} from 'react-native';
import Button from '../../../../components/Ui/Button';
import Input from '../../../../components/Ui/Input';
import Select from '../../../../components/Ui/Select';
import ChoiceField from '../../../../components/dashboard/ChoiceField';
import BookingInvoiceCard from '../../../../components/dashboard/BookingInvoiceCard';
import LimitedProfileCard from '../../../../components/dashboard/LimitedProfileCard';
import { useStyles } from '../../../../components/dashboard/dashboardStyles';
import { useJobStyles } from '../../../../components/dashboard/jobStyles';
import { useTheme } from '../../../../components/Ui/theme';
import { AccountType } from '../../../../utils/onboarding/onboardingData';
import {
  Booking,
  cancelBooking,
  completeBooking,
  noShowBooking,
} from '../apis/bookingsApi';
import { createReview } from '../apis/reviewsApi';
import { useBookings, type BookingFilters } from '../hooks/useBookings';
import { useLimitedProfile } from '../hooks/useLimitedProfile';
import { useAppDispatch } from '../../../../store/hooks';
import { openMessages } from '../store/navigationSlice';

const statuses: BookingFilters['status'][] = [
  'ALL',
  'CONFIRMED',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
];
const invoiceFilters = ['ALL', 'none', 'unpaid', 'paid'] as const;

function dateText(value?: string | null) {
  if (!value) return 'Not set';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not set' : date.toLocaleDateString();
}

function payText(booking: Booking) {
  if (booking.payAmount == null) return 'Pay not set';
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
  return Date.now() - completed <= 14 * 24 * 60 * 60 * 1000;
}

function hasMyReview(booking: Booking, type: AccountType) {
  const reviewerType = type === 'teacher' ? 'INSTRUCTOR' : 'INSTITUTION';
  return Boolean(
    booking.reviews?.some(review => review.reviewerType === reviewerType),
  );
}

function actionError(problem: unknown) {
  return problem instanceof Error
    ? problem.message
    : 'Unable to update booking.';
}

type Props = { type: AccountType };

export default function PaginatedBookingsScreen({ type }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const jobStyles = useJobStyles();

  const dispatch = useAppDispatch();
  const bookings = useBookings();
  const profile = useLimitedProfile();
  const [cancelId, setCancelId] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [reviewId, setReviewId] = useState('');
  const [rating, setRating] = useState('5');
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const working = useRef(false);
  const scrollStarted = useRef(false);

  function confirmComplete(booking: Booking) {
    Alert.alert('Mark booking complete?', 'This outcome is final.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark complete',
        onPress: () => updateBooking(() => completeBooking(booking.id)),
      },
    ]);
  }

  function confirmNoShow(booking: Booking) {
    Alert.alert('Report no-show?', 'This outcome is final.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Report no-show',
        onPress: () => updateBooking(() => noShowBooking(booking.id)),
      },
    ]);
  }

  async function updateBooking(action: () => Promise<unknown>) {
    if (working.current) return false;
    working.current = true;
    setBusy(true);
    bookings.setError('');
    try {
      await action();
      return await bookings.reload();
    } catch (problem) {
      bookings.setError(actionError(problem));
      return false;
    } finally {
      working.current = false;
      setBusy(false);
    }
  }

  async function sendCancel() {
    if (!cancelReason.trim()) {
      bookings.setError('Enter a reason before cancelling.');
      return;
    }
    if (await updateBooking(() => cancelBooking(cancelId, cancelReason))) {
      setCancelId('');
      setCancelReason('');
    }
  }

  async function sendReview() {
    if (
      await updateBooking(() => createReview(reviewId, Number(rating), comment))
    ) {
      setReviewId('');
      setRating('5');
      setComment('');
    }
  }

  function openPartyProfile(booking: Booking) {
    if (type === 'school') profile.openInstructor(booking.instructor.id);
    else profile.openSchool(booking.institution.id);
  }

  function renderBooking({ item: booking }: { item: Booking }) {
    const partyName =
      type === 'school'
        ? booking.instructor.fullName
        : booking.institution.name;
    const showSchoolActions =
      type === 'school' &&
      booking.status === 'CONFIRMED' &&
      canActToday(booking.startDate);
    const showCancel = booking.status === 'CONFIRMED';
    const showReview = reviewWindowOpen(booking) && !hasMyReview(booking, type);

    return (
      <View style={styles.card}>
        <View style={styles.sectionHead}>
          <View style={styles.teacherCopy}>
            <Text style={styles.cardTitle}>{booking.job.title}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`View ${partyName} profile`}
              onPress={() => openPartyProfile(booking)}
            >
              <Text style={styles.profileLink}>{partyName}</Text>
            </Pressable>
          </View>
          <View style={jobStyles.statusBadge}>
            <Text style={jobStyles.statusText}>{booking.status}</Text>
          </View>
        </View>

        <Text style={styles.cardBody}>
          {dateText(booking.startDate)} to {dateText(booking.endDate)} |{' '}
          {payText(booking)}
        </Text>
        <Text style={styles.cardBody}>
          {[booking.job.address, booking.job.city, booking.job.postalCode]
            .filter(Boolean)
            .join(', ') || 'Address not set'}
        </Text>
        {booking.job.parkingInfo ? (
          <Text style={styles.teacherMeta}>
            Parking: {booking.job.parkingInfo}
          </Text>
        ) : null}
        {booking.cancelReason ? (
          <Text style={styles.teacherMeta}>Reason: {booking.cancelReason}</Text>
        ) : null}

        {booking.applicationId ? (
          <Button
            title={type === 'school' ? 'Message teacher' : 'Message school'}
            variant="social"
            onPress={() => dispatch(openMessages(booking.applicationId))}
          />
        ) : null}
        {showSchoolActions ? (
          <View style={styles.quickButtons}>
            <Button
              title="Mark complete"
              onPress={() => confirmComplete(booking)}
              disabled={busy}
              compact
            />
            <Button
              title="Report no-show"
              variant="social"
              onPress={() => confirmNoShow(booking)}
              disabled={busy}
              compact
            />
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
                  disabled={busy}
                />
                <Button
                  title="Confirm cancellation"
                  onPress={sendCancel}
                  disabled={busy}
                  compact
                />
                <Button
                  title="Keep booking"
                  variant="link"
                  onPress={() => setCancelId('')}
                  disabled={busy}
                  compact
                />
              </>
            ) : (
              <Button
                title="Cancel booking"
                variant="link"
                onPress={() => setCancelId(booking.id)}
                disabled={busy}
                compact
              />
            )}
          </View>
        ) : null}

        {showReview ? (
          <View style={styles.quickButtons}>
            {reviewId === booking.id ? (
              <>
                <ChoiceField
                  label="Rating"
                  value={rating}
                  options={['1', '2', '3', '4', '5']}
                  onChange={setRating}
                />
                <Input
                  label="COMMENT"
                  placeholder="Optional review comment"
                  multiline
                  required={false}
                  value={comment}
                  onChangeText={setComment}
                  disabled={busy}
                />
                <Button
                  title="Submit review"
                  onPress={sendReview}
                  disabled={busy}
                  compact
                />
                <Button
                  title="Cancel review"
                  variant="link"
                  onPress={() => setReviewId('')}
                  disabled={busy}
                  compact
                />
              </>
            ) : (
              <Button
                title="Leave a review"
                onPress={() => setReviewId(booking.id)}
                disabled={busy}
                compact
              />
            )}
          </View>
        ) : null}
        {booking.status === 'COMPLETED' || booking.invoice ? (
          <BookingInvoiceCard
            booking={booking}
            role={type === 'school' ? 'INSTITUTION' : 'INSTRUCTOR'}
            onChanged={bookings.reload}
          />
        ) : null}
      </View>
    );
  }

  const filtersAreActive = Object.values(bookings.filters).some(
    value => value !== '' && value !== 'ALL',
  );

  return (
    <>
      <LimitedProfileCard
        profile={profile.profile}
        error={profile.error}
        loading={profile.loading}
        onClose={profile.closeProfile}
      />
      <FlatList
        style={styles.scroll}
        contentContainerStyle={styles.page}
        data={bookings.bookings}
        keyExtractor={booking => booking.id}
        renderItem={renderBooking}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={() => {
          scrollStarted.current = true;
        }}
        onEndReachedThreshold={0.35}
        onEndReached={() => {
          if (!scrollStarted.current) return;
          scrollStarted.current = false;
          bookings.loadMore();
        }}
        refreshing={bookings.loading && bookings.bookings.length > 0}
        onRefresh={bookings.reload}
        ListHeaderComponent={
          <View style={jobStyles.shell}>
            <View style={jobStyles.progressCopy}>
              <Text style={jobStyles.listTitle}>Bookings</Text>
              <Text style={jobStyles.modeBody}>
                Confirmed work, cancellations, completion, invoices, and
                reviews.
              </Text>
            </View>

            <View style={styles.filters}>
              {statuses.map(item => {
                const active = item === bookings.filters.status;
                return (
                  <Pressable
                    key={item}
                    disabled={busy || bookings.loading}
                    onPress={() => bookings.setFilter('status', item)}
                    style={[styles.filter, active && styles.filterActive]}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        active && styles.filterTextActive,
                      ]}
                    >
                      {item.replace('_', ' ')}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={jobStyles.wizard}>
              <Input
                label="SEARCH BOOKINGS"
                required={false}
                maxLength={100}
                placeholder="Job, teacher, or school"
                value={bookings.filters.search}
                onChangeText={value => bookings.setFilter('search', value)}
              />
              <Input
                label="FROM DATE"
                required={false}
                placeholder="YYYY-MM-DD"
                value={bookings.filters.from}
                onChangeText={value => bookings.setFilter('from', value)}
              />
              <Input
                label="TO DATE"
                required={false}
                placeholder="YYYY-MM-DD"
                value={bookings.filters.to}
                onChangeText={value => bookings.setFilter('to', value)}
              />
              <Select
                label="INVOICE"
                placeholder="All invoice states"
                value={bookings.filters.invoice}
                options={[...invoiceFilters]}
                onChange={value =>
                  bookings.setFilter(
                    'invoice',
                    value as BookingFilters['invoice'],
                  )
                }
              />
              {filtersAreActive ? (
                <Button
                  title="Clear filters"
                  variant="link"
                  compact
                  onPress={bookings.clearFilters}
                />
              ) : null}
            </View>
          </View>
        }
        ListEmptyComponent={
          bookings.loading ? (
            <ActivityIndicator color={colors.brand} />
          ) : (
            <View style={[styles.card, styles.emptyCard]}>
              <Text style={styles.cardTitle}>No bookings found</Text>
              <Text style={[styles.cardBody, styles.centerText]}>
                Change the filters or wait for a hired application to create a
                booking.
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          <View>
            {bookings.loadingMore ? (
              <ActivityIndicator color={colors.brand} />
            ) : null}
            {bookings.error ? (
              <Text style={jobStyles.error} accessibilityLiveRegion="polite">
                {bookings.error}
              </Text>
            ) : null}
            {bookings.bookings.length &&
            !bookings.hasMore &&
            !bookings.loading ? (
              <Text style={[styles.cardBody, styles.centerText]}>
                All matching bookings are loaded.
              </Text>
            ) : null}
          </View>
        }
      />
    </>
  );
}
