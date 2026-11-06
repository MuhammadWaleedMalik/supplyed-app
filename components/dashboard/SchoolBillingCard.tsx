import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { CreditCard } from 'lucide-react-native';
import {
  createSchoolBillingSetup,
  getSchoolBilling,
  removeSchoolPaymentMethod,
  SchoolBilling,
  syncSchoolBilling,
  updateAutomaticPayments,
} from '../../feature/dashboard/shared/apis/paymentsApi';
import { getSessionVersion } from '../../utils/api/session';
import { isStripeCheckoutUrl } from '../../utils/payments/paymentUtils';
import Button from '../Ui/Button';
import ConfirmDialog from '../Ui/ConfirmDialog';
import StripePage from '../payments/StripePage';
import SettingsCardHeader from './SettingsCardHeader';
import { useSettingsStyles } from './settingsStyles';

function message(problem: unknown) {
  return problem instanceof Error
    ? problem.message
    : 'Unable to update school billing.';
}

export default function SchoolBillingCard() {
  const styles = useSettingsStyles();
  const [billing, setBilling] = useState<SchoolBilling>();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [pendingSetup, setPendingSetup] = useState(false);
  const [stripeUrl, setStripeUrl] = useState('');
  const mounted = useRef(true);
  const setupSession = useRef('');

  const refresh = useCallback(async () => {
    const version = getSessionVersion();
    setLoading(true);
    setError('');
    try {
      const result = await getSchoolBilling();
      if (mounted.current && version === getSessionVersion()) setBilling(result);
    } catch (problem) {
      if (mounted.current && version === getSessionVersion())
        setError(message(problem));
    } finally {
      if (mounted.current && version === getSessionVersion()) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    refresh();
    return () => {
      mounted.current = false;
    };
  }, [refresh]);

  async function act(action: () => Promise<SchoolBilling>, success: string) {
    if (busy) return;
    const version = getSessionVersion();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await action();
      if (!mounted.current || version !== getSessionVersion()) return;
      setBilling(result);
      setNotice(success);
    } catch (problem) {
      if (mounted.current && version === getSessionVersion())
        setError(message(problem));
    } finally {
      if (mounted.current && version === getSessionVersion()) setBusy(false);
    }
  }

  async function startSetup() {
    if (busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const session = await createSchoolBillingSetup();
      if (!isStripeCheckoutUrl(session.url))
        throw new Error('Stripe did not return a valid setup page.');
      setupSession.current = session.sessionId;
      setPendingSetup(true);
      setStripeUrl(session.url);
    } catch (problem) {
      setError(message(problem));
    } finally {
      if (mounted.current) setBusy(false);
    }
  }

  async function finishSetup() {
    const sessionId = setupSession.current;
    if (!sessionId) {
      await refresh();
      return;
    }
    await act(async () => {
      const result = await syncSchoolBilling(sessionId);
      setupSession.current = '';
      setPendingSetup(false);
      return result;
    }, 'Your school payment method is connected.');
  }

  function handleStripeReturn(value: string) {
    try {
      const url = new URL(value);
      const result = url.searchParams.get('setup');
      if (result !== 'success' && result !== 'cancelled') return false;
      setStripeUrl('');
      if (result === 'success') finishSetup();
      else setNotice('Card setup was cancelled. No payment method changed.');
      return true;
    } catch {
      return false;
    }
  }

  return (
    <View style={styles.card}>
      {stripeUrl ? (
        <StripePage
          title="Connect payment method"
          url={stripeUrl}
          onClose={() => setStripeUrl('')}
          onReturn={handleStripeReturn}
        />
      ) : null}
      <ConfirmDialog
        visible={confirmRemove}
        title="Remove payment method?"
        description="Automatic booking payments will be disabled until a new card is connected."
        confirmLabel="Remove card"
        destructive
        onClose={() => setConfirmRemove(false)}
        onConfirm={() => {
          setConfirmRemove(false);
          act(removeSchoolPaymentMethod, 'The payment method was removed.');
        }}
      />
      <SettingsCardHeader
        icon={CreditCard}
        title="SCHOOL PAYMENT METHOD"
        note="Connect a card securely with Stripe for booking and invoice payments."
      />
      {loading ? <Text style={styles.cardNote}>Loading billing setup...</Text> : null}
      {billing ? (
        <>
          <Text
            style={
              billing.setupStatus === 'READY'
                ? styles.success
                : styles.recordValue
            }
          >
            {billing.paymentMethod?.label ||
              (billing.setupStatus === 'PENDING'
                ? 'Stripe setup is pending'
                : 'No payment method connected')}
          </Text>
          {billing.lastSetupError ? (
            <Text style={styles.error}>{billing.lastSetupError}</Text>
          ) : null}
          {billing.currentPayment ? (
            <View style={styles.record}>
              <Text style={styles.recordLabel}>CURRENT COLLECTION</Text>
              <Text style={styles.recordValue}>
                {billing.currentPayment.jobTitle} · £
                {(billing.currentPayment.totalAmountPence / 100).toFixed(2)} ·{' '}
                {billing.currentPayment.status}
              </Text>
              {billing.currentPayment.failureMessage ? (
                <Text style={styles.error}>
                  {billing.currentPayment.failureMessage}
                </Text>
              ) : null}
              {billing.currentPayment.nextAttemptAt ? (
                <Text style={styles.cardNote}>
                  Next attempt:{' '}
                  {new Date(
                    billing.currentPayment.nextAttemptAt,
                  ).toLocaleString('en-GB')}
                </Text>
              ) : null}
            </View>
          ) : null}
          {billing.nextScheduledCollectionAt ? (
            <Text style={styles.cardNote}>
              Next scheduled collection:{' '}
              {new Date(billing.nextScheduledCollectionAt).toLocaleString(
                'en-GB',
              )}
            </Text>
          ) : null}
          <Button
            title={
              busy
                ? 'Please wait...'
                : billing.paymentMethod
                ? 'Replace payment method'
                : 'Connect payment method'
            }
            disabled={busy || loading}
            onPress={startSetup}
          />
          {pendingSetup ? (
            <Button
              title="I completed Stripe setup"
              variant="social"
              disabled={busy}
              onPress={finishSetup}
            />
          ) : null}
          {billing.canEnableAutomaticPayments ? (
            <Button
              title={
                billing.automaticPaymentsEnabled
                  ? 'Disable automatic payments'
                  : 'Enable automatic payments'
              }
              variant="social"
              disabled={busy}
              onPress={() =>
                act(
                  () =>
                    updateAutomaticPayments(
                      !billing.automaticPaymentsEnabled,
                    ),
                  billing.automaticPaymentsEnabled
                    ? 'Automatic payments are disabled.'
                    : 'Automatic payments are enabled.',
                )
              }
            />
          ) : null}
          {billing.paymentMethod ? (
            <Button
              title="Remove payment method"
              variant="link"
              disabled={busy}
              onPress={() => setConfirmRemove(true)}
            />
          ) : null}
        </>
      ) : null}
      <Button
        title={loading ? 'Refreshing...' : 'Refresh billing setup'}
        variant="social"
        disabled={busy || loading}
        onPress={refresh}
      />
      {notice ? <Text style={styles.recordValue}>{notice}</Text> : null}
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    </View>
  );
}
