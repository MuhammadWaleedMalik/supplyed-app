import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Modal, ScrollView, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  Invitation,
  getInvitationsPage,
  getInvitation,
  decideInvitation,
  invitationStatus,
  readPendingInvitation,
} from '../apis/invitationsApi';
import { getSessionVersion } from '../../../../utils/api/session';
import {
  createMergedPager,
  newestFirst,
} from '../../../../utils/api/mergedPager';
import { usePagedResource } from '../hooks/usePagedResource';
import { useForegroundRefresh } from '../hooks/useForegroundRefresh';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
  openInvitation,
  showPage,
  openBooking,
  refreshMarketplace,
} from '../store/navigationSlice';
import {
  displayDate,
  displayPay,
} from '../../../../utils/ui/marketplaceLabels';
import InvitationForm from '../../../../components/dashboard/InvitationForm';
import Button from '../../../../components/Ui/Button';
import DetailHeader from '../../../../components/Ui/DetailHeader';
import ConfirmDialog from '../../../../components/Ui/ConfirmDialog';
import {
  EmptyState,
  InfoGrid,
  ListFeedback,
  Notice,
  RecordSection,
  RecordSkeleton,
  StatusBadge,
} from '../../../../components/Ui/RecordLayout';
import InvitationDetails from '../../../../components/dashboard/InvitationDetails';
import DynamicSelect from '../../../../components/Ui/DynamicSelect';
import { useStyles } from '../../../../components/dashboard/dashboardStyles';

