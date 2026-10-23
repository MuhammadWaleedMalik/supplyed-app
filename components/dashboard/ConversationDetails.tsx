import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  Conversation,
  getConversationApplication,
} from '../../constants/conversationsApi';
import type { Invitation } from '../../feature/dashboard/shared/apis/invitationsApi';
import { invitationStatus } from '../../feature/dashboard/shared/apis/invitationsApi';
import type { Application } from '../../feature/dashboard/shared/apis/applicationsApi';
import {
  getBooking,
  Booking,
} from '../../feature/dashboard/shared/apis/bookingsApi';
import {
  getAccessibleJob,
  getMyJob,
  Job,
} from '../../feature/dashboard/shared/apis/jobsApi';
import {
  openBooking,
  openInvitation,
} from '../../feature/dashboard/shared/store/navigationSlice';
import { useAppDispatch } from '../../store/hooks';
import { getSessionVersion } from '../../utils/api/session';
import { displayDate, displayPay } from '../../utils/ui/marketplaceLabels';
import { plannedLabel } from '../../utils/jobs/workSchedule';
import Button from '../Ui/Button';
import DetailHeader from '../Ui/DetailHeader';
import RichText from '../Ui/RichText';
import {
  InfoGrid,
  Notice,
  RecordSection,
  RecordSkeleton,
  StatusBadge,
} from '../Ui/RecordLayout';
import ConversationAvatar from './ConversationAvatar';
import JobRecordDetails from './JobRecordDetails';
import LimitedProfileCard from './LimitedProfileCard';
import { useLimitedProfile } from '../../feature/dashboard/shared/hooks/useLimitedProfile';
import { useChatStyles } from './chatStyles';

export default function ConversationDetails({
  conversation,
  onClose,
  invitation,
}: {
  conversation: Conversation;
  invitation?: Invitation;
  onClose: () => void;
}) {
  const styles = useChatStyles();
  const dispatch = useAppDispatch();
  const profile = useLimitedProfile();
  const [loading, setLoading] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [application, setApplication] = useState<Application>();
  const [job, setJob] = useState<Job>();
  const [booking, setBooking] = useState<Booking>();
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    const version = getSessionVersion();
    setLoading(true);
    setError('');
    Promise.allSettled([
      conversation.applicationId
        ? getConversationApplication(conversation.applicationId)
        : Promise.resolve(undefined),
      invitation
        ? Promise.resolve(invitation.job)
        : conversation.job?.id
        ? conversation.me === 'poster'
          ? getMyJob(conversation.job.id)
          : getAccessibleJob(conversation.job.id)
        : Promise.resolve(undefined),
      conversation.bookingId
        ? getBooking(conversation.bookingId)
        : Promise.resolve(undefined),
    ])
      .then(([appResult, jobResult, bookingResult]) => {
        if (!active || version !== getSessionVersion()) return;
        const app =
          appResult.status === 'fulfilled' ? appResult.value : undefined;
        setApplication(app);
        setBooking(
          bookingResult.status === 'fulfilled'
            ? bookingResult.value
            : undefined,
        );
        const historical = app?.jobDetails
          ? ({
              ...app.jobDetails,
              id: app.jobId,
              title: app.jobName || conversation.job?.title || 'Teaching role',
              postedByUserId: '',
            } as Job)
          : undefined;
        setJob(jobResult.status === 'fulfilled' ? jobResult.value : historical);
        if (
          [appResult, jobResult, bookingResult].some(
            result => result.status === 'rejected',
          )
        )
          setError(
            'Some linked details could not be loaded. Your conversation and available records are still shown.',
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [
    conversation.applicationId,
    conversation.bookingId,
    conversation.job?.id,
    conversation.job?.title,
    conversation.me,
    invitation,
    attempt,
  ]);
  const openProfile = () => {
    if (conversation.counterpart.id) {
      if (conversation.counterpart.role === 'teacher')
        profile.openInstructor(conversation.counterpart.id);
      else profile.openSchool(conversation.counterpart.id);
    }
  };
  return (
    <Modal animationType="slide" onRequestClose={onClose}>
      <SafeAreaProvider>
        <SafeAreaView style={styles.screen}>
          <DetailHeader
            title="Conversation details"
            subtitle="People, placement and shared context"
            onBack={onClose}
            backLabel="Return to conversation"
          />
          <LimitedProfileCard
            profile={profile.profile}
            error={profile.error}
            loading={profile.loading}
            onClose={profile.closeProfile}
          />
          <ScrollView contentContainerStyle={styles.detailContent}>
            <RecordSection title={conversation.counterpart.name}>
              <View style={styles.row}>
                <ConversationAvatar
                  name={conversation.counterpart.name}
                  imageUrl={conversation.counterpart.imageUrl}
                />
                <View style={styles.copy}>
                  <Text style={styles.name}>
                    {conversation.counterpart.role === 'school'
                      ? 'School'
                      : 'Teacher'}
                  </Text>
                  <Text style={styles.muted}>
                    {conversation.job?.title || 'General conversation'}
                  </Text>
                </View>
              </View>
              <Button
                title={
                  conversation.counterpart.role === 'school'
                    ? 'View school profile'
                    : 'View teacher profile'
                }
                variant="outline"
                disabled={!conversation.counterpart.id}
                onPress={openProfile}
              />
            </RecordSection>
            {loading ? <RecordSkeleton /> : null}
            {error ? (
              <>
                <Notice danger text={error} />
                <Button
                  title="Retry linked details"
                  variant="outline"
                  onPress={() => setAttempt(value => value + 1)}
                />
              </>
            ) : null}
            {booking ? (
              <RecordSection
                title="Booked placement"
                action={<StatusBadge status={booking.status} />}
              >
                <InfoGrid
                  items={[
                    { label: 'Starts', value: displayDate(booking.startDate) },
                    { label: 'Ends', value: displayDate(booking.endDate) },
                    {
                      label: 'Agreed pay',
                      value: displayPay(booking.payAmount, booking.payType),
                    },
                    { label: 'Planned work', value: plannedLabel(booking) },
                  ]}
                />
                {booking.cancelReason ? (
                  <Notice danger text={booking.cancelReason} />
                ) : null}
                <Button
                  title="Open booking"
                  variant="outline"
                  onPress={() => {
                    onClose();
                    dispatch(openBooking(booking.id));
                  }}
                />
              </RecordSection>
            ) : null}
            {application ? (
              <RecordSection
                title="Application proposal"
                subtitle={'Applied ' + displayDate(application.createdAt)}
                action={<StatusBadge status={application.status} />}
              >
                <RichText
                  value={application.coverLetter}
                  title="Application proposal"
                />
              </RecordSection>
            ) : null}
            {invitation ? (
              <RecordSection
                title="Invitation"
                action={<StatusBadge status={invitationStatus(invitation)} />}
              >
                <Text style={styles.body}>
                  The invitation contains the offered terms. Accept or decline
                  from the offer itself.
                </Text>
                <Button
                  title="View invitation"
                  onPress={() => {
                    onClose();
                    dispatch(openInvitation(invitation.id));
                  }}
                />
              </RecordSection>
            ) : null}
            {job ? <JobRecordDetails job={job} /> : null}
            <RecordSection title="Privacy & support">
              <Text style={styles.muted}>
                Conversations may be monitored by the SupplyEd team for support
                and safety.{' '}
                {conversation.readOnly
                  ? 'This conversation is read-only; its history and files remain available.'
                  : 'Messages and attachments stay linked to this conversation.'}
              </Text>
            </RecordSection>
          </ScrollView>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}
