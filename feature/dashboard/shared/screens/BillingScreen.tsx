import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Button from '../../../../components/Ui/Button';
import Input from '../../../../components/Ui/Input';
import InvoiceCard from '../../../../components/dashboard/InvoiceCard';
import AdminInvoiceCreate from '../../../../components/dashboard/AdminInvoiceCreate';
import { styles } from '../../../../components/dashboard/dashboardStyles';
import { jobStyles } from '../../../../components/dashboard/jobStyles';
import {
  getAdminInvoices,
  getMyInvoices,
  Invoice,
  InvoiceFilters,
  InvoiceRole,
} from '../apis/invoicesApi';

type Props = { role: InvoiceRole };

export default function BillingScreen({ role }: Props) {
  const [status, setStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [instructorId, setInstructorId] = useState('');
  const [institutionId, setInstitutionId] = useState('');
  const [filters, setFilters] = useState<InvoiceFilters>({});
  const statuses = role === 'ADMIN'
    ? ['ALL', 'PENDING', 'OPEN', 'PAID', 'VOID', 'UNCOLLECTIBLE']
    : ['ALL', 'OPEN', 'PAID', 'VOID', 'UNCOLLECTIBLE'];

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const reply = role === 'ADMIN'
        ? await getAdminInvoices(page, { ...filters, status })
        : await getMyInvoices(page, status);
      setInvoices(reply.invoices);
      setHasNextPage(reply.hasNextPage);
      return true;
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Unable to load invoices.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [role, page, status, filters]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  function changeStatus(nextStatus: string) {
    setStatus(nextStatus);
    setPage(1);
  }

  function applyFilters() {
    setFilters({ bookingId: bookingId.trim(), instructorId: instructorId.trim(), institutionId: institutionId.trim() });
    setPage(1);
  }

  function clearFilters() {
    setBookingId('');
    setInstructorId('');
    setInstitutionId('');
    setFilters({});
    setStatus('ALL');
    setPage(1);
  }

  return (
    <View style={jobStyles.shell}>
      <View style={jobStyles.progressCopy}>
        <Text style={jobStyles.listTitle}>{role === 'ADMIN' ? 'Payments and invoices' : role === 'INSTRUCTOR' ? 'Earnings invoices' : 'Billing'}</Text>
        <Text style={jobStyles.modeBody}>
          {role === 'INSTRUCTOR' ? 'View invoices, teacher pay, and payment status.' : 'View invoice details, payment status, and invoice documents.'}
        </Text>
      </View>
      {role === 'ADMIN' ? <AdminInvoiceCreate onChanged={loadInvoices} /> : null}
      <View style={styles.badges}>
        {statuses.map(item => (
          <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: status === item, disabled: loading }} disabled={loading} onPress={() => changeStatus(item)} style={[styles.filter, status === item && styles.filterActive]}>
            <Text style={[styles.filterText, status === item && styles.filterTextActive]}>{item}</Text>
          </Pressable>
        ))}
      </View>
      {role === 'ADMIN' ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Filter invoices</Text>
          <Input label="BOOKING ID" placeholder="Optional booking ID" required={false} value={bookingId} onChangeText={setBookingId} disabled={loading} />
          <Input label="INSTRUCTOR ID" placeholder="Optional teacher ID" required={false} value={instructorId} onChangeText={setInstructorId} disabled={loading} />
          <Input label="INSTITUTION ID" placeholder="Optional school ID" required={false} value={institutionId} onChangeText={setInstitutionId} disabled={loading} />
          <Button title="Apply filters" onPress={applyFilters} disabled={loading} compact />
          <Button title="Clear filters" variant="link" onPress={clearFilters} disabled={loading} compact />
        </View>
      ) : null}
      <Button title={loading ? 'Loading invoices...' : 'Refresh invoices'} variant="social" onPress={loadInvoices} disabled={loading} compact />
      {error ? <Text style={jobStyles.error} accessibilityLiveRegion="polite">{error}</Text> : null}
      {!loading && !error && invoices.length === 0 ? (
        <View style={[styles.card, styles.emptyCard]}>
          <Text style={styles.cardTitle}>No invoices found</Text>
          <Text style={styles.cardBody}>Invoices for completed bookings appear here.</Text>
        </View>
      ) : null}
      {invoices.map(invoice => <InvoiceCard key={invoice.id} invoice={invoice} role={role} onChanged={loadInvoices} />)}
      <View style={styles.topActions}>
        <Button title="Previous" variant="social" onPress={() => setPage(page - 1)} disabled={loading || page <= 1} compact />
        <Text style={styles.cardBody}>Page {page}</Text>
        <Button title="Next" variant="social" onPress={() => setPage(page + 1)} disabled={loading || !hasNextPage} compact />
      </View>
    </View>
  );
}