export default function InvitationsScreen({
  role,
  jobId = '',
  header,
}: {
  role: 'school' | 'teacher';
  jobId?: string;
  embedded?: boolean;
  header?: React.ReactNode;
}) {
  const styles = useStyles();
  const resumeScroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const scrollStarted = useRef(false);
  const working = useRef(false);
  const dispatch = useAppDispatch();
  const linkedId = useAppSelector(
    state => state.dashboardNavigation.invitationId,
  );
  const revision = useAppSelector(
    state => state.dashboardNavigation.dataRevision,
  );
  const [hasPending, setHasPending] = useState(false);
  const [selected, setSelected] = useState<Invitation>();
  const [status, setStatus] = useState('');
  const [resume, setResume] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [confirmation, setConfirmation] = useState<
    'accept' | 'decline' | 'cancel'
  >();
  const loader = useMemo(
    () =>
      createMergedPager(
        [(page: number) => getInvitationsPage(page, status)],
        newestFirst,
        item =>
          (!jobId || item.job.id === jobId) &&
          (!status || invitationStatus(item) === status),
      ),
    [status, jobId],
  );
  const pages = usePagedResource(loader, true, String(revision));
  useForegroundRefresh(() => {
    if (!busy && !pages.loading) {
      pages.refreshLoaded();
      setAttempt(value => value + 1);
    }
  });
  useEffect(() => {
    let active = true;
    const version = getSessionVersion();
    if (role === 'school')
      readPendingInvitation()
        .then(saved => {
          if (active && version === getSessionVersion()) setHasPending(!!saved);
        })
        .catch(() => {
          if (active) setHasPending(true);
        });
    setError('');
    setLoading(!!linkedId);
    if (!linkedId) setSelected(undefined);
    else
      getInvitation(linkedId)
        .then(item => {
          if (active && version === getSessionVersion()) setSelected(item);
        })
        .catch(problem => {
          if (active) setError(problem.message || 'Unable to load invitation.');
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    return () => {
      active = false;
    };
  }, [linkedId, revision, role, attempt]);
  async function decide(action: 'accept' | 'decline' | 'cancel') {
    if (!selected || working.current) return false;
    working.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    const version = getSessionVersion();
    try {
      await decideInvitation(selected.id, action);
      if (version !== getSessionVersion()) return false;
      setNotice(
        action === 'accept'
          ? 'Invitation accepted. Your confirmed booking is ready.'
          : action === 'decline'
          ? 'Invitation declined.'
          : 'Invitation cancelled.',
      );
      dispatch(refreshMarketplace());
      return true;
    } catch (problem) {
      if (version === getSessionVersion()) {
        setError(
          problem instanceof Error
            ? problem.message
            : 'Unable to confirm this decision. Refresh before retrying.',
        );
        setAttempt(value => value + 1);
      }
      throw problem;
    } finally {
      working.current = false;
      setBusy(false);
    }
  }
  const closeDetails = () => {
    if (!busy) {
      dispatch(openInvitation(''));
      setNotice('');
    }
  };
  return (
    <View style={styles.scroll}>
      <FlatList
        data={pages.items}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.page}
        ListHeaderComponent={
          <View style={styles.section}>
            {header}
            <Text style={styles.title}>Invitations</Text>
            <Text style={styles.cardBody}>
              {role === 'teacher'
                ? 'Your next placement could start here. Review offers and choose the right fit.'
                : 'Send an offer, follow its progress and confirm your next placement.'}
            </Text>
            <DynamicSelect
              name="jobInvitationStatus"
              label="Status"
              value={status}
              placeholder="All invitations · newest first"
              onChange={setStatus}
            />
            {role === 'school' ? (
              <>
                <Button
                  title="Invite a teacher"
                  onPress={() => dispatch(showPage('Teachers'))}
                />
                {hasPending ? (
                  <Button
                    title="Resume saved invitation"
                    variant="outline"
                    onPress={() => setResume(true)}
                  />
                ) : null}
              </>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <RecordSection
            title={item.job.title}
            action={<StatusBadge status={invitationStatus(item)} />}
          >
            <Text style={styles.cardTitle}>
              {role === 'school'
                ? item.instructor.fullName
                : item.institution.name}
            </Text>
            <InfoGrid
              items={[
                { label: 'Starts', value: displayDate(item.job.startDate) },
                {
                  label: 'Offered pay',
                  value: displayPay(item.job.payAmount, item.job.payType),
                },
              ]}
            />
            {invitationStatus(item) === 'PENDING' ? (
              <Text style={styles.teacherMeta}>
                Response due {displayDate(item.expiresAt)}
              </Text>
            ) : null}
            <Button
              title="Review invitation"
              variant="outline"
              onPress={() => {
                setSelected(item);
                dispatch(openInvitation(item.id));
              }}
            />
          </RecordSection>
        )}
        refreshing={pages.loading && pages.items.length > 0}
        onRefresh={pages.refresh}
        onScrollBeginDrag={() => {
          scrollStarted.current = true;
        }}
        onEndReachedThreshold={0.35}
        onEndReached={() => {
          if (scrollStarted.current && pages.hasMore && !pages.loading) {
            scrollStarted.current = false;
            pages.loadMore();
          }
        }}
        ListEmptyComponent={
          pages.loading ? (
            <RecordSkeleton />
          ) : !pages.error ? (
            <EmptyState
              title={
                pages.hasMore
                  ? 'No matches on these pages'
                  : 'No matching invitations'
              }
              description={
                pages.hasMore
                  ? 'Continue loading to search older offers.'
                  : 'Try another filter or check back for new offers.'
              }
            />
          ) : undefined
        }
        ListFooterComponent={
          <ListFeedback
            loading={pages.loading && pages.items.length > 0}
            error={pages.error}
            hasMore={pages.hasMore}
            onMore={pages.loadMore}
            onRetry={pages.refresh}
            count={pages.items.length}
          />
        }
      />
      <Modal
        visible={!!linkedId}
        animationType="slide"
        onRequestClose={closeDetails}
      >
        <SafeAreaProvider>
          <SafeAreaView style={styles.safeArea}>
            <DetailHeader
              title="Invitation details"
              subtitle="Offer, placement and response"
              disabled={busy}
              onBack={closeDetails}
              backLabel="Return to invitations"
            />
            <ScrollView contentContainerStyle={styles.page}>
              {notice ? <Notice text={notice} /> : null}
              {error ? <Notice danger text={error} /> : null}
              {selected?.id === linkedId ? (
                <InvitationDetails
                  invitation={selected}
                  role={role}
                  busy={busy}
                  onDecision={setConfirmation}
                  onBooking={id => dispatch(openBooking(id))}
                />
              ) : loading ? (
                <RecordSkeleton />
              ) : (
                <EmptyState
                  title="Invitation unavailable"
                  description="This offer could not be loaded. Please try again."
                />
              )}
              {error ? (
                <Button
                  title="Retry invitation"
                  onPress={() => setAttempt(value => value + 1)}
                />
              ) : null}
            </ScrollView>
            {confirmation ? (
              <ConfirmDialog
                key={confirmation}
                visible
                title={
                  confirmation === 'accept'
                    ? 'Accept this placement?'
                    : confirmation === 'decline'
                    ? 'Decline this invitation?'
                    : 'Cancel this invitation?'
                }
                context={selected?.job.title}
                description={
                  confirmation === 'accept'
                    ? 'This confirms a booking for the offered dates and pay. Please check the terms before continuing.'
                    : 'The offer will no longer be available to accept. This action does not cancel any existing booking.'
                }
                confirmLabel={
                  confirmation === 'accept'
                    ? 'Accept & confirm booking'
                    : confirmation === 'decline'
                    ? 'Decline invitation'
                    : 'Cancel invitation'
                }
                destructive={confirmation !== 'accept'}
                onClose={() => setConfirmation(undefined)}
                onConfirm={() => decide(confirmation)}
              />
            ) : null}
          </SafeAreaView>
        </SafeAreaProvider>
      </Modal>
      <Modal
        visible={resume}
        animationType="slide"
        onRequestClose={() => setResume(false)}
      >
        <SafeAreaProvider>
          <SafeAreaView style={styles.safeArea}>
            <ScrollView
              ref={resumeScroll}
              contentContainerStyle={styles.page}
              keyboardShouldPersistTaps="handled"
            >
              <InvitationForm
                instructorId=""
                name=""
                retryOnly
                onStepChange={() =>
                  resumeScroll.current?.scrollTo({ y: 0, animated: false })
                }
                onClose={() => {
                  setResume(false);
                  setAttempt(value => value + 1);
                  pages.refresh();
                }}
              />
            </ScrollView>
          </SafeAreaView>
        </SafeAreaProvider>
      </Modal>
    </View>
  );
}
