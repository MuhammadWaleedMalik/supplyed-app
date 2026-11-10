import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import ContentPreview from '../Ui/ContentPreview';
import {
  getInstitutionJobsPage,
  type Job,
} from '../../feature/dashboard/shared/apis/jobsApi';
import {
  getSessionVersion,
} from '../../utils/api/session';
import { plannedLabel } from '../../utils/jobs/workSchedule';
import {
  displayDate,
  displayPay,
} from '../../utils/ui/marketplaceLabels';
import Button from '../Ui/Button';
import { createThemedStyles } from '../Ui/theme';

export default function InstitutionJobsSection({
  institutionId,
}: {
  institutionId: string;
}) {
  const styles = useStyles();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState<number>();
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const running = useRef(false);

  const load = useCallback(
    async (nextPage: number, replace = false) => {
      if (running.current) return;
      running.current = true;
      const version = getSessionVersion();
      setLoading(true);
      setError('');
      try {
        const result = await getInstitutionJobsPage(institutionId, nextPage);
        if (version !== getSessionVersion()) return;
        setJobs(current => {
          const source = replace ? [] : current;
          return Array.from(
            new Map([...source, ...result.jobs].map(job => [job.id, job])).values(),
          );
        });
        setPage(result.page);
        setHasMore(result.hasNextPage);
        setTotal(result.total);
      } catch (problem) {
        if (version === getSessionVersion())
          setError(
            problem instanceof Error
              ? problem.message
              : 'Unable to load this school’s active roles.',
          );
      } finally {
        running.current = false;
        if (version === getSessionVersion()) setLoading(false);
      }
    },
    [institutionId],
  );

  useEffect(() => {
    setJobs([]);
    setPage(0);
    setHasMore(true);
    setTotal(undefined);
    load(1, true);
  }, [load]);

  return (
    <View style={styles.list}>
      {typeof total === 'number' ? (
        <Text style={styles.meta}>
          {total} active role{total === 1 ? '' : 's'}
        </Text>
      ) : null}
      {jobs.map(job => (
        <View key={job.id} style={styles.job}>
          <ContentPreview title="Job title" text={job.title} style={styles.title} lines={3} />
          <Text style={styles.body}>
            {displayPay(job.payAmount, job.payType)} ·{' '}
            {[job.city, job.county].filter(Boolean).join(', ') ||
              'Location not provided'}
          </Text>
          <Text style={styles.body}>
            {displayDate(job.startDate)} to {displayDate(job.endDate)}
          </Text>
          <Text style={styles.meta}>
            {job.subjects?.join(', ') || job.subject || 'Subject not provided'}
            {job.payType === 'fixed' ? '' : ` · ${plannedLabel(job)}`}
          </Text>
        </View>
      ))}
      {!jobs.length && !loading && !error ? (
        <Text style={styles.body}>This school has no active roles.</Text>
      ) : null}
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
      {error ? (
        <Button title="Retry roles" variant="outline" onPress={() => load(page || 1, page === 0)} />
      ) : hasMore ? (
        <Button
          title={loading ? 'Loading roles...' : 'Load more roles'}
          variant="link"
          disabled={loading}
          onPress={() => load(page + 1)}
        />
      ) : jobs.length ? (
        <Text style={styles.meta}>All active roles loaded.</Text>
      ) : null}
    </View>
  );
}

const useStyles = createThemedStyles(colors => ({
  list: { gap: 12 },
  job: {
    gap: 5,
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingTop: 14,
  },
  title: { color: colors.ink, fontSize: 14, lineHeight: 21, fontWeight: '700' },
  body: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  meta: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  error: { color: '#b42318', fontSize: 13, lineHeight: 20 },
}));
