import React, { useRef, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { createInvoice, getAdminInvoices, Invoice } from '../../feature/dashboard/shared/apis/invoicesApi';
import { ApiError } from '../../utils/api/request';
import { buildAdminInvoiceData } from '../../utils/payments/invoiceValidation';
import Button from '../Ui/Button';
import Input from '../Ui/Input';
import { styles } from './dashboardStyles';
import { jobStyles } from './jobStyles';
import InvoiceCard from './InvoiceCard';

type Props = { onChanged: () => void | Promise<void | boolean> };

export default function AdminInvoiceCreate({ onChanged }: Props) {
  const [bookingId, setBookingId] = useState('');
  const [units, setUnits] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [created, setCreated] = useState<Invoice | null>(null);
  const [busy, setBusy] = useState(false);
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [error, setError] = useState('');
  const working = useRef(false);

  async function refreshExistingInvoice() {
    const reply = await getAdminInvoices(1, { bookingId: bookingId.trim() });
    setCreated(reply.invoices.find(invoice => invoice.status !== 'VOID') || null);
    await onChanged();
  }

  function confirmCreate() {
    try {
      const data = buildAdminInvoiceData(bookingId, units, poNumber);
      Alert.alert('Create booking invoice?', 'Only completed bookings with a ready teacher payout account can be invoiced. SupplyEd calculates the total.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Create invoice', onPress: () => sendInvoice(data) },
      ]);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Check the invoice fields.');
    }
  }

  async function sendInvoice(data: ReturnType<typeof buildAdminInvoiceData>) {
    if (working.current || needsRefresh) return;
    working.current = true;
    setBusy(true);
    setError('');
    try {
      setCreated(await createInvoice(data));
      await onChanged();
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Unable to create invoice.');
      if (!(problem instanceof ApiError) || problem.status === 0 || problem.status === 408 || problem.status === 409 || problem.status >= 500) {
        setNeedsRefresh(true);
        try {
          await refreshExistingInvoice();
        } catch {
          setError('Unable to confirm the invoice. Refresh existing invoices before trying again.');
        }
      }
    } finally {
      working.current = false;
      setBusy(false);
    }
  }

  async function refreshBeforeRetry() {
    if (working.current) return;
    working.current = true;
    setBusy(true);
    setError('');
    try {
      await refreshExistingInvoice();
      setNeedsRefresh(false);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Unable to refresh invoices.');
    } finally {
      working.current = false;
      setBusy(false);
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Create completed booking invoice</Text>
      <Text style={styles.cardBody}>Enter a completed booking ID. For daily or hourly work, enter days or hours worked. Leave units blank for fixed pay.</Text>
      <Input label="COMPLETED BOOKING ID" placeholder="Booking ID" value={bookingId} onChangeText={value => { setBookingId(value); setCreated(null); }} disabled={busy || needsRefresh} />
      <Input label="DAYS OR HOURS WORKED" placeholder="Leave blank for fixed pay" decimal required={false} value={units} onChangeText={setUnits} disabled={busy || needsRefresh} />
      <Input label="PO NUMBER" placeholder="Optional purchase order number" maxLength={100} required={false} value={poNumber} onChangeText={setPoNumber} disabled={busy || needsRefresh} />
      <Button title={busy ? 'Please wait...' : 'Create invoice'} onPress={confirmCreate} disabled={busy || needsRefresh || Boolean(created)} compact />
      {needsRefresh ? <Button title="Refresh existing invoices before retry" variant="social" onPress={refreshBeforeRetry} disabled={busy} compact /> : null}
      {error ? <Text style={jobStyles.error} accessibilityLiveRegion="polite">{error}</Text> : null}
      {created ? <InvoiceCard key={created.id} invoice={created} role="ADMIN" onChanged={onChanged} /> : null}
    </View>
  );
}
