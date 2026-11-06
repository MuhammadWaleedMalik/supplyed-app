import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import type { Booking } from '../../feature/dashboard/shared/apis/bookingsApi';
import type { InvoiceRole } from '../../feature/dashboard/shared/apis/invoicesApi';
import {
  createBookingTip,
  syncBookingTip,
} from '../../feature/dashboard/shared/apis/paymentsApi';
import {
  formatPence,
  isStripeCheckoutUrl,
} from '../../utils/payments/paymentUtils';
import Button from '../Ui/Button';
import Input from '../Ui/Input';
import StripePage from '../payments/StripePage';
import { useStyles } from './dashboardStyles';
import { useJobStyles } from './jobStyles';

type Props = {
  booking: Booking;
  role: InvoiceRole;
  onChanged: () => void | Promise<void | boolean>;
};

export default function BookingTipCard({ booking, role, onChanged }: Props) {
  const styles = useStyles();
  const jobStyles = useJobStyles();
  const [tip, setTip] = useState(booking.tip);
  const [amount, setAmount] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [checkout, setCheckout] = useState<{
    url: string;
    tipId: string;
    sessionId: string;
  }>();

  useEffect(() => setTip(booking.tip), [booking.tip]);

  async function startTip() {
    const value = amount.trim();
    if (!/^\d+(\.\d{1,2})?$/.test(value) || Number(value) < 0.3) {
      setError('Enter at least £0.30, with up to two decimal places.');
      return;
    }
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await createBookingTip(
        booking.id,
        Math.round(Number(value) * 100),
      );
      if (!isStripeCheckoutUrl(result.url))
        throw new Error('Stripe did not return a valid tip checkout.');
      setCheckout(result);
    } catch (problem) {
      setError(
        problem instanceof Error ? problem.message : 'Unable to start the tip.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function finishTip() {
    if (!checkout) return;
    const saved = checkout;
    setCheckout(undefined);
    setBusy(true);
    setError('');
    try {
      const result = await syncBookingTip(saved.tipId, saved.sessionId);
      setTip(previous =>
        previous ? { ...previous, status: result.status } : previous,
      );
      setNotice(
        result.status === 'PAID'
          ? 'Tip paid successfully.'
          : 'Tip submitted. Stripe is confirming the payment.',
      );
      setShowForm(false);
      setAmount('');
      await onChanged();
    } catch (problem) {
      setError(
        problem instanceof Error
          ? problem.message
          : 'Unable to check the tip payment.',
      );
    } finally {
      setBusy(false);
    }
  }

  if (role === 'INSTRUCTOR' && !tip) return null;
  const canTip =
    role === 'INSTITUTION' &&
    (!tip || ['PENDING', 'FAILED', 'CANCELLED'].includes(tip.status));

  return (
    <View style={styles.section}>
      {checkout ? (
        <StripePage
          title="Tip this teacher"
          url={checkout.url}
          onClose={() => {
            setCheckout(undefined);
            onChanged();
          }}
          onReturn={url => {
            try {
              const result = new URL(url).searchParams.get('tip');
              if (result !== 'success' && result !== 'cancelled') return false;
              if (result === 'success') finishTip();
              else {
                setCheckout(undefined);
                setNotice('Tip checkout was cancelled. No tip was charged.');
                onChanged();
              }
              return true;
            } catch {
              return false;
            }
          }}
        />
      ) : null}
      <Text style={styles.cardTitle}>Optional teacher tip</Text>
      <Text style={styles.cardBody}>
        {tip?.status === 'PAID'
          ? formatPence(tip.tipAmountPence) + ' tip paid to the teacher.'
          : tip?.status === 'PROCESSING'
          ? formatPence(tip.tipAmountPence) + ' tip is processing.'
          : tip?.paymentFailureMessage ||
            (role === 'INSTITUTION'
              ? 'A tip is optional and separate from the booking payment.'
              : 'No tip has been added to this booking.')}
      </Text>
      {canTip && showForm ? (
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
            title="Continue to Stripe"
            onPress={startTip}
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
      {notice ? <Text style={styles.cardBody}>{notice}</Text> : null}
      {error ? (
        <Text style={jobStyles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
