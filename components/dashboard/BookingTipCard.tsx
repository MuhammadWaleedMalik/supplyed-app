import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import {
  Booking,
  BookingTip,
  getBooking,
} from '../../feature/dashboard/shared/apis/bookingsApi';
import type { InvoiceRole } from '../../feature/dashboard/shared/apis/invoicesApi';
import {
  BookingTipCheckout,
  createBookingTip,
} from '../../feature/dashboard/shared/apis/paymentsApi';
import { useForegroundRefresh } from '../../feature/dashboard/shared/hooks/useForegroundRefresh';
import { getSessionVersion } from '../../utils/api/session';
import {
  getPendingPaymentFlows,
  onPaymentFlowsChanged,
  openPaymentFlow,
  PendingPaymentFlow,
  reconcilePaymentFlow,
  savePaymentFlow,
  withPaymentResourceLock,
} from '../../utils/payments/flowCoordinator';
import {
  formatPence,
  isStripeCheckoutUrl,
  parsePoundsToPence,
} from '../../utils/payments/paymentUtils';
import Button from '../Ui/Button';
import Input from '../Ui/Input';
import { useStyles } from './dashboardStyles';
import { useJobStyles } from './jobStyles';

type Props = {
  booking: Booking;
  role: InvoiceRole;
  onChanged: () => void | Promise<void | boolean>;
};

function tipMessage(tip?: BookingTip | null) {
  if (!tip) return 'A tip is optional and separate from the booking payment.';
  switch (tip.status) {
    case 'PAID':
      return `${formatPence(tip.tipAmountPence)} tip paid to the teacher.`;
    case 'PROCESSING':
      return `${formatPence(
        tip.tipAmountPence,
      )} tip is processing. Check its status before making another payment.`;
    case 'REFUNDED':
      return `This tip was refunded. Refunded amount: ${formatPence(
        tip.amountRefundedPence,
      )}.`;
    case 'FAILED':
      return (
        tip.paymentFailureMessage ||
        'The tip payment failed. You can try again.'
      );
    case 'CANCELLED':
      return 'Stripe confirmed this tip checkout was cancelled.';
    default:
      return 'Tip checkout is awaiting confirmation. Resume the existing checkout or check its status.';
  }
}

