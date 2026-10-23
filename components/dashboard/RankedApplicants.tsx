import React, { useCallback } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { getRankedApplications } from '../../feature/dashboard/shared/apis/matchingApi';
import type { SchoolApplication } from '../../feature/dashboard/school/store/schoolSlice';
import type { Job } from '../../feature/dashboard/shared/apis/jobsApi';
import { usePagedResource } from '../../feature/dashboard/shared/hooks/usePagedResource';
import { statusLabel } from '../../utils/ui/marketplaceLabels';
import Button from '../Ui/Button';
import RichText from '../Ui/RichText';
import { useTheme } from '../Ui/theme';
import MatchExplanation from './MatchExplanation';
import { useStyles } from './dashboardStyles';
import { useAppSelector } from '../../store/hooks';

export default function RankedApplicants({
  job,
  onOpen,
}: {
  job: Job;
  onOpen: (item: SchoolApplication) => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const revision = useAppSelector(state =>
    state.schoolDashboard.applications
      .filter(item => item.jobId === job.id)
      .map(item => `${item.id}:${item.status}`)
      .join('|'),
  );
  const loader = useCallback(
    async (page: number) => {
      const result = await getRankedApplications(job.id, page);
      return {
        items: result.applications.map(item => ({
          ...item,
          id: item.application.id,
        })),
        page: result.pagination.page,
        total: result.pagination.total,
        hasMore: result.pagination.hasNextPage,
      };
    },
    [job.id],
  );
  const resource = usePagedResource(loader, true, revision);
  return (
    <View style={styles.section}>
      <Text style={styles.cardBody}>
        Best matches for {job.title}. Every applicant remains eligible for your
        review; scores do not make hiring decisions.
      </Text>
      {resource.total != null ? (
        <Text style={styles.teacherMeta} accessibilityLiveRegion="polite">
          {resource.total} applicants · {resource.items.length} loaded
        </Text>
      ) : null}
      {resource.items.map(item => (
        <View key={item.id} style={styles.card}>
          <Text style={styles.cardTitle}>{item.instructor.fullName}</Text>
          <Text style={styles.cardBody}>
            {statusLabel(item.application.status)} ·{' '}
            {item.instructor.experience == null
              ? 'Experience unknown'
              : `${item.instructor.experience} years experience`}
          </Text>
          <Text style={styles.teacherMeta}>
            {item.instructor.subjects.join(', ') || 'Subjects not provided'} ·{' '}
            {item.instructor.keyStages.join(', ') || 'Key stages not provided'}
          </Text>
          <Text style={styles.teacherMeta}>
            {item.instructor.ratingCount > 0
              ? `${item.instructor.ratingAverage.toFixed(1)}/5 from ${
                  item.instructor.ratingCount
                } reviews`
              : 'No reviews yet'}
          </Text>
          {item.instructor.dbsVerified ? (
            <Text style={styles.teacherMeta}>DBS verified</Text>
          ) : null}
          <RichText
            value={item.application.coverLetter}
            numberOfLines={3}
            style={styles.cardBody}
          />
          <MatchExplanation match={item.match} />
          <Button
            title="Open application"
            onPress={() => onOpen({ ...item.application, job })}
          />
        </View>
      ))}
      {!resource.loading && !resource.error && !resource.items.length ? (
        <Text style={styles.cardBody}>No applications for this job yet.</Text>
      ) : null}
      {resource.loading ? <ActivityIndicator color={colors.brand} /> : null}
      {resource.error ? (
        <>
          <Text accessibilityLiveRegion="polite" style={styles.cardBody}>
            {resource.error}
          </Text>
          <Button
            title="Retry applicants"
            variant="social"
            onPress={resource.refresh}
          />
        </>
      ) : null}
      {resource.hasMore ? (
        <Button
          title="Load more applicants"
          variant="social"
          disabled={resource.loading}
          onPress={resource.loadMore}
        />
      ) : null}
    </View>
  );
}
