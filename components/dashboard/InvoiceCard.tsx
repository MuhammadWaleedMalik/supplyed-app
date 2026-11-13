import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Text, View } from 'react-native';
import ConfirmDialog from '../Ui/ConfirmDialog';
import { StatusBadge } from '../Ui/RecordLayout';
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
  canPayInvoice,
  isInvoicePaymentTerminal,
} from '../../utils/payments/invoicePaymentState';
import {
  getPendingPaymentFlows,
  onPaymentFlowsChanged,
  openPaymentFlow,
  reconcilePaymentFlow,
  savePaymentFlow,
  withPaymentResourceLock,
} from '../../utils/payments/flowCoordinator';
import {
  formatPence,
  openInvoicePdf,
  requiresCardAuthentication,
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
  const recoveryRead = useRef(0);
  const refreshAfterPaymentOpens = useRef(false);
  const current = details || invoice;
  const cardApproval = requiresCardAuthentication(
    current.lastPaymentFailureCode,
  );
  const canPay = canPayInvoice(current, role);
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
      const pending = (await getPendingPaymentFlows()).find(
        flow => flow.kind === 'invoice' && flow.invoiceId === invoice.id,
      );
      if (!active()) return;
      const result = pending ? await reconcilePaymentFlow(pending) : undefined;
      if (!active()) return;
      if (result?.state === 'needs-login')
        throw new Error('Sign in to the original account to check this payment.');
      if (result?.error) throw new Error(result.error);
      const latest =
        (result?.data as Invoice | undefined) ?? await syncInvoice(invoice.id);
      if (!active()) return;
      setDetails(latest);
      setNeedsRefresh(false);
      if (latest.status === 'PAID' || latest.status === 'VOID')
        returningFromPayment.current = false;
      setMessage(
        latest.status === 'PAID'
          ? 'Payment confirmed. Thank you.'
          : latest.status === 'VOID'
          ? 'This invoice has been voided.'
          : returningFromPayment.current
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
    async function readRecoveryState() {
      const read = ++recoveryRead.current;
      try {
        const pending = (await getPendingPaymentFlows()).some(
          flow => flow.kind === 'invoice' && flow.invoiceId === invoice.id,
        );
        if (!active() || read !== recoveryRead.current) return;
        const wasPending = returningFromPayment.current;
        returningFromPayment.current = pending;
        if (!pending && !wasPending) return;
        if (working.current) return;
        const latest = await getInvoice(invoice.id);
        if (!active() || read !== recoveryRead.current) return;
        setDetails(latest);
        if (isInvoicePaymentTerminal(latest)) {
          setNeedsRefresh(false);
          setMessage(latest.status === 'PAID'
            ? 'Payment confirmed. Thank you.'
            : 'This invoice has been voided.');
        }
        if (wasPending && !pending) await onChanged?.();
      } catch (problem) {
        if (active() && read === recoveryRead.current) setError(errorText(problem));
      }
    }
    readRecoveryState();
    return onPaymentFlowsChanged(readRecoveryState);
  }, [invoice.id, active, onChanged]);

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

  async function payInvoice() {
    if (!active() || working.current || !canPay || needsRefresh) return;
    working.current = true;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await withPaymentResourceLock('invoice:' + invoice.id, async () => {
        // Sync the original obligation; never create a separate payment intent.
        let latest = await syncInvoice(invoice.id);
        if (!active()) return;
        setDetails(latest);
        if (!canPayInvoice(latest, role)) {
          setMessage(
            isInvoicePaymentTerminal(latest)
              ? 'This invoice is ' + latest.status.toLowerCase() + '.'
              : 'Automatic collection is scheduled or processing. Refresh to check its status.',
          );
          await onChanged?.();
          return;
        }
        if (latest.collectionMethod === 'charge_automatically') {
          // The existing web endpoint enforces recovery eligibility against
          // Stripe and enables cards on legacy failed debit invoices. Its web
          // CustomerSession/confirmation secrets are never used by PaymentSheet.
          await createInvoicePaymentSession(invoice.id);
          if (!active()) return;
          latest = await getInvoice(invoice.id);
          if (!active()) return;
          setDetails(latest);
          if (!canPayInvoice(latest, role)) {
            setMessage('This invoice is no longer awaiting a manual payment.');
            await onChanged?.();
            return;
          }
        }
        if (!latest.hostedInvoiceUrl) {
          setMessage(
            'The secure invoice payment link is being prepared. Refresh payment and try again shortly.',
          );
          return;
        }
        const flow = await savePaymentFlow({
          kind: 'invoice', invoiceId: invoice.id,
        });
        if (!active()) return;
        returningFromPayment.current = true;
        setNeedsRefresh(true);
        await openPaymentFlow(flow, latest.hostedInvoiceUrl);
        if (!active()) return;
        setMessage(
          'Complete payment in Stripe, then return here to check its status.',
        );
      });
    } catch (problem) {
      if (!active()) return;
      setNeedsRefresh(true);
      setError(errorText(problem));
      // A conflict or lost response must refresh the original obligation,
      // never automatically reopen checkout or create another payment.
      try {
        const latest = await syncInvoice(invoice.id);
        if (!active()) return;
        setDetails(latest);
        if (isInvoicePaymentTerminal(latest)) {
          returningFromPayment.current = false;
          setNeedsRefresh(false);
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
        active() && AppState.currentState === 'active' &&
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
            {role === 'INSTRUCTOR' && current.teacherAmountPence === undefined
              ? 'Open invoice for earnings'
              : formatPence(role === 'INSTRUCTOR' ? current.teacherAmountPence : current.totalAmountPence, details?.currency || 'GBP')}
          </Text>
          {current.billingPeriodLabel ? (
            <Text style={styles.cardBody}>{current.billingPeriodLabel}</Text>
          ) : null}
          {current.dueAt && current.status !== 'PAID' && current.status !== 'VOID' ? (
            <Text style={styles.teacherMeta}>Due {current.dueAt.slice(0, 10)}</Text>
          ) : null}
          {role === 'INSTRUCTOR' && current.status === 'PAID' ? (
            <Text style={styles.cardBody}>School payment collected. Bank payouts are tracked separately.</Text>
          ) : null}
        </View>
        <StatusBadge status={current.status} label={details?.amountRefundedPence ? details.amountRefundedPence >= details.totalAmountPence ? 'Fully refunded' : 'Partially refunded' : undefined} />
      </View>
      <View style={styles.quickButtons}>
        {canPay ? (
          <>
            <Text style={styles.cardBody}>
              {cardApproval
                ? "Your card's bank needs a security check before this payment can finish."
                : current.lastPaymentFailureMessage ||
                  'Pay this invoice securely with Stripe.'}
            </Text>
            <Button
              title={
                !current.hostedInvoiceUrl
                  ? 'Check payment link'
                  : cardApproval
                  ? 'Approve card payment'
                  : 'Pay invoice in Stripe'
              }
              onPress={() => payInvoice()}
              disabled={busy || needsRefresh}
            />
            {!current.hostedInvoiceUrl ? (
              <Text style={styles.cardBody}>Stripe is preparing the secure payment link. Check again shortly.</Text>
            ) : null}
          </>
        ) : null}
        {role === 'INSTITUTION' && current.collectionMethod === 'charge_automatically' &&
          ['OPEN', 'PENDING'].includes(current.status) && !canPay ? (
          <Text style={styles.cardBody}>
            Automatic collection is scheduled or processing. Stripe will confirm the result.
          </Text>
        ) : null}
        {expanded || needsRefresh || canPay ? (
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
      {expanded && details?.invoicePdfUrl ? (
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
