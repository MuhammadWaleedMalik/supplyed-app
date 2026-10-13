import React, { useRef } from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import JobFilterBar from '../../../../components/dashboard/JobFilterBar';
import { useStyles } from '../../../../components/dashboard/dashboardStyles';
import { useJobStyles } from '../../../../components/dashboard/jobStyles';
import { useTheme } from '../../../../components/Ui/theme';
import type { Job } from '../../shared/apis/jobsApi';
import { useSchoolJobHistory } from '../hooks/useSchoolJobHistory';

const HISTORY_FILTERS = ['ALL', 'CLOSED', 'EXPIRED', 'SUSPENDED'] as const;

function statusLabel(status?: string) {
  return status === 'CLOSED' ? 'CLOSED / COMPLETED' : status || 'CLOSED';
}

function JobHistoryCard({ job }: { job: Job }) {
  const styles = useStyles();
  const jobStyles = useJobStyles();

  const location = [job.address, job.city, job.county, job.postalCode]
    .filter(Boolean)
    .join(', ');
  const dateRange = [job.startDate?.slice(0, 10), job.endDate?.slice(0, 10)]
    .filter(Boolean)
    .join(' to ');

  return (
    <View style={styles.card}>
      <View style={jobStyles.listHeader}>
        <Text style={styles.cardTitle}>{job.title}</Text>
        <View style={jobStyles.statusBadge}>
          <Text style={jobStyles.statusText}>{statusLabel(job.status)}</Text>
        </View>
      </View>
      <Text style={styles.cardBody}>
        {job.subject || 'General teaching role'}
      </Text>
      {job.description ? (
        <Text numberOfLines={3} style={styles.cardBody}>
          {job.description}
        </Text>
      ) : null}
      <Text style={styles.cardBody}>{location || 'Location not provided'}</Text>
      <Text style={styles.cardBody}>{dateRange || 'Dates not provided'}</Text>
      <Text style={styles.cardBody}>
        {job.payAmount != null
          ? `GBP ${job.payAmount.toFixed(2)} / ${job.payType || 'booking'}`
          : 'Pay not specified'}
      </Text>
    </View>
  );
}

export default function SchoolJobHistoryScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const jobStyles = useJobStyles();

  const history = useSchoolJobHistory();
  const scrollStarted = useRef(false);

  return (
    <FlatList
      style={styles.scroll}
      contentContainerStyle={styles.page}
      data={history.jobs}
      keyExtractor={job => job.id}
      renderItem={({ item }) => <JobHistoryCard job={item} />}
      keyboardShouldPersistTaps="handled"
      onScrollBeginDrag={() => {
        scrollStarted.current = true;
      }}
      onEndReachedThreshold={0.35}
      onEndReached={() => {
        if (!scrollStarted.current) return;
        scrollStarted.current = false;
        history.loadMore();
      }}
      refreshing={history.loading && history.jobs.length > 0}
      onRefresh={history.refresh}
      ListHeaderComponent={
        <View style={jobStyles.shell}>
          <View style={jobStyles.titleCopy}>
            <Text style={jobStyles.listTitle}>Job history</Text>
            <Text style={jobStyles.modeBody}>
              Closed or completed, expired, and suspended jobs posted by your
              school.
            </Text>
          </View>
          <JobFilterBar
            search={history.search}
            onSearch={history.setSearch}
            status={history.status}
            onStatus={history.setStatus}
            statuses={HISTORY_FILTERS}
          />
        </View>
      }
      ListEmptyComponent={
        history.loading ? (
          <ActivityIndicator color={colors.brand} />
        ) : (
          <View style={[styles.card, styles.emptyCard]}>
            <Text style={styles.cardTitle}>No historical jobs found</Text>
            <Text style={[styles.cardBody, styles.centerText]}>
              Change the search or status filter to see other historical jobs.
            </Text>
          </View>
        )
      }
      ListFooterComponent={
        <View>
          {history.loadingMore ? (
            <ActivityIndicator color={colors.brand} />
          ) : null}
          {history.error ? (
            <Text style={styles.cardBody} accessibilityLiveRegion="polite">
              {history.error}
            </Text>
          ) : null}
          {history.jobs.length && !history.hasMore && !history.loading ? (
            <Text style={[styles.cardBody, styles.centerText]}>
              All matching historical jobs are loaded.
            </Text>
          ) : null}
        </View>
      }
    />
  );
}
