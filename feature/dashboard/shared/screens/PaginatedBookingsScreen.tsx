import { openJob, refreshMarketplace } from '../store/navigationSlice';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Text,
  View,
} from 'react-native';
import BookingFilterBar from '../../../../components/dashboard/BookingFilterBar';
import BookingRecordCard from '../../../../components/dashboard/BookingRecordCard';
import ConfirmDialog from '../../../../components/Ui/ConfirmDialog';
import { Notice, RecordSkeleton } from '../../../../components/Ui/RecordLayout';
import { ApiError } from '../../../../utils/api/request';
import { getSessionVersion } from '../../../../utils/api/session';
import Button from '../../../../components/Ui/Button';
import Input from '../../../../components/Ui/Input';
import ChoiceField from '../../../../components/dashboard/ChoiceField';
import BookingInvoiceCard from '../../../../components/dashboard/BookingInvoiceCard';
import LimitedProfileCard from '../../../../components/dashboard/LimitedProfileCard';
import { useStyles } from '../../../../components/dashboard/dashboardStyles';
import { useJobStyles } from '../../../../components/dashboard/jobStyles';
import { useTheme } from '../../../../components/Ui/theme';
import { AccountType } from '../../../../utils/onboarding/onboardingData';
import {
  Booking,
  getBooking,
  cancelBooking,
  completeBooking,
  noShowBooking,
} from '../apis/bookingsApi';
import { createReview } from '../apis/reviewsApi';
import { useBookings } from '../hooks/useBookings';
import { useLimitedProfile } from '../hooks/useLimitedProfile';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { openBookingMessages } from '../store/navigationSlice';

