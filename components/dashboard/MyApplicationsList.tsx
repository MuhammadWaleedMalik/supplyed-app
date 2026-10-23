import React, { useRef, useState } from 'react';
import { FlatList, Modal, ScrollView, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import type { TeacherApplication } from '../../feature/dashboard/teacher/store/teacherSlice';
import Button from '../Ui/Button';
import DetailHeader from '../Ui/DetailHeader';
import RichText from '../Ui/RichText';
import {
  EmptyState,
  InfoGrid,
  ListFeedback,
  RecordSection,
  RecordSkeleton,
  StatusBadge,
} from '../Ui/RecordLayout';
import { displayDate, displayPay } from '../../utils/ui/marketplaceLabels';
import { useStyles } from './dashboardStyles';
import ApplicationTimeline from './ApplicationTimeline';
import { useAppDispatch } from '../../store/hooks';
import {
  openBooking,
  openConversation,
  openMessages,
} from '../../feature/dashboard/shared/store/navigationSlice';

type Props = {
  applications: TeacherApplication[];
  onSchool: (id: string) => void;
  header?: React.ReactNode;
  loading?: boolean;
  error?: string;
  hasMore?: boolean;
  onMore?: () => void;
  onRefresh?: () => void;
};
export default function MyApplicationsList({
  applications,
  onSchool,
  header,
  loading = false,
  error = '',
  hasMore = false,
  onMore = () => {},
  onRefresh = () => {},
}: Props) {
  const styles = useStyles();
  const dispatch = useAppDispatch();
  const scrollStarted = useRef(false);
  const [selected, setSelected] = useState<TeacherApplication>();
  const message = (item: TeacherApplication) =>
    dispatch(
      item.conversationId
        ? openConversation(item.conversationId)
        : openMessages(item.id),
    );
  return (
    <View style={styles.scroll}>
      <FlatList
        contentContainerStyle={styles.page}
        data={applications}
        keyExtractor={item => item.id}
        ListHeaderComponent={
          header ? <View style={styles.section}>{header}</View> : undefined
        }
        renderItem={({ item }) => (
          <RecordSection
            title={item.jobName || item.job?.title || 'Teaching role'}
            action={<StatusBadge status={item.status} />}
          >
            <Text style={styles.cardBody}>
              {item.school?.name || 'School application'}
            </Text>
            <InfoGrid
              items={[
                { label: 'Applied', value: displayDate(item.createdAt) },
                { label: 'Location', value: item.job?.city },
              ]}
            />
            <Button
              title="View application"
              variant="outline"
              onPress={() => setSelected(item)}
            />
            <Button
              title="Message school"
              variant="link"
              onPress={() => message(item)}
            />
            {item.bookingId ? (
              <Button
                title="View booking"
                variant="link"
                onPress={() => dispatch(openBooking(item.bookingId!))}
              />
            ) : null}
            <Button
              compact
              title="School profile"
              variant="link"
              onPress={() => onSchool(item.id)}
            />
          </RecordSection>
        )}
        onRefresh={onRefresh}
        refreshing={loading && applications.length > 0}
        onScrollBeginDrag={() => {
          scrollStarted.current = true;
        }}
        onEndReachedThreshold={0.35}
        onEndReached={() => {
          if (scrollStarted.current && hasMore && !loading) {
            scrollStarted.current = false;
            onMore();
          }
        }}
        ListEmptyComponent={
          loading ? (
            <RecordSkeleton />
          ) : !error ? (
            <EmptyState
              title={
                hasMore
                  ? 'No matches on these pages'
                  : 'No matching applications'
              }
              description={
                hasMore
                  ? 'Load more to search older applications.'
                  : 'Try a different filter, or find a role to apply for.'
              }
            />
          ) : undefined
        }
        ListFooterComponent={
          <ListFeedback
            loading={loading && applications.length > 0}
            error={error}
            hasMore={hasMore}
            onMore={onMore}
            onRetry={onRefresh}
            count={applications.length}
          />
        }
      />
      <Modal
        visible={!!selected}
        animationType="slide"
        onRequestClose={() => setSelected(undefined)}
      >
        <SafeAreaProvider>
          <SafeAreaView style={styles.safeArea}>
            <DetailHeader
              title="Your application"
              subtitle="Proposal and progress"
              backLabel="Return to applications"
              onBack={() => setSelected(undefined)}
            />
            {selected ? (
              <ScrollView contentContainerStyle={styles.page}>
                <RecordSection
                  title={
                    selected.jobName || selected.job?.title || 'Application'
                  }
                  action={<StatusBadge status={selected.status} />}
                >
                  <Text style={styles.cardBody}>{selected.school?.name}</Text>
                  <InfoGrid
                    items={[
                      {
                        label: 'Applied',
                        value: displayDate(selected.createdAt),
                      },
                      {
                        label: 'Starts',
                        value: displayDate(selected.job?.startDate),
                      },
                      {
                        label: 'Pay',
                        value: displayPay(
                          selected.job?.payAmount,
                          selected.job?.payType,
                        ),
                      },
                      {
                        label: 'Location',
                        value: [
                          selected.job?.address,
                          selected.job?.city,
                          selected.job?.postalCode,
                        ]
                          .filter(Boolean)
                          .join(', '),
                      },
                    ]}
                  />
                  <Button
                    title="School profile"
                    variant="outline"
                    onPress={() => onSchool(selected.id)}
                  />
                </RecordSection>
                <RecordSection title="Your proposal">
                  <RichText
                    value={selected.coverLetter}
                    title="Application proposal"
                  />
                </RecordSection>
                <RecordSection title="Application activity">
                  <ApplicationTimeline
                    applicationId={selected.id}
                    initiallyOpen
                  />
                </RecordSection>
                <Button
                  title="Message school"
                  onPress={() => message(selected)}
                />
                {selected.bookingId ? (
                  <Button
                    title="View booking"
                    variant="outline"
                    onPress={() => dispatch(openBooking(selected.bookingId!))}
                  />
                ) : null}
              </ScrollView>
            ) : null}
          </SafeAreaView>
        </SafeAreaProvider>
      </Modal>
    </View>
  );
}
