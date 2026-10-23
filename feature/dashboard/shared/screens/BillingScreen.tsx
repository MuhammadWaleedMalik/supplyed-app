import React, { useCallback, useRef, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import Button from '../../../../components/Ui/Button';
import DynamicSelect from '../../../../components/Ui/DynamicSelect';
import Input from '../../../../components/Ui/Input';
import FilterButton from '../../../../components/Ui/FilterButton';
import FilterSheet from '../../../../components/Ui/FilterSheet';
import {
  EmptyState,
  ListFeedback,
  RecordSkeleton,
} from '../../../../components/Ui/RecordLayout';
import InvoiceCard from '../../../../components/dashboard/InvoiceCard';
import AdminInvoiceCreate from '../../../../components/dashboard/AdminInvoiceCreate';
import { useStyles } from '../../../../components/dashboard/dashboardStyles';
import { usePagedResource } from '../hooks/usePagedResource';
import { useForegroundRefresh } from '../hooks/useForegroundRefresh';
import {
  getAdminInvoices,
  getMyInvoices,
  InvoiceFilters,
  InvoiceRole,
} from '../apis/invoicesApi';

export default function BillingScreen({
  role,
  header,
}: {
  role: InvoiceRole;
  header?: React.ReactNode;
}) {
  const styles = useStyles();
  const [status, setStatus] = useState('ALL');
  const [draftStatus, setDraftStatus] = useState('ALL');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [bookingId, setBookingId] = useState('');
  const [instructorId, setInstructorId] = useState('');
  const [institutionId, setInstitutionId] = useState('');
  const [filters, setFilters] = useState<InvoiceFilters>({});
  const scrollStarted = useRef(false);
  const loader = useCallback(
    async (page: number) => {
      const result =
        role === 'ADMIN'
          ? await getAdminInvoices(page, { ...filters, status })
          : await getMyInvoices(page, status);
      return {
        items: result.invoices,
        page,
        hasMore: result.hasNextPage,
        total: result.total,
      };
    },
    [role, status, filters],
  );
  const pages = usePagedResource(loader);
  useForegroundRefresh(() => {
    if (!pages.loading) pages.refreshLoaded();
  });
  const heading = (
    <View style={styles.section}>
      {header}
      <Text style={styles.title}>
        {role === 'ADMIN'
          ? 'Payments & invoices'
          : role === 'INSTRUCTOR'
          ? 'Invoice history'
          : 'Billing'}
      </Text>
      <Text style={styles.cardBody}>
        Track payments and open your invoice documents. Older invoices load as
        you scroll.
      </Text>
      <View style={styles.sectionHead}>
        <Text style={styles.teacherMeta}>
          {pages.total == null
            ? 'Newest first'
            : pages.total + ' invoices · Newest first'}
        </Text>
        <FilterButton
          count={
            (status === 'ALL' ? 0 : 1) +
            Object.values(filters).filter(Boolean).length
          }
          onPress={() => {
            setDraftStatus(status);
            setBookingId(filters.bookingId || '');
            setInstructorId(filters.instructorId || '');
            setInstitutionId(filters.institutionId || '');
            setFiltersOpen(true);
          }}
        />
      </View>
      {role === 'ADMIN' ? (
        <Button
          title={showCreate ? 'Close invoice form' : 'Create invoice'}
          variant="outline"
          onPress={() => setShowCreate(value => !value)}
        />
      ) : null}
      {role === 'ADMIN' && showCreate ? (
        <AdminInvoiceCreate onChanged={pages.refreshLoaded} />
      ) : null}
    </View>
  );
  return (
    <View style={styles.scroll}>
      <FlatList
        data={pages.items}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.page}
        ListHeaderComponent={heading}
        renderItem={({ item }) => (
          <InvoiceCard
            invoice={item}
            role={role}
            onChanged={pages.refreshLoaded}
          />
        )}
        refreshing={pages.loading && pages.items.length > 0}
        onRefresh={pages.refreshLoaded}
        onScrollBeginDrag={() => {
          scrollStarted.current = true;
        }}
        onEndReachedThreshold={0.35}
        onEndReached={() => {
          if (scrollStarted.current && pages.hasMore && !pages.loading) {
            scrollStarted.current = false;
            pages.loadMore();
          }
        }}
        ListEmptyComponent={
          pages.loading ? (
            <RecordSkeleton />
          ) : !pages.error ? (
            <EmptyState
              title="No invoices found"
              description="Invoices for completed bookings appear here. Try another status to see other invoices."
            />
          ) : undefined
        }
        ListFooterComponent={
          <ListFeedback
            loading={pages.loading && pages.items.length > 0}
            error={pages.error}
            hasMore={pages.hasMore}
            onMore={pages.loadMore}
            onRetry={pages.refreshLoaded}
            count={pages.items.length}
          />
        }
      />
      <FilterSheet
        visible={filtersOpen}
        title="Filter invoices"
        onClose={() => setFiltersOpen(false)}
        onReset={() => {
          setBookingId('');
          setInstructorId('');
          setInstitutionId('');
          setDraftStatus('ALL');
        }}
        onApply={() => {
          setFilters({
            bookingId: bookingId.trim(),
            instructorId: instructorId.trim(),
            institutionId: institutionId.trim(),
          });
          setStatus(draftStatus);
          setFiltersOpen(false);
        }}
        applyLabel="Show invoices"
      >
        <DynamicSelect
          name="invoiceStatus"
          label="Invoice status"
          placeholder="All statuses"
          value={draftStatus === 'ALL' ? '' : draftStatus}
          onChange={value => setDraftStatus(value || 'ALL')}
          exclude={role === 'ADMIN' ? [] : ['PENDING']}
        />
        {role === 'ADMIN' ? (
          <>
            <Input
              label="BOOKING ID"
              required={false}
              value={bookingId}
              onChangeText={setBookingId}
            />
            <Input
              label="INSTRUCTOR ID"
              required={false}
              value={instructorId}
              onChangeText={setInstructorId}
            />
            <Input
              label="INSTITUTION ID"
              required={false}
              value={institutionId}
              onChangeText={setInstitutionId}
            />
          </>
        ) : null}
      </FilterSheet>
    </View>
  );
}
