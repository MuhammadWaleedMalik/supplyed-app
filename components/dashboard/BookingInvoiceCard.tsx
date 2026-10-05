import React, { useEffect, useRef, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import type { Booking } from '../../feature/dashboard/shared/apis/bookingsApi';
import { BookingInvoice, createInvoice, Invoice, InvoiceRole } from '../../feature/dashboard/shared/apis/invoicesApi';
import { ApiError } from '../../utils/api/request';
import { buildBookingInvoiceData } from '../../utils/payments/invoiceValidation';
import Button from '../Ui/Button';
import Input from '../Ui/Input';
import { styles } from './dashboardStyles';
import { jobStyles } from './jobStyles';
import InvoiceCard from './InvoiceCard';

type Props = {
  booking: Booking;
  role: InvoiceRole;
  onChanged: () => void | Promise<void | boolean>;
};

export default function BookingInvoiceCard({ booking, role, onChanged }: Props) {
  const [invoice, setInvoice] = useState<Invoice | BookingInvoice | null>(booking.invoice || null);
  const [showForm, setShowForm] = useState(false);
  const [units, setUnits] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const working = useRef(false);
  const fixed = booking.payType?.toLowerCase() === 'fixed';

  useEffect(() => {
    setInvoice(booking.invoice || null);
  }, [booking.invoice]);

  function confirmCreate() {
    try {
      buildBookingInvoiceData(booking, units, poNumber);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Check the invoice fields.');
      return;
    }
    Alert.alert('Create invoice?', 'SupplyEd will calculate the total using this booking. The teacher must have payouts ready.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Create invoice', onPress: sendInvoice },
    ]);
  }

  async function sendInvoice() {
    if (working.current || needsRefresh || booking.status !== 'COMPLETED') return;
    working.current = true;
    setBusy(true);
    setError('');
    try {
      // Booking rates, fees, totals, and currency are calculated by the backend.
      const data = buildBookingInvoiceData(booking, units, poNumber);
      setInvoice(await createInvoice(data));
      setShowForm(false);
      await onChanged();
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Unable to create invoice.');
      // A duplicate or interrupted response may still have created an invoice.
      if (!(problem instanceof ApiError) || problem.status === 0 || problem.status === 408 || problem.status === 409 || problem.status >= 500) {
        setNeedsRefresh(true);
        try {
          await onChanged();
        } catch {
          setError('Unable to confirm the invoice. Refresh this booking before trying again.');
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
    try {
      const refreshed = await onChanged();
      if (refreshed !== false) setNeedsRefresh(false);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Unable to refresh this booking.');
    } finally {
      working.current = false;
      setBusy(false);
    }
  }

  if (invoice) {
    return <InvoiceCard invoice={invoice} role={role} onChanged={onChanged} />;
  }
  if (booking.status !== 'COMPLETED') return null;

  return (
    <View style={styles.section}>
      <Text style={styles.cardTitle}>Invoice</Text>
      {role === 'INSTRUCTOR' ? (
        <Text style={styles.cardBody}>The school can create an invoice for this completed booking.</Text>
      ) : (
        <>
          <Text style={styles.cardBody}>Create an invoice for this completed booking once the teacher has set up payouts.</Text>
          {showForm ? (
            <>
              {!fixed ? (
                <>
                  <Input label={booking.payType?.toLowerCase() === 'hourly' ? 'HOURS WORKED' : 'DAYS WORKED'} placeholder="For example, 4.5" decimal value={units} onChangeText={setUnits} disabled={busy} />
                  <Text style={styles.cardBody}>Units worked must fit the booking dates. Daily work cannot exceed booking days; hourly work cannot exceed booking days × 24.</Text>
                </>
              ) : null}
              <Input label="PO NUMBER" placeholder="Optional purchase order number" maxLength={100} required={false} value={poNumber} onChangeText={setPoNumber} disabled={busy} />
              <Button title={busy ? 'Creating invoice...' : 'Create invoice'} onPress={confirmCreate} disabled={busy || needsRefresh} compact />
              <Button title="Cancel" variant="link" onPress={() => setShowForm(false)} disabled={busy} compact />
            </>
          ) : <Button title="Create invoice" onPress={() => setShowForm(true)} disabled={busy} compact />}
        </>
      )}
      {needsRefresh ? (
        <>
          <Text style={styles.cardBody}>Check for an existing invoice before trying again.</Text>
          <Button title="Refresh booking before retry" variant="social" onPress={refreshBeforeRetry} disabled={busy} compact />
        </>
      ) : null}
      {error ? <Text style={jobStyles.error} accessibilityLiveRegion="polite">{error}</Text> : null}
    </View>
  );
}
