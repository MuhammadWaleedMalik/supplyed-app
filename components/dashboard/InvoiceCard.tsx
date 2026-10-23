import { useTheme } from '../Ui/theme';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Text, View } from 'react-native';
import ConfirmDialog from '../Ui/ConfirmDialog';
import { StatusBadge } from '../Ui/RecordLayout';
import {
  initPaymentSheet,
  initStripe,
  presentPaymentSheet,
} from '@stripe/stripe-react-native';
import {
  createInvoicePaymentSession,
  syncInvoice,
} from '../../constants/paymentSessionsApi';
import { getSessionVersion } from '../../utils/api/session';
import Button from '../Ui/Button';
import Input from '../Ui/Input';
import {
  BookingInvoice,
  getInvoice,
  Invoice,
  InvoiceRole,
  RefundReason,
  refundInvoice,
  resendInvoice,
  voidInvoice,
} from '../../feature/dashboard/shared/apis/invoicesApi';
import { parseRefundAmount } from '../../utils/payments/invoiceValidation';
import {
  formatPence,
  openInvoicePdf,
  openStripeInvoice,
} from '../../utils/payments/paymentUtils';
import DynamicSelect from '../Ui/DynamicSelect';
import { useStyles } from './dashboardStyles';
import { useJobStyles } from './jobStyles';
import InvoiceDetails from './InvoiceDetails';

type Props = {
  invoice: Invoice | BookingInvoice;
  role: InvoiceRole;
  onChanged?: () => void | Promise<void | boolean>;
};

function errorText(problem: unknown) {
  return problem instanceof Error
    ? problem.message
    : 'Unable to update this invoice. Please try again.';
}

