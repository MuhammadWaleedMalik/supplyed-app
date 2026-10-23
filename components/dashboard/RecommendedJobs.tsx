import { useForegroundRefresh } from '../../feature/dashboard/shared/hooks/useForegroundRefresh';
import React, { useCallback } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { getRecommendedJobs } from '../../feature/dashboard/shared/apis/matchingApi';
import type { Job } from '../../feature/dashboard/shared/apis/jobsApi';
import { usePagedResource } from '../../feature/dashboard/shared/hooks/usePagedResource';
import Button from '../Ui/Button';
import { useTheme } from '../Ui/theme';
import TeacherJobList from './TeacherJobList';
import { useStyles } from './dashboardStyles';

export default function RecommendedJobs({
  appliedJobIds,
  onApply,
}: {
  appliedJobIds: string[];
  onApply: (job: Job) => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const loader = useCallback(async (page: number) => {
    const result = await getRecommendedJobs(page);
    return {
      items: result.jobs.map(item => ({ ...item, id: item.job.id })),
      page: result.pagination.page,
      hasMore: result.pagination.hasNextPage,
    };
  }, []);
  const resource = usePagedResource(loader);
  useForegroundRefresh(() => {
    if (!resource.loading) resource.refreshLoaded();
  });
  const items = resource.items.filter(item => !appliedJobIds.includes(item.id));
  return (
    <View style={styles.section}>
      <Text style={styles.cardBody}>
        Roles matched to your profile, travel preferences and existing hires.
      </Text>
      {items.length || (!resource.loading && !resource.error) ? (
        <TeacherJobList
          jobs={items.map(item => item.job)}
          matches={Object.fromEntries(items.map(item => [item.id, item.match]))}
          appliedJobIds={appliedJobIds}
          onApply={onApply}
        />
      ) : null}
      {resource.loading ? <ActivityIndicator color={colors.brand} /> : null}
      {resource.error ? (
        <Text accessibilityLiveRegion="polite" style={styles.cardBody}>
          {resource.error} You can still browse All jobs.
        </Text>
      ) : null}
      {resource.error ? (
        <Button
          title="Retry recommendations"
          variant="social"
          onPress={resource.refresh}
          disabled={resource.loading}
        />
      ) : null}
      {resource.hasMore ? (
        <Button
          title="More recommended jobs"
          variant="social"
          onPress={resource.loadMore}
          disabled={resource.loading}
        />
      ) : null}
    </View>
  );
}
