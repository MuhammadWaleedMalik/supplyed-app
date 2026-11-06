import React, { useState } from 'react';
import { Text, View } from 'react-native';
import type { Invitation } from '../../feature/dashboard/shared/apis/invitationsApi';
import { invitationStatus } from '../../feature/dashboard/shared/apis/invitationsApi';
import { displayPay } from '../../utils/ui/marketplaceLabels';
import { plannedLabel } from '../../utils/jobs/workSchedule';
import { invitationDate } from './InvitationReview';
import RichText from '../Ui/RichText';
import ContentPreview from '../Ui/ContentPreview';
import Button from '../Ui/Button';
import { InfoGrid, RecordSection, StatusBadge } from '../Ui/RecordLayout';
import { useStyles } from './dashboardStyles';
import TeacherProfileSummary from './TeacherProfileSummary';
import LimitedProfileCard from './LimitedProfileCard';
import { useLimitedProfile } from '../../feature/dashboard/shared/hooks/useLimitedProfile';
import {
  checkJobAvailability,
  JobAvailability,
} from '../../feature/dashboard/teacher/apis/availabilityApi';
import { getSessionVersion } from '../../utils/api/session';

type Props = {
  invitation: Invitation;
  role: 'school' | 'teacher';
  busy: boolean;
  onDecision: (action: 'accept' | 'decline' | 'cancel') => void;
  onBooking: (id: string) => void;
};
export default function InvitationDetails({
  invitation,
  role,
  busy,
  onDecision,
  onBooking,
}: Props) {
  const styles = useStyles();
  const profile = useLimitedProfile();
  const job = invitation.job;
  const state = invitationStatus(invitation);
  const offerAvailable = invitation.isExclusive
    ? invitation.jobStatus === 'RESERVED'
    : invitation.jobType === 'INSTANT' && invitation.jobStatus === 'ACTIVE';
  const canAccept =
    state === 'PENDING' &&
    offerAvailable &&
    Boolean(job.startDate) &&
    Date.parse(job.startDate || '') > Date.now();
  const [availability, setAvailability] = useState<JobAvailability>();
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState('');
  async function checkAvailability() {
    const version = getSessionVersion();
    setCheckingAvailability(true);
    setAvailabilityError('');
    try {
      const result = await checkJobAvailability(invitation.job.id);
      if (version === getSessionVersion()) setAvailability(result);
    } catch (problem) {
      if (version === getSessionVersion())
        setAvailabilityError(
          problem instanceof Error
            ? problem.message
            : 'Unable to check availability.',
        );
    } finally {
      if (version === getSessionVersion()) setCheckingAvailability(false);
    }
  }
  return (
    <View style={styles.section}>
      <LimitedProfileCard
        profile={profile.profile}
        loading={profile.loading}
        error={profile.error}
        onClose={profile.closeProfile}
      />
      <RecordSection title={job.title} action={<StatusBadge status={state} />}>
        <Text style={styles.teacherMeta}>JOB INVITATION</Text>
        <Text style={styles.cardBody}>
          Job status: {invitation.jobStatus}.{' '}
          {invitation.isExclusive
            ? 'This legacy invitation reserves the job exclusively until it is decided.'
            : 'The position remains open. The first valid acceptance or school hire fills it.'}
        </Text>
        {role === 'school' ? (
          <TeacherProfileSummary compact teacherId={invitation.instructor.id} />
        ) : (
          <>
            <Text style={styles.cardTitle}>{invitation.institution.name}</Text>
            <Button
              title="View school profile"
              variant="outline"
              onPress={() => profile.openSchool(invitation.institution.id)}
            />
          </>
        )}
        <InfoGrid
          items={[
            {
              label: 'Offered pay',
              value: displayPay(job.payAmount, job.payType),
            },
            {
              label: 'Response deadline',
              value: invitationDate(invitation.expiresAt),
            },
          ]}
        />
      </RecordSection>
      <RecordSection
        title="Placement details"
        subtitle="Your offered dates and pay · UK time"
      >
        <InfoGrid
          items={[
            { label: 'Starts', value: invitationDate(job.startDate) },
            { label: 'Ends', value: invitationDate(job.endDate) },
            { label: 'Planned work', value: plannedLabel(job) },
            {
              label: 'Location',
              value: [job.address, job.city, job.county, job.postalCode]
                .filter(Boolean)
                .join(', '),
            },
          ]}
        />
      </RecordSection>
      <RecordSection title="About the role">
        <InfoGrid
          items={[
            {
              label: 'Subjects',
              value: job.subjects?.join(', ') || job.subject,
            },
            { label: 'Key stages', value: job.keyStages?.join(', ') },
            { label: 'Skills', value: job.requiredSkills?.join(', ') },
          ]}
        />
        <RichText
          value={job.description}
          title="Role description"
          emptyText="No role description provided."
        />
        {job.parkingInfo ? (
          <ContentPreview text={job.parkingInfo} title="Parking information" />
        ) : null}
      </RecordSection>
      {invitation.message ? (
        <RecordSection title="School's invitation message">
          <ContentPreview
            text={invitation.message}
            title="Invitation message"
          />
        </RecordSection>
      ) : null}
      {state === 'PENDING' ? (
        <RecordSection
          title={role === 'teacher' ? 'Your next step' : 'Awaiting a response'}
          subtitle={
            role === 'teacher'
              ? 'Review the terms before responding. Accepting creates a confirmed booking.'
              : 'The teacher can respond until the deadline above.'
          }
        >
          {role === 'teacher' ? (
            <>
              <Button
                title={
                  checkingAvailability
                    ? 'Checking availability...'
                    : 'Check availability for this offer'
                }
                variant="social"
                disabled={busy || checkingAvailability}
                onPress={checkAvailability}
              />
              {availability ? (
                <Text style={styles.teacherMeta}>
                  {availability.available
                    ? 'No availability clash found for this offer.'
                    : 'This offer conflicts with your availability or a confirmed booking.'}
                </Text>
              ) : null}
              {availabilityError ? (
                <Text accessibilityRole="alert" style={styles.cardBody}>
                  {availabilityError}
                </Text>
              ) : null}
              <Button
                title="Accept invitation"
                disabled={
                  busy || !canAccept || availability?.available === false
                }
                onPress={() => onDecision('accept')}
              />
              <Button
                title="Decline invitation"
                variant="outline"
                disabled={busy}
                onPress={() => onDecision('decline')}
              />
            </>
          ) : (
            <Button
              title="Cancel invitation"
              variant="outline"
              disabled={busy}
              onPress={() => onDecision('cancel')}
            />
          )}
        </RecordSection>
      ) : null}
      {invitation.bookingId ? (
        <Button
          title="View confirmed booking"
          onPress={() => onBooking(invitation.bookingId!)}
        />
      ) : null}
    </View>
  );
}