function canActToday(value?: string | null) {
  if (!value) return true;
  const start = new Date(value).getTime();
  return Number.isFinite(start) && start <= Date.now();
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
  const bookingId = useAppSelector(
    state => state.dashboardNavigation.notificationBookingId,
  );
  const [linkedBooking, setLinkedBooking] = useState<Booking>();
  const [linkedLoading, setLinkedLoading] = useState(false);
  const [linkedError, setLinkedError] = useState('');
  const [linkedAttempt, setLinkedAttempt] = useState(0);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    let active = true;
    const version = getSessionVersion();
    setLinkedBooking(undefined);
    setLinkedError('');
    setLinkedLoading(Boolean(bookingId));
    if (!bookingId) return;
    getBooking(bookingId)
      .then(result => {
        if (active && version === getSessionVersion()) setLinkedBooking(result);
      })
      .catch(problem => {
        if (active && version === getSessionVersion())
          setLinkedError(
            problem instanceof Error
              ? problem.message
              : 'This booking is unavailable.',
          );
      })
      .finally(() => {
        if (active) setLinkedLoading(false);
      });
    return () => {
      active = false;
    };
  }, [bookingId, linkedAttempt]);
  const visibleBookings = bookingId
    ? linkedBooking
      ? [linkedBooking]
      : []
    : bookings.bookings;
  const isLoading = bookingId ? linkedLoading : bookings.loading;
  async function refreshBookings() {
    if (bookingId) {
      setLinkedAttempt(value => value + 1);
      return true;
    }
    return bookings.reload();
  }
  async function openDirections(booking: Booking) {
    const destination = [
      booking.job.address,
      booking.job.city,
      booking.job.postalCode,
    ]
      .filter(Boolean)
      .join(', ');
    try {
      await Linking.openURL(
        'https://www.google.com/maps/dir/?api=1&destination=' +
          encodeURIComponent(destination),
      );
    } catch {
      bookings.setError(
        'Unable to open maps. You can copy the address shown on the booking.',
      );
    }
  }
  const profile = useLimitedProfile();
  const [cancelId, setCancelId] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [reviewId, setReviewId] = useState('');
  const [rating, setRating] = useState('5');
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const working = useRef(false);
  const scrollStarted = useRef(false);
  const [confirmation, setConfirmation] = useState<{ booking: Booking; action: 'complete' | 'no-show' }>();
  const [notice, setNotice] = useState('');

  function confirmComplete(booking: Booking) {
    setConfirmation({ booking, action: 'complete' });
  }

  function confirmNoShow(booking: Booking) {
    setConfirmation({ booking, action: 'no-show' });
  }

  async function updateBooking(action: () => Promise<unknown>) {
    if (working.current) return false;
    working.current = true;
    setBusy(true);
    const version = getSessionVersion();
    bookings.setError('');
    try {
      await action();
      if (version !== getSessionVersion() || !mounted.current) return false;
      dispatch(refreshMarketplace());
      setNotice('Booking updated. The latest details are shown below.');
      if (!(await refreshBookings()))
        bookings.setError(
          'Your action was saved. Refresh bookings to see the latest details.',
        );
      return true;
    } catch (problem) {
      if (version !== getSessionVersion() || !mounted.current) return false;
      if (problem instanceof ApiError && problem.status === 409) {
        await refreshBookings();
        if (version === getSessionVersion() && mounted.current)
          bookings.setError(
            'This booking changed. The latest details have been requested; check them before trying again.',
          );
      } else bookings.setError(actionError(problem));
      return false;
    } finally {
      working.current = false;
      if (mounted.current && version === getSessionVersion()) setBusy(false);
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
      <BookingRecordCard booking={booking} partyName={partyName} onProfile={() => openPartyProfile(booking)} footer={booking.status === 'COMPLETED' || booking.invoice ? <BookingInvoiceCard booking={booking} role={type === 'school' ? 'INSTITUTION' : 'INSTRUCTOR'} onChanged={refreshBookings} /> : undefined}>
        {type === 'teacher' && [
          booking.job.address,
          booking.job.city,
          booking.job.county,
          booking.job.postalCode,
        ].some(Boolean) ? (
          <Button
            title="Get directions"
            variant="social"
            onPress={() => openDirections(booking)}
          />
        ) : null}
        <Button
          title="View job"
          variant="social"
          onPress={() => dispatch(openJob(booking.job.id))}
        />
        <Button
          title={type === 'school' ? 'Message teacher' : 'Message school'}
          variant="social"
          onPress={() => dispatch(openBookingMessages(booking.id))}
        />
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
                  maxLength={1000}
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
                onPress={() => {
                  setCancelId(booking.id);
                  setCancelReason('');
                }}
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
                  maxLength={2000}
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
                onPress={() => {
                  setReviewId(booking.id);
                  setComment('');
                  setRating('5');
                }}
                disabled={busy}
                compact
              />
            )}
          </View>
        ) : null}
      </BookingRecordCard>
    );
  }

  const filtersAreActive = Object.values(bookings.filters).some(
    value => value !== '' && value !== 'ALL' && value !== 'All',
  );

  return (
    <>
      {confirmation ? <ConfirmDialog key={confirmation.booking.id + confirmation.action} visible title={confirmation.action === 'complete' ? 'Complete this booking?' : 'Report a no-show?'} context={confirmation.booking.job.title + ' · ' + confirmation.booking.instructor.fullName} description={confirmation.action === 'complete' ? 'Confirm that the placement has finished. This records the final outcome and makes the booking available for invoicing and reviews.' : 'Confirm the teacher did not attend this placement. This records a final no-show outcome.'} confirmLabel={confirmation.action === 'complete' ? 'Confirm completion' : 'Confirm no-show'} destructive={confirmation.action === 'no-show'} onClose={() => setConfirmation(undefined)} onConfirm={() => updateBooking(() => confirmation.action === 'complete' ? completeBooking(confirmation.booking.id) : noShowBooking(confirmation.booking.id))} /> : null}
      <LimitedProfileCard
        profile={profile.profile}
        error={profile.error}
        loading={profile.loading}
        onClose={profile.closeProfile}
      />
      <FlatList
        style={styles.scroll}
        contentContainerStyle={styles.page}
        data={visibleBookings}
        keyExtractor={booking => booking.id}
        renderItem={renderBooking}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={() => {
          scrollStarted.current = true;
        }}
        onEndReachedThreshold={0.35}
        onEndReached={() => {
          if (bookingId || !scrollStarted.current) return;
          scrollStarted.current = false;
          bookings.loadMore();
        }}
        refreshing={isLoading && visibleBookings.length > 0}
        onRefresh={refreshBookings}
        ListHeaderComponent={
          <View style={jobStyles.shell}>
            {notice ? <Notice text={notice} /> : null}
            <View style={jobStyles.progressCopy}>
              <Text style={jobStyles.listTitle}>Bookings</Text>
              <Text style={jobStyles.modeBody}>
                Stay on top of your placements, people and next steps.
              </Text>
            </View>

            {!bookingId ? (
              <BookingFilterBar
                filters={bookings.filters}
                onChange={bookings.setFilter}
              />
            ) : null}
            {!bookingId && bookings.filters.agenda !== 'All' ? (
              <Text style={styles.teacherMeta}>
                {bookings.bookings.length} matching bookings in{' '}
                {bookings.loadedCount} loaded.
                {bookings.hasMore
                  ? ' Load more to check remaining records.'
                  : ''}
              </Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <RecordSkeleton />
          ) : (
            <View style={[styles.card, styles.emptyCard]}>
              <Text style={styles.cardTitle}>
                {bookingId
                  ? 'Booking unavailable'
                  : bookings.hasMore
                  ? 'No matches in loaded bookings'
                  : filtersAreActive
                  ? 'No bookings match these filters'
                  : 'No bookings yet'}
              </Text>
              <Text style={[styles.cardBody, styles.centerText]}>
                {bookingId
                  ? 'Retry or use Show all bookings to continue.'
                  : bookings.hasMore
                  ? 'Load more to check the remaining records.'
                  : 'Try another view or clear filters. Confirmed hires appear here.'}
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          <View>
            {bookings.loadingMore ? (
              <ActivityIndicator color={colors.brand} />
            ) : null}
            {linkedError ? (
              <Text style={jobStyles.error} accessibilityLiveRegion="polite">
                {linkedError}
              </Text>
            ) : null}
            {bookings.error || linkedError ? (
              <Button
                title="Refresh bookings"
                variant="social"
                disabled={isLoading || busy}
                onPress={refreshBookings}
              />
            ) : null}
            {!bookingId && bookings.hasMore ? (
              <Button
                title="Load more bookings"
                variant="social"
                disabled={bookings.loading || bookings.loadingMore}
                onPress={bookings.loadMore}
              />
            ) : null}
            {bookings.error ? (
              <Text style={jobStyles.error} accessibilityLiveRegion="polite">
                {bookings.error}
              </Text>
            ) : null}
            {!bookingId &&
            bookings.bookings.length > 0 &&
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
