import React, { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import type { Booking } from '../../feature/dashboard/shared/apis/bookingsApi';
import { syncBookingPayment } from '../../feature/dashboard/shared/apis/bookingsApi';
import type { InvoiceRole } from '../../feature/dashboard/shared/apis/invoicesApi';
import {
  automaticPaymentPhase,
  formatPence,
  requiresCardAuthentication,
} from '../../utils/payments/paymentUtils';
import Button from '../Ui/Button';
import BookingTipCard from './BookingTipCard';
import InvoiceCard from './InvoiceCard';
import { useStyles } from './dashboardStyles';
import { useJobStyles } from './jobStyles';

type Props = {
  booking: Booking;
  role: InvoiceRole;
  onChanged: () => void | Promise<void | boolean>;
};

export default function BookingInvoiceCard({ booking, role, onChanged }: Props) {
  const styles = useStyles();
  const jobStyles = useJobStyles();
  const [current, setCurrent] = useState(booking);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const running = useRef(false);

  useEffect(() => setCurrent(booking), [booking]);

  async function refreshPayment() {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setError('');
    try {
      setCurrent(await syncBookingPayment(current.id));
      await onChanged();
    } catch (problem) {
      setError(
        problem instanceof Error
          ? problem.message
          : 'Payment status could not be checked.',
      );
    } finally {
      running.current = false;
      setBusy(false);
    }
  }

  const invoice = current.invoice;
  const automatic = invoice?.collectionMethod === 'charge_automatically';
  const approvalNeeded = requiresCardAuthentication(
    invoice?.lastPaymentFailureCode,
  );
  const phase =
    automatic && invoice
      ? automaticPaymentPhase({
          status: invoice.status,
          failureMessage: invoice.lastPaymentFailureMessage,
          nextAttemptAt: invoice.nextPaymentAttemptAt,
          paymentAttemptCount: invoice.paymentAttemptCount,
        })
      : '';

  let status = current.automaticPayment?.message || 'Checking payment status.';
  if (invoice?.status === 'PENDING')
    status = 'The automatic payment is being prepared.';
  else if (invoice?.status === 'PAID')
    status =
      formatPence(invoice.totalAmountPence) +
      ' paid' +
      (invoice.paidAt ? ' on ' + invoice.paidAt.slice(0, 10) : '') +
      '.';
  else if (automatic && approvalNeeded)
    status =
      "The card's bank needs a security check. The school can approve it in Billing.";
  else if (automatic && invoice?.lastPaymentFailureMessage)
    status = invoice.lastPaymentFailureMessage;
  else if (phase === 'scheduled')
    status =
      formatPence(invoice?.totalAmountPence) +
      ' will be collected automatically.';
  else if (phase === 'processing')
    status =
      'Automatic payment is processing. Stripe will confirm the result.';
  else if (invoice)
    status =
      formatPence(invoice.totalAmountPence) + ' is awaiting payment.';

  return (
    <View style={styles.section}>
      <Text style={styles.cardTitle}>Payment</Text>
      <Text style={styles.cardBody}>{status}</Text>
      {automatic ||
      (current.automaticPayment &&
        current.automaticPayment.state !== 'DISABLED') ? (
        <Text style={styles.teacherMeta}>AUTOMATIC PAYMENT</Text>
      ) : null}
      {current.attendancePayroll?.covered ? (
        <Text style={styles.cardBody}>
          Attendance totals:{' '}
          {formatPence(current.attendancePayroll.payableAmountPence)} payable
          {current.attendancePayroll.excludedAmountPence
            ? ' · ' +
              formatPence(current.attendancePayroll.excludedAmountPence) +
              ' excluded'
            : ''}
          {current.attendancePayroll.pendingAmountPence
            ? ' · ' +
              formatPence(current.attendancePayroll.pendingAmountPence) +
              ' pending'
            : ''}
          .
        </Text>
      ) : null}
      {invoice && invoice.status !== 'PENDING' ? (
        <InvoiceCard invoice={invoice} role={role} onChanged={onChanged} />
      ) : null}
      <Button
        title={busy ? 'Checking payment...' : 'Refresh payment'}
        variant="social"
        disabled={busy}
        onPress={refreshPayment}
        compact
      />
      {error ? (
        <Text style={jobStyles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
      {current.status === 'COMPLETED' ? (
        <BookingTipCard booking={current} role={role} onChanged={onChanged} />
      ) : null}
    </View>
  );
}