export default function InvoiceCard({ invoice, role, onChanged }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const jobStyles = useJobStyles();

  const [details, setDetails] = useState<Invoice | null>(
    'booking' in invoice ? invoice : null,
  );
  const [expanded, setExpanded] = useState(false);
  const [confirmation, setConfirmation] = useState<Omit<React.ComponentProps<typeof ConfirmDialog>, 'visible' | 'onClose'>>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showRefund, setShowRefund] = useState(false);
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState<RefundReason>(
    'requested_by_customer',
  );
  const working = useRef(false);
  const mounted = useRef(true);
  const mountedSession = useRef(getSessionVersion()).current;
  const active = useCallback(
    () => mounted.current && getSessionVersion() === mountedSession,
    [mountedSession],
  );
  const returningFromPayment = useRef(false);
  const refreshAfterPaymentOpens = useRef(false);
  const current = details || invoice;
  const remainingPence = details
    ? Math.max(0, details.totalAmountPence - details.amountRefundedPence)
    : 0;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if ('booking' in invoice) {
      setDetails(invoice);
    } else {
      setDetails(previous => (previous ? { ...previous, ...invoice } : null));
    }
  }, [invoice]);

  const refreshInvoice = useCallback(async () => {
    if (!active() || working.current) return;
    working.current = true;
    setBusy(true);
    setError('');
    try {
      const latest = await syncInvoice(invoice.id);
      if (!active()) return;
      setDetails(latest);
      setNeedsRefresh(false);
      if (latest.status === 'PAID' || latest.status === 'VOID')
        returningFromPayment.current = false;
      setMessage(
        latest.status === 'OPEN' || latest.status === 'UNCOLLECTIBLE'
          ? 'Payment is still awaiting confirmation. Refresh payment after completing it in Stripe.'
          : 'Invoice refreshed.',
      );
      await onChanged?.();
      return latest;
    } catch (problem) {
      if (active()) setError(errorText(problem));
      return null;
    } finally {
      working.current = false;
      if (active()) setBusy(false);
    }
  }, [invoice.id, onChanged, active]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active' && returningFromPayment.current) {
        if (working.current) {
          refreshAfterPaymentOpens.current = true;
          return;
        }
        refreshInvoice();
      }
    });
    return () => subscription.remove();
  }, [refreshInvoice]);

  async function showDetails() {
    if (expanded) {
      setExpanded(false);
      return;
    }
    setExpanded(true);
    await refreshInvoice();
  }

  async function payInvoice(hosted = false) {
    if (!active() || working.current || role !== 'INSTITUTION' || needsRefresh)
      return;
    const sessionVersion = getSessionVersion();
    working.current = true;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      // Check the backend before opening payment; another user may have paid it.
      const latest = await getInvoice(invoice.id);
      if (!mounted.current || getSessionVersion() !== sessionVersion) return;
      setDetails(latest);
      if (latest.status !== 'OPEN' && latest.status !== 'UNCOLLECTIBLE') {
        setMessage('This invoice is ' + latest.status.toLowerCase() + '.');
        await onChanged?.();
        return;
      }
      returningFromPayment.current = true;
      if (hosted) {
        await openStripeInvoice(latest.hostedInvoiceUrl);
        setMessage(
          'Complete payment in Stripe, then return here to check its status.',
        );
        return;
      }
      const session = await createInvoicePaymentSession(invoice.id);
      if (!active()) return;
      setMessage(
        'Amount due: ' + formatPence(session.amountPence, session.currency),
      );
      await initStripe({
        publishableKey: session.publishableKey,
        urlScheme: 'supplyed',
      });
      if (!mounted.current || getSessionVersion() !== sessionVersion) return;
      const setup = await initPaymentSheet({
        merchantDisplayName: 'SupplyEd',
        paymentIntentClientSecret: session.clientSecret,
        customerSessionClientSecret: session.customerSessionClientSecret,
        returnURL: 'supplyed://stripe-redirect',
        allowsDelayedPaymentMethods: false,
        appearance: {
          colors: { primary: colors.brand },
          shapes: { borderRadius: 12 },
        },
      });
      if (setup.error) throw new Error(setup.error.message);
      if (!mounted.current || getSessionVersion() !== sessionVersion) return;
      const payment = await presentPaymentSheet();
      if (!mounted.current || getSessionVersion() !== sessionVersion) return;
      if (payment.error?.code === 'Canceled') {
        returningFromPayment.current = false;
        setMessage('Payment cancelled. You have not been marked as paid.');
        return;
      }
      if (payment.error) throw new Error(payment.error.message);
      setMessage('Payment is processing. Checking confirmation...');
      let settled: Invoice | undefined;
      // Stripe may finish after the payment sheet closes. Only check while this screen is active.
      for (let attempt = 0; attempt < 5; attempt += 1) {
        if (attempt > 0)
          await new Promise<void>(resolve => setTimeout(resolve, 1500));
        if (
          !mounted.current ||
          getSessionVersion() !== sessionVersion ||
          AppState.currentState !== 'active'
        )
          return;
        settled = await syncInvoice(invoice.id);
        if (settled.status === 'PAID' || settled.status === 'VOID') break;
      }
      if (
        !settled ||
        !mounted.current ||
        getSessionVersion() !== sessionVersion
      )
        return;
      setDetails(settled);
      setNeedsRefresh(settled.status !== 'PAID' && settled.status !== 'VOID');
      returningFromPayment.current =
        settled.status !== 'PAID' && settled.status !== 'VOID';
      setMessage(
        settled.status === 'PAID'
          ? 'Payment confirmed. Thank you.'
          : settled.status === 'VOID'
          ? 'This invoice has been voided.'
          : 'Payment is processing. Refresh payment to check confirmation.',
      );
      await onChanged?.();
    } catch (problem) {
      if (!mounted.current || getSessionVersion() !== sessionVersion) return;
      setNeedsRefresh(true);
      setError(errorText(problem));
      // Includes paid-elsewhere 409 and uncertain confirmation; never repeat checkout automatically.
      try {
        const latest = await syncInvoice(invoice.id);
        if (!active()) return;
        setDetails(latest);
        if (latest.status === 'PAID' || latest.status === 'VOID') {
          returningFromPayment.current = false;
          setError('');
          setMessage('Invoice is ' + latest.status.toLowerCase() + '.');
        }
        await onChanged?.();
      } catch {
        if (active()) setMessage('Refresh payment before trying again.');
      }
    } finally {
      working.current = false;
      if (active()) setBusy(false);
      if (
        mounted.current &&
        getSessionVersion() === sessionVersion &&
        AppState.currentState === 'active' &&
        refreshAfterPaymentOpens.current
      ) {
        refreshAfterPaymentOpens.current = false;
        refreshInvoice();
      }
    }
  }

  async function showPdf() {
    if (!active() || working.current) return;
    working.current = true;
    setBusy(true);
    setError('');
    try {
      const latest = await getInvoice(invoice.id);
      if (!active()) return;
      setDetails(latest);
      await openInvoicePdf(latest.invoicePdfUrl);
    } catch (problem) {
      if (active()) setError(errorText(problem));
    } finally {
      working.current = false;
      if (active()) setBusy(false);
    }
  }

  async function changeInvoice(
    action: () => Promise<unknown>,
    successMessage: string,
  ) {
    if (!active() || working.current || needsRefresh) return false;
    working.current = true;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await action();
      if (!active()) return false;
      setMessage(successMessage);
      setShowRefund(false);
      setRefundAmount('');
      const latest = await getInvoice(invoice.id);
      if (!active()) return false;
      setDetails(latest);
      await onChanged?.();
      return true;
    } catch (problem) {
      if (!active()) return false;
      setError(errorText(problem));
      // A failed response does not prove that Stripe rejected the mutation.
      // Reconcile the invoice and require a fresh review before another attempt.
      setNeedsRefresh(true);
      try {
        const latest = await getInvoice(invoice.id);
        if (!active()) return false;
        setDetails(latest);
        await onChanged?.();
      } catch {
        if (active())
          setMessage(
            'Refresh payment to confirm the invoice before trying again.',
          );
      }
      return false;
    } finally {
      working.current = false;
      if (active()) setBusy(false);
    }
  }

  function confirmResend() {
    setConfirmation({ title: 'Resend invoice email?', context: details?.booking.jobTitle, description: 'Send this open invoice to the school again.', confirmLabel: 'Resend invoice', onConfirm: () => changeInvoice(() => resendInvoice(invoice.id), 'Invoice email sent.') });
  }
  async function confirmVoid() {
    const latest = await refreshInvoice();
    if (!latest || !['OPEN', 'UNCOLLECTIBLE'].includes(latest.status)) return;
    setConfirmation({ title: 'Void this invoice?', context: latest.booking.jobTitle, description: 'The school will no longer be able to pay this invoice.', confirmLabel: 'Void invoice', destructive: true, onConfirm: () => changeInvoice(() => voidInvoice(invoice.id), 'Invoice voided.') });
  }

  async function showRefundForm() {
    if (showRefund) {
      setShowRefund(false);
      return;
    }
    const latest = await refreshInvoice();
    if (latest?.status === 'PAID') setShowRefund(true);
  }

  function confirmRefund() {
    const amountPence = refundAmount.trim()
      ? parseRefundAmount(refundAmount)
      : undefined;
    if (
      amountPence === null ||
      (amountPence !== undefined && amountPence > remainingPence)
    ) {
      setError(
        'Enter a positive amount with up to two decimal places, no more than the remaining refundable amount.',
      );
      return;
    }
    const amount = formatPence(
      amountPence ?? remainingPence,
      details?.currency || 'GBP',
    );
    setConfirmation({ title: 'Refund ' + amount + '?', context: details?.booking.jobTitle, description: 'This returns the money to the original payment method. Review the amount before continuing.', confirmLabel: 'Confirm refund', destructive: true, onConfirm: () => changeInvoice(() => refundInvoice(invoice.id, amountPence, refundReason || undefined), 'Refund submitted.') });
  }

  return (
    <View style={styles.card}>
      {confirmation ? <ConfirmDialog {...confirmation} visible onClose={() => setConfirmation(undefined)} /> : null}
      <View style={styles.sectionHead}>
        <View style={styles.teacherCopy}>
          <Text style={styles.cardTitle}>
            {details?.invoiceNumber || 'Invoice'}
          </Text>
          {details ? (
            <Text style={styles.cardBody}>{details.booking.jobTitle}</Text>
          ) : null}
          <Text style={styles.cardTitle}>
            {formatPence(role === 'INSTRUCTOR' && details ? details.teacherAmountPence : current.totalAmountPence, details?.currency || 'GBP')}
          </Text>
        </View>
        <StatusBadge status={current.status} label={details?.amountRefundedPence ? details.amountRefundedPence >= details.totalAmountPence ? 'Fully refunded' : 'Partially refunded' : undefined} />
      </View>
      <View style={styles.quickButtons}>
        {role === 'INSTITUTION' &&
        (current.status === 'OPEN' || current.status === 'UNCOLLECTIBLE') ? (
          <>
            <Text style={styles.cardBody}>
              Pay securely with Stripe. Your payment details stay with Stripe.
            </Text>
            <Button
              title="Pay invoice"
              onPress={() => payInvoice()}
              disabled={busy || needsRefresh}
            />
            {current.hostedInvoiceUrl ? (
              <Button
                title="Pay in browser instead"
                variant="link"
                onPress={() => payInvoice(true)}
                disabled={busy || needsRefresh}
                compact
              />
            ) : null}
          </>
        ) : null}
        {expanded || needsRefresh ? (
          <Button
            title={busy ? 'Please wait...' : 'Refresh payment'}
            variant="social"
            onPress={refreshInvoice}
            disabled={busy}
            compact
          />
        ) : null}
        <Button
          title={expanded ? 'Hide details' : 'Invoice details'}
          variant="link"
          onPress={showDetails}
          disabled={busy}
          compact
        />
      </View>
      {expanded && details ? <InvoiceDetails invoice={details} /> : null}
      {expanded ? (
        <Button
          title="Open invoice PDF"
          variant="social"
          onPress={showPdf}
          disabled={busy}
          compact
        />
      ) : null}
      {expanded && role !== 'INSTRUCTOR' && current.status === 'OPEN' ? (
        <Button
          title="Resend invoice email"
          variant="social"
          onPress={confirmResend}
          disabled={busy || needsRefresh}
          compact
        />
      ) : null}
      {expanded &&
      role === 'ADMIN' &&
      (current.status === 'OPEN' || current.status === 'UNCOLLECTIBLE') ? (
        <Button
          title="Void invoice"
          variant="social"
          onPress={confirmVoid}
          disabled={busy || needsRefresh}
          compact
        />
      ) : null}
      {expanded && role === 'ADMIN' && current.status === 'PAID' && details ? (
        <View style={styles.section}>
          <Text style={styles.cardBody}>
            Remaining refundable:{' '}
            {formatPence(remainingPence, details.currency)}
          </Text>
          <Button
            title={remainingPence > 0 ? 'Refund invoice' : 'Fully refunded'}
            variant="social"
            onPress={showRefundForm}
            disabled={busy || needsRefresh || remainingPence < 1}
            compact
          />
          {showRefund ? (
            <>
              <Input
                label="REFUND AMOUNT (GBP)"
                placeholder="Leave blank for the full remaining amount"
                decimal
                required={false}
                value={refundAmount}
                onChangeText={setRefundAmount}
                disabled={busy}
              />
              <DynamicSelect
                name="refundReason"
                label="Refund reason"
                value={refundReason}
                onChange={value => setRefundReason(value as RefundReason)}
              />
              <Button
                title="Confirm refund"
                onPress={confirmRefund}
                disabled={busy || needsRefresh}
                compact
              />
              <Button
                title="Cancel refund"
                variant="link"
                onPress={() => setShowRefund(false)}
                disabled={busy}
                compact
              />
            </>
          ) : null}
        </View>
      ) : null}
      {needsRefresh ? (
        <Text style={styles.cardBody}>
          Refresh payment and review the latest status and refunded amount
          before trying again.
        </Text>
      ) : null}
      {message ? (
        <Text style={styles.cardBody} accessibilityLiveRegion="polite">
          {message}
        </Text>
      ) : null}
      {error ? (
        <Text style={jobStyles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
