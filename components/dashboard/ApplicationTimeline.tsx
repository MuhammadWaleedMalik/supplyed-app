import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { getApplicationHistory } from '../../feature/dashboard/shared/apis/applicationsApi';
import { usePagedResource } from '../../feature/dashboard/shared/hooks/usePagedResource';
import { displayDate, statusLabel } from '../../utils/ui/marketplaceLabels';
import Button from '../Ui/Button';
import { useTheme } from '../Ui/theme';
import { useStyles } from './dashboardStyles';

export default function ApplicationTimeline({
  applicationId,
  initiallyOpen = false,
}: {
  applicationId: string;
  initiallyOpen?: boolean;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [open, setOpen] = useState(initiallyOpen);
  const loader = useCallback(
    async (page: number) => {
      const result = await getApplicationHistory(applicationId, page);
      return {
        items: result.history,
        page: result.pagination.page,
        hasMore: result.pagination.hasNextPage,
      };
    },
    [applicationId],
  );
  const history = usePagedResource(loader, open);
  return (
    <View style={styles.section}>
      <Button
        title={open ? 'Hide application history' : 'View application history'}
        variant="link"
        compact
        onPress={() => setOpen(value => !value)}
      />
      {open ? (
        <>
          {history.items.map(item => (
            <View key={item.id}>
              <Text style={styles.cardTitle}>
                {item.fromStatus ? statusLabel(item.fromStatus) + ' → ' : ''}
                {statusLabel(item.toStatus)}
              </Text>
              <Text style={styles.teacherMeta}>
                {displayDate(item.createdAt)} ·{' '}
                {new Date(item.createdAt).toLocaleTimeString('en-GB', {
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: 'Europe/London',
                })}{' '}
                (UK time)
              </Text>
            </View>
          ))}
          {history.loading ? <ActivityIndicator color={colors.brand} /> : null}
          {!history.loading && !history.error && !history.items.length ? (
            <Text style={styles.cardBody}>No recorded updates yet.</Text>
          ) : null}
          {history.error ? (
            <>
              <Text accessibilityLiveRegion="polite" style={styles.cardBody}>
                {history.error}
              </Text>
              <Button
                title="Retry history"
                variant="link"
                onPress={history.refresh}
              />
            </>
          ) : null}
          {history.hasMore ? (
            <Button
              title="More updates"
              variant="social"
              disabled={history.loading}
              onPress={history.loadMore}
            />
          ) : null}
        </>
      ) : null}
    </View>
  );
}