export default function BookingTipCard({ booking, role, onChanged }: Props) {
  const styles = useStyles();
  const jobStyles = useJobStyles();
  const [tip, setTip] = useState(booking.tip);
  const [amount, setAmount] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [checkout, setCheckout] = useState<BookingTipCheckout>();
  const [pending, setPending] = useState<PendingPaymentFlow>();
  const mounted = useRef(true);
  const lock = useRef(false);
  const refreshAttempt = useRef(0);
  const onChangedRef = useRef(onChanged);
  onChangedRef.current = onChanged;

  useEffect(() => setTip(booking.tip), [booking.id, booking.tip]);
  useEffect(() => {
    setCheckout(undefined);
    setPending(undefined);
    setAmount('');
    setShowForm(false);
    setNotice('');
    setError('');
  }, [booking.id]);

  const refresh = useCallback(async () => {
    const version = getSessionVersion();
    const attempt = ++refreshAttempt.current;
    try {
      const [latest, flows] = await Promise.all([
        getBooking(booking.id),
        getPendingPaymentFlows(),
      ]);
      if (
        !mounted.current ||
        version !== getSessionVersion() ||
        attempt !== refreshAttempt.current
      )
        return;
      setTip(latest.tip);
      setPending(
        flows.find(
          flow => flow.kind === 'tip' && flow.bookingId === booking.id,
        ),
      );
      setError('');
      if (
        latest.tip &&
        ['PAID', 'PROCESSING', 'REFUNDED', 'CANCELLED', 'FAILED'].includes(
          latest.tip.status,
        )
      ) {
        setCheckout(undefined);
        setNotice(tipMessage(latest.tip));
      }
    } catch (problem) {
      if (
        mounted.current &&
        version === getSessionVersion() &&
        attempt === refreshAttempt.current
      )
        setError(
          problem instanceof Error
            ? problem.message
            : 'Unable to check this tip.',
        );
    }
  }, [booking.id]);

  useEffect(() => {
    let active = true;
    const version = getSessionVersion();
    mounted.current = true;
    getPendingPaymentFlows()
      .then(flows => {
        if (active && mounted.current && version === getSessionVersion())
          setPending(
            flows.find(
              flow => flow.kind === 'tip' && flow.bookingId === booking.id,
            ),
          );
      })
      .catch(problem => {
        if (active && mounted.current && version === getSessionVersion())
          setError(
            problem instanceof Error
              ? problem.message
              : 'Unable to read pending tip payments.',
          );
      });
    const unsubscribe = onPaymentFlowsChanged(() => {
      refresh();
    });
    return () => {
      active = false;
      mounted.current = false;
      unsubscribe();
    };
  }, [booking.id, refresh]);
  useForegroundRefresh(
    refresh,
    Boolean(pending || tip?.status === 'PROCESSING') && !busy,
    0,
  );

  async function prepareTip(existingAmount?: number) {
    if (
      lock.current ||
      role !== 'INSTITUTION' ||
      booking.status !== 'COMPLETED'
    )
      return;
    if (tip && ['PAID', 'PROCESSING', 'REFUNDED'].includes(tip.status)) return;
    const amountPence = existingAmount ?? parsePoundsToPence(amount);
    if (
      amountPence === null ||
      !Number.isSafeInteger(amountPence) ||
      amountPence < 1 ||
      amountPence > 99_999_999
    ) {
      setError(
        'Enter an amount between £0.01 and £999,999.99, with up to two decimal places. Stripe also requires a minimum total including the fee.',
      );
      return;
    }
    lock.current = true;
    const version = getSessionVersion();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await withPaymentResourceLock('tip:' + booking.id, async () => {
        const result = await createBookingTip(booking.id, amountPence);
        if (!mounted.current || version !== getSessionVersion()) return;
        if (!isStripeCheckoutUrl(result.url))
          throw new Error('Stripe did not return a valid tip checkout.');
        const flow = await savePaymentFlow({
          kind: 'tip',
          bookingId: booking.id,
          tipId: result.tipId,
          sessionId: result.sessionId,
        });
        if (!mounted.current || version !== getSessionVersion()) return;
        setPending(flow);
        setCheckout(result);
        setShowForm(false);
        setNotice(
          'Review the tip and SupplyED fee below before continuing to Stripe.',
        );
      });
    } catch (problem) {
      if (mounted.current && version === getSessionVersion()) {
        await refresh();
        if (mounted.current && version === getSessionVersion())
          setError(
            problem instanceof Error
              ? problem.message
              : 'Unable to prepare this tip.',
          );
      }
    } finally {
      lock.current = false;
      if (mounted.current && version === getSessionVersion()) setBusy(false);
    }
  }

  async function openCheckout() {
    if (lock.current || !checkout || !pending) return;
    lock.current = true;
    const version = getSessionVersion();
    setBusy(true);
    setError('');
    try {
      await openPaymentFlow(pending, checkout.url);
      if (mounted.current && version === getSessionVersion())
        setNotice(
          'Complete payment in your browser, then return here to check its status. Closing the browser does not confirm cancellation.',
        );
    } catch (problem) {
      if (mounted.current && version === getSessionVersion())
        setError(
          problem instanceof Error
            ? problem.message
            : 'Unable to open Stripe. You can check this payment below.',
        );
    } finally {
      lock.current = false;
      if (mounted.current && version === getSessionVersion()) setBusy(false);
    }
  }

  async function checkTip() {
    if (lock.current) return;
    lock.current = true;
    const version = getSessionVersion();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const checked = pending ? await reconcilePaymentFlow(pending) : undefined;
      if (!mounted.current || version !== getSessionVersion()) return;
      if (checked?.state === 'needs-login' || checked?.state === 'failed')
        throw new Error(
          checked.error || 'Unable to check this payment. Please try again.',
        );
      const latest = await getBooking(booking.id);
      if (!mounted.current || version !== getSessionVersion()) return;
      setTip(latest.tip);
      setNotice(
        latest.tip
          ? tipMessage(latest.tip)
          : 'No confirmed tip is recorded for this booking.',
      );
      if (
        latest.tip &&
        ['PAID', 'PROCESSING', 'REFUNDED', 'FAILED', 'CANCELLED'].includes(
          latest.tip.status,
        )
      ) {
        setCheckout(undefined);
        setShowForm(false);
        setAmount('');
      }
      await onChangedRef.current();
      if (!mounted.current || version !== getSessionVersion()) return;
      await refresh();
    } catch (problem) {
      if (mounted.current && version === getSessionVersion())
        setError(
          problem instanceof Error
            ? problem.message
            : 'Unable to check the tip payment.',
        );
    } finally {
      lock.current = false;
      if (mounted.current && version === getSessionVersion()) setBusy(false);
    }
  }

  if (role === 'INSTRUCTOR' && !tip) return null;
  const canTip =
    role === 'INSTITUTION' &&
    booking.status === 'COMPLETED' &&
    (!tip || ['PENDING', 'FAILED', 'CANCELLED'].includes(tip.status));
  const resumeExisting = Boolean(
    (pending || tip?.status === 'PENDING') && !checkout,
  );
  const knownAmount = tip?.tipAmountPence;

  return (
    <View style={styles.section}>
      <Text style={styles.cardTitle}>Optional teacher tip</Text>
      <Text style={styles.cardBody}>{tipMessage(tip)}</Text>
      {tip?.amountRefundedPence && tip.status !== 'REFUNDED' ? (
        <Text style={styles.cardBody}>
          Partially refunded: {formatPence(tip.amountRefundedPence)} of{' '}
          {formatPence(tip.totalAmountPence)} total.
        </Text>
      ) : null}
      {tip?.disputeStatus ? (
        <Text style={jobStyles.error}>
          Payment dispute: {tip.disputeStatus.replace(/_/g, ' ').toLowerCase()}
        </Text>
      ) : null}
      {checkout ? (
        <View style={styles.section}>
          <Text style={styles.cardTitle}>Review your tip</Text>
          <Text style={styles.cardBody}>
            Teacher tip: {formatPence(checkout.tipAmountPence)}
          </Text>
          <Text style={styles.cardBody}>
            SupplyED fee: {formatPence(checkout.feeAmountPence)}
          </Text>
          <Text style={styles.cardTitle}>
            Total payment: {formatPence(checkout.totalAmountPence)}
          </Text>
          <Button
            title="Continue to Stripe"
            onPress={openCheckout}
            disabled={busy}
            loading={busy}
            compact
          />
          <Text style={styles.cardBody}>
            This checkout is already prepared. Check its status before changing
            the amount or starting another payment.
          </Text>
        </View>
      ) : canTip && resumeExisting ? (
        <>
          {knownAmount ? (
            <Button
              title="Resume tip checkout"
              variant="social"
              onPress={() => prepareTip(knownAmount)}
              disabled={busy}
              compact
            />
          ) : null}
          <Text style={styles.cardBody}>
            An earlier tip checkout may still be open. Check its status before
            trying again.
          </Text>
        </>
      ) : canTip && showForm ? (
        <>
          <Input
            label="TIP AMOUNT (GBP)"
            placeholder="For example, 10.00"
            decimal
            value={amount}
            onChangeText={setAmount}
            disabled={busy}
          />
          <Button
            title="Review tip and fee"
            onPress={() => prepareTip()}
            disabled={busy}
            loading={busy}
            compact
          />
          <Button
            title="Not now"
            variant="link"
            onPress={() => setShowForm(false)}
            disabled={busy}
            compact
          />
        </>
      ) : canTip ? (
        <Button
          title={tip ? 'Try tip again' : 'Add a tip'}
          variant="social"
          onPress={() => setShowForm(true)}
          disabled={busy}
          compact
        />
      ) : null}
      {role === 'INSTITUTION' && booking.status !== 'COMPLETED' && !tip ? (
        <Text style={styles.cardBody}>
          You can add an optional tip after the booking is completed.
        </Text>
      ) : null}
      {role === 'INSTITUTION' && (pending || tip) ? (
        <Button
          title="Check tip status"
          variant="social"
          onPress={checkTip}
          disabled={busy}
          compact
        />
      ) : null}
      {notice ? (
        <Text style={styles.cardBody} accessibilityLiveRegion="polite">
          {notice}
        </Text>
      ) : null}
      {error ? (
        <Text style={jobStyles.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
