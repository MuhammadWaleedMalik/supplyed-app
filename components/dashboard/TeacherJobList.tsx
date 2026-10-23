import { plannedLabel } from '../../utils/jobs/workSchedule';
import { useTheme } from '../Ui/theme';
import { useInvitationTags } from '../../feature/dashboard/shared/hooks/useInvitationTags';
import { listingStatus } from '../../utils/jobs/londonTime';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import type { Job } from '../../feature/dashboard/shared/apis/jobsApi';
import {
  getJobMatch,
  type MatchScore,
} from '../../feature/dashboard/shared/apis/matchingApi';
import {
  displayDate,
  displayPay,
  statusLabel,
} from '../../utils/ui/marketplaceLabels';
import { getSessionVersion } from '../../utils/api/session';
import Button from '../Ui/Button';
import RichText from '../Ui/RichText';
import ContentPreview from '../Ui/ContentPreview';
import LimitedProfileCard from './LimitedProfileCard';
import { useLimitedProfile } from '../../feature/dashboard/shared/hooks/useLimitedProfile';
import MatchExplanation from './MatchExplanation';
import { useStyles } from './dashboardStyles';

type Props = {
  jobs: Job[];
  appliedJobIds: string[];
  onApply: (job: Job) => void;
  matches?: Record<string, MatchScore>;
};

function JobCard({
  job,
  applied,
  onApply,
  initialMatch,
  invited,
}: {
  job: Job;
  applied: boolean;
  onApply: (job: Job) => void;
  initialMatch?: MatchScore;
  invited: boolean;
}) {
  const styles = useStyles();
  const { urgentBanner } = useTheme();
  const profile = useLimitedProfile();
  const [expanded, setExpanded] = useState(false);
  const [match, setMatch] = useState(initialMatch);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const unavailable = Boolean(listingStatus(job) !== 'LIVE');
  async function checkMatch() {
    const version = getSessionVersion();
    setLoading(true);
    setError('');
    try {
      const result = await getJobMatch(job.id);
      if (version === getSessionVersion()) setMatch(result);
    } catch (problem) {
      if (version === getSessionVersion())
        setError(
          problem instanceof Error ? problem.message : 'Unable to check match.',
        );
    } finally {
      setLoading(false);
    }
  }
  return (
    <View style={styles.card}>
      <LimitedProfileCard profile={profile.profile} loading={profile.loading} error={profile.error} onClose={profile.closeProfile} />
      <Text style={styles.cardTitle}>{job.title}</Text>
      {urgentBanner &&
      job.description?.includes('Marked urgent by the hiring account.') ? (
        <Text style={styles.teacherMeta}>Urgent cover requested</Text>
      ) : null}
      {invited ? <Text style={styles.teacherMeta}>Invited</Text> : null}
      <Text style={styles.cardBody}>
        {job.institution?.name || 'School not provided'} ·{' '}
        {statusLabel(listingStatus(job))}
      </Text>
      <Text style={styles.cardTitle}>
        {displayPay(job.payAmount, job.payType)}
      </Text>
      <Text style={styles.cardBody}>
        {[job.city, job.county].filter(Boolean).join(', ') ||
          'Location not provided'}
      </Text>
      <Text style={styles.cardBody}>
        {displayDate(job.startDate)} to {displayDate(job.endDate)}
      </Text>
      <Text style={styles.teacherMeta}>
        {job.subjects?.join(', ') || job.subject || 'Subject not provided'} ·{' '}
        {job.keyStages?.join(', ') || 'Key stage not provided'}
      </Text>
      <Button
        title={expanded ? 'Hide details' : 'View role details'}
        variant="link"
        compact
        onPress={() => setExpanded(value => !value)}
      />
      {expanded ? (
        <>
          <Text style={styles.teacherMeta}>
            Closing date: {displayDate(job.expiresAt)}
          </Text>
          {job.payType !== 'fixed' ? (
            <Text style={styles.cardBody}>{plannedLabel(job)}</Text>
          ) : null}
          <RichText value={job.description} style={styles.cardBody} />
          <ContentPreview title="Job address" text={[job.address, job.city, job.county, job.postalCode].filter(Boolean).join(', ') || 'Address not provided'} threshold={90} lines={2} style={styles.cardBody} />
          <Text style={styles.cardBody}>
            Skills: {job.requiredSkills?.join(', ') || 'Not provided'}
          </Text>
          <Text style={styles.cardBody}>
            Minimum experience:{' '}
            {job.minExperienceYears == null
              ? 'Not provided'
              : `${job.minExperienceYears} years`}
          </Text>
          <ContentPreview title="Parking information" text={job.parkingInfo || 'Parking information not provided'} style={styles.cardBody} />
          {job.institution?.id ? <Button title="View school profile" variant="outline" onPress={() => profile.openSchool(job.institution!.id)} /> : null}
          {!match ? (
            <Button
              title={loading ? 'Checking match...' : 'Check my match'}
              variant="social"
              disabled={loading}
              onPress={checkMatch}
            />
          ) : null}
          {error ? (
            <Text accessibilityLiveRegion="polite" style={styles.cardBody}>
              {error}
            </Text>
          ) : null}
        </>
      ) : null}
      {match && expanded ? <MatchExplanation match={match} /> : null}
      {match && !expanded ? (
        <Text style={styles.teacherMeta}>
          Match details available in role details
        </Text>
      ) : null}
      <Button
        title={
          applied
            ? 'Already applied'
            : unavailable
            ? 'Job unavailable'
            : 'Apply for this role'
        }
        disabled={applied || unavailable}
        onPress={() => onApply(job)}
      />
    </View>
  );
}

export default function TeacherJobList({
  jobs,
  appliedJobIds,
  onApply,
  matches,
}: Props) {
  const styles = useStyles();
  const invitations = useInvitationTags();
  if (!jobs.length)
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>No matching jobs</Text>
        <Text style={styles.cardBody}>Try All jobs or clear your filters.</Text>
      </View>
    );
  return (
    <View style={styles.section}>
      {invitations.error ? (
        <Text style={styles.cardBody}>{invitations.error}</Text>
      ) : null}
      {jobs.map(job => (
        <JobCard
          key={job.id}
          job={job}
          applied={appliedJobIds.includes(job.id)}
          invited={!!invitations.items?.some(item => item.job.id === job.id)}
          onApply={onApply}
          initialMatch={matches?.[job.id]}
        />
      ))}
    </View>
  );
}
