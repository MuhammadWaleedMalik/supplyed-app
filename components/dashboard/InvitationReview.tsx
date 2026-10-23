import React from 'react';
import { Text, View } from 'react-native';
import type { Job } from '../../feature/dashboard/shared/apis/jobsApi';
import { createThemedStyles } from '../Ui/theme';
import RichText from '../Ui/RichText';

export type InvitationTerms = Pick<
  Job,
  | 'title'
  | 'description'
  | 'subjects'
  | 'requiredSkills'
  | 'keyStages'
  | 'startDate'
  | 'endDate'
  | 'payAmount'
  | 'payType'
  | 'hours'
  | 'days'
  | 'address'
  | 'city'
  | 'county'
  | 'postalCode'
  | 'liveFrom'
  | 'expiresAt'
> & { otherSubjects?: string[]; otherSkills?: string[] };

export function invitationDate(
  value?: string | null,
  timezone = 'Europe/London',
) {
  if (!value || !Number.isFinite(Date.parse(value))) return 'Not provided';
  return new Date(value).toLocaleString('en-GB', {
    timeZone: timezone,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(!/^\d{4}-\d{2}-\d{2}$/.test(value)
      ? { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' }
      : {}),
  });
}

function teachingNames(values?: string[], other?: string[]) {
  return [
    ...(values || []).filter(value => value.toLowerCase() !== 'other'),
    ...(other || []),
  ].join(', ');
}

export default function InvitationReview({
  job,
  isNew,
  message,
  expiresAt,
  timezone = 'Europe/London',
  compact = false,
}: {
  job: InvitationTerms;
  isNew: boolean;
  message?: string;
  expiresAt?: string;
  timezone?: string;
  compact?: boolean;
}) {
  const styles = useStyles();
  const planned =
    job.payType === 'hourly' && job.hours != null
      ? `${job.hours} planned hours`
      : job.payType === 'daily' && job.days != null
      ? `${job.days} planned days`
      : '';
  const payBasis =
    job.payType === 'hourly'
      ? 'per hour'
      : job.payType === 'daily'
      ? 'per day'
      : 'fixed';

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>{isNew ? 'New job' : 'Existing job'}</Text>
      <Text style={styles.title}>{job.title}</Text>
      <Text style={styles.pay}>
        GBP {job.payAmount?.toLocaleString('en-GB')} {payBasis}
      </Text>
      {planned ? <Text style={styles.body}>{planned}</Text> : null}
      <Detail label="Starts" value={invitationDate(job.startDate, timezone)} />
      <Detail label="Ends" value={invitationDate(job.endDate, timezone)} />
      <Detail
        label="Location"
        value={
          [job.address, job.city, job.county, job.postalCode]
            .filter(Boolean)
            .join(', ') || 'Not provided'
        }
      />
      {!compact ? (
        <>
          <Detail
            label="Subjects"
            value={teachingNames(job.subjects, job.otherSubjects)}
          />
          <Detail
            label="Skills"
            value={teachingNames(job.requiredSkills, job.otherSkills)}
          />
          <Detail label="Key stages" value={job.keyStages?.join(', ')} />
          {job.description ? <RichText value={job.description} /> : null}
          {isNew && job.liveFrom ? (
            <Detail
              label="Listing opens"
              value={invitationDate(job.liveFrom)}
            />
          ) : null}
          {job.expiresAt ? (
            <Detail
              label="Listing closes"
              value={invitationDate(job.expiresAt)}
            />
          ) : null}
          {message ? <Detail label="Your message" value={message} /> : null}
          <Detail
            label="Response deadline"
            value={
              expiresAt
                ? invitationDate(expiresAt, timezone)
                : 'Up to seven days, ending earlier if the job starts or its listing closes.'
            }
          />
        </>
      ) : null}
    </View>
  );
}

function Detail({ label, value }: { label: string; value?: string }) {
  const styles = useStyles();
  if (!value) return null;
  return (
    <View style={styles.detail}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.body}>{value}</Text>
    </View>
  );
}

const useStyles = createThemedStyles(colors => ({
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 18,
    gap: 12,
  },
  eyebrow: { color: colors.brandDark, fontSize: 12, fontWeight: '700' },
  title: { color: colors.ink, fontSize: 20, fontWeight: '700', lineHeight: 27 },
  pay: { color: colors.brandDark, fontSize: 20, fontWeight: '700' },
  detail: { gap: 3 },
  label: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  body: { color: colors.ink, fontSize: 14, lineHeight: 21 },
}));
