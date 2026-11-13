import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import type { Booking } from '../../feature/dashboard/shared/apis/bookingsApi';
import { syncBookingPayment } from '../../feature/dashboard/shared/apis/bookingsApi';
import {
  createInvoice,
  type InvoiceRole,
} from '../../feature/dashboard/shared/apis/invoicesApi';
import { ApiError } from '../../utils/api/request';
import { getSessionVersion } from '../../utils/api/session';
import { buildBookingInvoiceData } from '../../utils/payments/invoiceValidation';
import {
  automaticPaymentPhase,
  formatPence,
  requiresCardAuthentication,
} from '../../utils/payments/paymentUtils';
import Button from '../Ui/Button';
import ConfirmDialog from '../Ui/ConfirmDialog';
import Input from '../Ui/Input';
import BookingTipCard from './BookingTipCard';
import InvoiceCard from './InvoiceCard';
import PaymentReleaseScheduleModal from './PaymentReleaseScheduleModal';
import { useStyles } from './dashboardStyles';
import { useJobStyles } from './jobStyles';

type Props = {
  booking: Booking;
  role: InvoiceRole;
  onChanged: () => void | Promise<void | boolean>;
};

function paymentDate(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? date.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      })
    : value;
}

function canStartManualPayment(booking: Booking, role: InvoiceRole) {
  return (
    role === 'INSTITUTION' &&
    booking.status === 'COMPLETED' &&
    (!booking.invoice || booking.invoice.status === 'VOID') &&
    ['DISABLED', 'BLOCKED', 'REVIEW_REQUIRED'].includes(
      booking.automaticPayment?.state || 'DISABLED',
    )
  );
}

