import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { getReviewsPage } from '../../feature/dashboard/shared/apis/reviewsApi';
import { usePagedResource } from '../../feature/dashboard/shared/hooks/usePagedResource';
import { displayDate } from '../../utils/ui/marketplaceLabels';
import Button from '../Ui/Button';
import { useTheme } from '../Ui/theme';
import { useStyles } from './dashboardStyles';

export default function ReviewHistory({
  id,
  type,
}: {
  id: string;
  type: 'instructor' | 'institution';
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const loader = useCallback(
    async (page: number) => {
      const result = await getReviewsPage(type, id, page);
      return {
        items: result.reviews,
        page: result.pagination.page,
        hasMore: result.pagination.hasNextPage,
        total: result.pagination.total,
      };
    },
    [id, type],
  );
  const reviews = usePagedResource(loader, open);
  return (
    <View style={styles.section}>
      <Button
        title={open ? 'Hide reviews' : 'Read reviews'}
        variant="social"
        onPress={() => setOpen(value => !value)}
      />
      {open ? (
        <>
          {reviews.total != null ? (
            <Text accessibilityLiveRegion="polite" style={styles.cardTitle}>
              {reviews.total ? `${reviews.total} reviews` : 'No reviews yet'}
            </Text>
          ) : null}
          {reviews.items.map(review => (
            <View key={review.id} style={styles.card}>
              <Text style={styles.cardTitle}>{review.rating}/5</Text>
              <Text style={styles.teacherMeta}>
                {review.reviewerName || 'Marketplace member'} ·{' '}
                {displayDate(review.createdAt)}
              </Text>
              <Text style={styles.cardBody}>
                {review.jobTitle || 'Completed booking'}
              </Text>
              <Text style={styles.cardBody}>
                {review.comment || 'Rating provided without a comment.'}
              </Text>
            </View>
          ))}
          {reviews.loading ? <ActivityIndicator color={colors.brand} /> : null}
          {reviews.error ? (
            <>
              <Text style={styles.cardBody} accessibilityLiveRegion="polite">
                {reviews.error}
              </Text>
              <Button
                title="Retry reviews"
                variant="link"
                onPress={reviews.refresh}
              />
            </>
          ) : null}
          {reviews.hasMore ? (
            <Button
              title="More reviews"
              variant="social"
              disabled={reviews.loading}
              onPress={reviews.loadMore}
            />
          ) : null}
        </>
      ) : null}
    </View>
  );
}
