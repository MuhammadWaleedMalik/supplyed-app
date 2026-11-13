import { openJob, refreshMarketplace, showPage } from '../store/navigationSlice';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  Text,
  View,
} from 'react-native';
import {
  BriefcaseBusiness,
  CheckCircle2,
  ChevronLeft,
  MessageCircle,
} from 'lucide-react-native';
import BookingFilterBar from '../../../../components/dashboard/BookingFilterBar';
import BookingRecordCard from '../../../../components/dashboard/BookingRecordCard';
import ConfirmDialog from '../../../../components/Ui/ConfirmDialog';
import { Notice, RecordSection, RecordSkeleton, StatusBadge } from '../../../../components/Ui/RecordLayout';
import { ApiError } from '../../../../utils/api/request';
import { getSessionVersion } from '../../../../utils/api/session';
import Button from '../../../../components/Ui/Button';
import Input from '../../../../components/Ui/Input';
import ChoiceField from '../../../../components/dashboard/ChoiceField';
import BookingInvoiceCard from '../../../../components/dashboard/BookingInvoiceCard';
import AttendancePanel from '../../../../components/dashboard/AttendancePanel';
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
import {
  canSchoolCompleteBooking,
  canSchoolReportNoShow,
} from '../../../../utils/bookings/bookingActions';
import { displayDate } from '../../../../utils/ui/marketplaceLabels';

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
  const returnPage = useAppSelector(
    state => state.dashboardNavigation.returnPage,
  );
  const [linkedBooking, setLinkedBooking] = useState<Booking>();
  const [selectedBookingId, setSelectedBookingId] = useState('');
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
  const detailOpen = Boolean(bookingId || selectedBookingId);
  const selectedBooking = bookingId
    ? linkedBooking
    : bookings.bookings.find(item => item.id === selectedBookingId);
  const visibleBookings = detailOpen
    ? selectedBooking
      ? [selectedBooking]
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

  async function updateBooking(
    action: () => Promise<unknown>,
    onActionError?: (message: string) => void,
  ) {
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
        if (version === getSessionVersion() && mounted.current) {
          const message =
            'This booking changed. The latest details have been requested; check them before trying again.';
          if (onActionError) onActionError(message);
          else bookings.setError(message);
        }
      } else {
        const message = actionError(problem);
        if (onActionError) onActionError(message);
        else bookings.setError(message);
      }
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
    if (!detailOpen) {
      return (
        <RecordSection
          title={booking.job.title}
          action={<StatusBadge status={booking.status} />}
        >
          <Text style={styles.cardBody} numberOfLines={2}>{partyName}</Text>
          <Text style={styles.teacherMeta}>
            {displayDate(booking.startDate)} to {displayDate(booking.endDate)}
          </Text>
          <Button
            title="See booking details"
            variant="outline"
            onPress={() => setSelectedBookingId(booking.id)}
          />
        </RecordSection>
      );
    }
    const showComplete = canSchoolCompleteBooking(type, booking.status);
    const showNoShow = canSchoolReportNoShow(
      type,
      booking.status,
      booking.startDate,
    );
    const showCancel = booking.status === 'CONFIRMED';
    const showReview = reviewWindowOpen(booking) && !hasMyReview(booking, type);
    const topActions = detailOpen ? (
      <View style={styles.bookingDetailActions}>
        {showComplete ? (
          <View style={styles.bookingActionSlot}>
            <Button
              title="Complete booking"
              icon={<CheckCircle2 size={19} color="#ffffff" />}
              onPress={() => confirmComplete(booking)}
              disabled={busy}
            />
          </View>
        ) : null}
        <View style={styles.bookingActionSlot}>
          <Button
            title="View job"
            icon={<BriefcaseBusiness size={19} color={colors.ink} />}
            variant="social"
            onPress={() => dispatch(openJob(booking.job.id))}
          />
        </View>
        <View style={styles.bookingActionSlot}>
          <Button
            title={type === 'school' ? 'Message teacher' : 'Message school'}
            icon={<MessageCircle size={19} color={colors.ink} />}
            variant="outline"
            onPress={() => dispatch(openBookingMessages(booking.id))}
          />
        </View>
      </View>
    ) : undefined;

    return (
      <BookingRecordCard booking={booking} partyName={partyName} onProfile={() => openPartyProfile(booking)} topActions={topActions} detailMode={detailOpen} hideManage={booking.status === 'COMPLETED'} footer={booking.status === 'CONFIRMED' || booking.status === 'COMPLETED' || booking.invoice || booking.automaticPayment ? <BookingInvoiceCard booking={booking} role={type === 'school' ? 'INSTITUTION' : 'INSTRUCTOR'} onChanged={refreshBookings} /> : undefined}>
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
        {!detailOpen ? <>
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
        </> : null}
        {showComplete && !detailOpen ? (
          <View style={styles.quickButtons}>
            <Button
              title="Complete booking"
              onPress={() => confirmComplete(booking)}
              disabled={busy}
              compact
            />
            {showNoShow ? (
              <Button
                title="Report no-show"
                variant="social"
                onPress={() => confirmNoShow(booking)}
                disabled={busy}
                compact
              />
            ) : null}
          </View>
        ) : null}

        {['CONFIRMED', 'COMPLETED'].includes(booking.status) &&
        (booking.attendancePolicyEffectiveAt ||
          booking.attendanceShifts?.length) ? (
          <AttendancePanel
            booking={booking}
            disabled={busy}
            readOnly={type === 'teacher' || booking.status !== 'CONFIRMED'}
            onRun={updateBooking}
          />
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

  const filtersAreActive =
    bookings.filters.status !== 'ALL' ||
    Boolean(bookings.filters.search) ||
    Boolean(bookings.filters.from) ||
    Boolean(bookings.filters.to) ||
    bookings.filters.invoice !== 'ALL';

  return (
    <>
      {confirmation ? <ConfirmDialog key={confirmation.booking.id + confirmation.action} visible title={confirmation.action === 'complete' ? 'Complete this booking?' : 'Report a no-show?'} context={confirmation.booking.job.title + ' · ' + confirmation.booking.instructor.fullName} description={confirmation.action === 'complete' ? 'Only the school can complete this booking. Confirm that the placement has finished. Attendance and payment will follow the agreed schedule.' : 'Confirm the teacher did not attend this placement. This records a final no-show outcome.'} confirmLabel={confirmation.action === 'complete' ? 'Complete booking' : 'Confirm no-show'} destructive={confirmation.action === 'no-show'} onClose={() => setConfirmation(undefined)} onConfirm={() => updateBooking(() => confirmation.action === 'complete' ? completeBooking(confirmation.booking.id) : noShowBooking(confirmation.booking.id))} /> : null}
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
          if (detailOpen || !scrollStarted.current) return;
          scrollStarted.current = false;
          bookings.loadMore();
        }}
        refreshing={isLoading && visibleBookings.length > 0}
        onRefresh={refreshBookings}
        ListHeaderComponent={
          <View style={jobStyles.shell}>
            {notice ? <Notice text={notice} /> : null}
            {detailOpen ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  returnPage ? `Back to ${returnPage}` : 'Back to all bookings'
                }
                onPress={() => {
                  setSelectedBookingId('');
                  if (bookingId)
                    dispatch(showPage(returnPage || 'Bookings'));
                }}
                style={({ pressed }) => [
                  styles.bookingBackButton,
                  pressed && styles.bookingActionPressed,
                ]}
              >
                <ChevronLeft size={24} color={colors.ink} />
              </Pressable>
            ) : null}
            <View style={jobStyles.progressCopy}>
              <Text style={jobStyles.listTitle}>
                {detailOpen ? 'Booking details' : 'Bookings'}
              </Text>
              <Text style={jobStyles.modeBody}>
                {detailOpen
                  ? 'Review the complete placement, people and available actions.'
                  : 'Choose a booking to see its complete details and actions.'}
              </Text>
            </View>

            {!detailOpen ? (
              <BookingFilterBar
                filters={bookings.filters}
                onChange={bookings.setFilter}
              />
            ) : null}
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <RecordSkeleton />
          ) : (
            <View style={[styles.card, styles.emptyCard]}>
              <Text style={styles.cardTitle}>
                {detailOpen
                  ? 'Booking unavailable'
                  : bookings.hasMore
                  ? 'No matches in loaded bookings'
                  : filtersAreActive
                  ? 'No bookings match these filters'
                  : 'No bookings yet'}
              </Text>
              <Text style={[styles.cardBody, styles.centerText]}>
                {detailOpen
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
            {!detailOpen && bookings.hasMore ? (
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
            {!detailOpen &&
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