export default function BookingInvoiceCard({ booking, role, onChanged }: Props) {
  const styles = useStyles();
  const jobStyles = useJobStyles();
  const [current, setCurrent] = useState(booking);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showManualForm, setShowManualForm] = useState(false);
  const [confirmingManual, setConfirmingManual] = useState(false);
  const [units, setUnits] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [manualNeedsRefresh, setManualNeedsRefresh] = useState(false);
  const [showReleaseSchedule, setShowReleaseSchedule] = useState(false);
  const running = useRef(false);
  const mounted = useRef(true);
  const mountedSession = useRef(getSessionVersion()).current;
  const active = useCallback(
    () => mounted.current && getSessionVersion() === mountedSession,
    [mountedSession],
  );

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (active()) setCurrent(booking);
  }, [booking, active]);

  async function refreshPayment() {
    if (!active() || running.current) return;
    running.current = true;
    setBusy(true);
    setError('');
    try {
      const latest = await syncBookingPayment(current.id);
      if (!active()) return;
      setCurrent(latest);
      setManualNeedsRefresh(false);
      await onChanged();
    } catch (problem) {
      if (!active()) return;
      setError(
        problem instanceof Error
          ? problem.message
          : 'Payment status could not be checked.',
      );
    } finally {
      running.current = false;
      if (active()) setBusy(false);
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
  const fixed = current.payType?.toLowerCase() === 'fixed';
  const manualAvailable = canStartManualPayment(current, role);

  function confirmManualInvoice() {
    if (!active() || running.current || manualNeedsRefresh || !manualAvailable)
      return;
    try {
      buildBookingInvoiceData(current, units, poNumber);
      setError('');
      setConfirmingManual(true);
    } catch (problem) {
      setError(
        problem instanceof Error ? problem.message : 'Check the invoice fields.',
      );
    }
  }

  async function createManualInvoice() {
    if (!active() || running.current || manualNeedsRefresh || !manualAvailable)
      return false;
    running.current = true;
    setBusy(true);
    setError('');
    try {
      // Reconcile immediately before creating the invoice. If collection or
      // another payment appeared meanwhile, the manual flow stops here.
      const latest = await syncBookingPayment(current.id);
      if (!active()) return false;
      setCurrent(latest);
      if (!canStartManualPayment(latest, role)) {
        setConfirmingManual(false);
        setManualNeedsRefresh(false);
        setError(
          latest.invoice?.status === 'PAID'
            ? 'This booking has already been paid.'
            : 'The payment status changed. Review the latest payment details before trying again.',
        );
        await onChanged();
        return false;
      }
      const created = await createInvoice(
        buildBookingInvoiceData(latest, units, poNumber),
      );
      if (!active()) return false;
      setCurrent(value => ({ ...value, invoice: created }));
      setShowManualForm(false);
      setConfirmingManual(false);
      setUnits('');
      setPoNumber('');
      await onChanged();
      if (!active()) return false;
      return true;
    } catch (problem) {
      if (!active()) return false;
      const uncertain =
        !(problem instanceof ApiError) ||
        problem.status === 0 ||
        problem.status === 408 ||
        problem.status === 409 ||
        problem.status >= 500;
      if (uncertain) setManualNeedsRefresh(true);
      setError(
        uncertain
          ? 'The invoice result is uncertain. Refresh payment before trying again.'
          : problem instanceof Error
          ? problem.message
          : 'Unable to create the invoice.',
      );
      return false;
    } finally {
      running.current = false;
      if (active()) setBusy(false);
    }
  }

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
      <PaymentReleaseScheduleModal
        booking={current}
        visible={showReleaseSchedule}
        onClose={() => setShowReleaseSchedule(false)}
      />
      <ConfirmDialog
        visible={confirmingManual}
        title="Pay this booking manually?"
        context={current.job.title}
        description="SupplyED will create one secure Stripe invoice from this booking. Its status is checked first, and a paid invoice cannot also be collected automatically."
        confirmLabel="Continue to payment"
        onClose={() => setConfirmingManual(false)}
        onConfirm={createManualInvoice}
      />
      <Text style={styles.cardTitle}>Payment</Text>
      <Text style={styles.cardBody}>{status}</Text>
      <Button
        title="Payment release schedule"
        variant="outline"
        onPress={() => setShowReleaseSchedule(true)}
      />
      <View style={styles.record}>
        <Text style={styles.recordLabel}>PAYMENT TIMING</Text>
        <Text style={styles.recordValue}>
          {current.paymentFrequency
            ? current.paymentFrequency.charAt(0).toUpperCase() +
              current.paymentFrequency.slice(1) +
              ' schedule'
            : 'Booking schedule'}
        </Text>
        {current.automaticPayment?.nextCollectionAt ? (
          <Text style={styles.cardBody}>
            Next scheduled payment:{' '}
            {paymentDate(current.automaticPayment.nextCollectionAt)}
          </Text>
        ) : invoice?.nextPaymentAttemptAt ? (
          <Text style={styles.cardBody}>
            Next payment attempt: {paymentDate(invoice.nextPaymentAttemptAt)}
          </Text>
        ) : invoice?.status === 'PAID' && invoice.paidAt ? (
          <Text style={styles.cardBody}>
            Paid: {paymentDate(invoice.paidAt)}
          </Text>
        ) : (
          <Text style={styles.cardBody}>
            The exact payment date will appear when the backend schedules it.
          </Text>
        )}
        {role === 'INSTRUCTOR' ? (
          <Text style={styles.cardBody}>
            Stripe balance availability and transfer to your bank are confirmed
            separately after collection.
          </Text>
        ) : null}
      </View>
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
      {manualAvailable ? (
        <View style={styles.section}>
          <Text style={styles.cardTitle}>Manual payment</Text>
          <Text style={styles.cardBody}>
            Automatic payments are off for this booking. Pay it once through a
            secure Stripe invoice.
          </Text>
          <View style={styles.paymentSafetyNote}>
            <Text style={styles.paymentSafetyTitle}>No duplicate charge</Text>
            <Text style={styles.cardBody}>
              SupplyED checks the latest payment before continuing. Once this
              invoice is paid, automatic collection cannot charge it again.
            </Text>
          </View>
          {showManualForm ? (
            <>
              {!fixed && !current.attendancePayroll?.covered ? (
                <Input
                  label={
                    current.payType?.toLowerCase() === 'hourly'
                      ? 'HOURS WORKED'
                      : 'DAYS WORKED'
                  }
                  placeholder="For example, 4.5"
                  decimal
                  value={units}
                  onChangeText={setUnits}
                  disabled={busy}
                />
              ) : null}
              {current.attendancePayroll?.covered && !fixed ? (
                <Text style={styles.cardBody}>
                  Days or hours worked are calculated from the final attendance
                  record.
                </Text>
              ) : null}
              <Input
                label="PO NUMBER"
                placeholder="Optional purchase order number"
                maxLength={100}
                required={false}
                value={poNumber}
                onChangeText={setPoNumber}
                disabled={busy}
              />
              <Button
                title={busy ? 'Preparing payment...' : 'Continue to payment'}
                onPress={confirmManualInvoice}
                disabled={busy || manualNeedsRefresh}
                compact
              />
              <Button
                title="Cancel"
                variant="link"
                onPress={() => setShowManualForm(false)}
                disabled={busy}
                compact
              />
            </>
          ) : (
            <Button
              title="Pay manually"
              onPress={() => {
                if (fixed || current.attendancePayroll?.covered)
                  confirmManualInvoice();
                else setShowManualForm(true);
              }}
              disabled={busy || manualNeedsRefresh}
            />
          )}
        </View>
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
