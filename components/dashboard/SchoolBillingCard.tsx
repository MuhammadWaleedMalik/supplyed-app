import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Switch, Text, View } from 'react-native';
import { CreditCard } from 'lucide-react-native';
import {
  createSchoolBillingSetup,
  getSchoolBilling,
  removeSchoolPaymentMethod,
  SchoolBilling,
  updateAutomaticPayments,
} from '../../feature/dashboard/shared/apis/paymentsApi';
import { useForegroundRefresh } from '../../feature/dashboard/shared/hooks/useForegroundRefresh';
import {
  openBooking,
  refreshMarketplace,
  showPage,
} from '../../feature/dashboard/shared/store/navigationSlice';
import { useAppDispatch } from '../../store/hooks';
import { getSessionVersion } from '../../utils/api/session';
import {
  getPendingPaymentFlows,
  onPaymentFlowsChanged,
  PendingPaymentFlow,
  reconcilePaymentFlow,
  savePaymentFlow,
  withPaymentResourceLock,
} from '../../utils/payments/flowCoordinator';
import {
  automaticPaymentPhase,
  formatPence,
  isStripeCheckoutUrl,
  requiresCardAuthentication,
} from '../../utils/payments/paymentUtils';
import Button from '../Ui/Button';
import Checkbox from '../Ui/Checkbox';
import ConfirmDialog from '../Ui/ConfirmDialog';
import StripeCheckoutModal from '../payments/StripeCheckoutModal';
import SettingsCardHeader from './SettingsCardHeader';
import { useSettingsStyles } from './settingsStyles';

function message(problem: unknown) {
  return problem instanceof Error
    ? problem.message
    : 'Unable to update school billing.';
}

function ukDate(value: string) {
  return new Date(value).toLocaleString('en-GB', {
    timeZone: 'Europe/London',
    timeZoneName: 'short',
  });
}

function setupExpired(flow?: PendingPaymentFlow) {
  if (flow?.kind !== 'school-card' || flow.expiresAt == null) return false;
  const expires =
    typeof flow.expiresAt === 'number'
      ? flow.expiresAt * 1000
      : new Date(flow.expiresAt).getTime();
  return Number.isFinite(expires) && expires <= Date.now();
}

export default function SchoolBillingCard({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const styles = useSettingsStyles();
  const dispatch = useAppDispatch();
  const [billing, setBilling] = useState<SchoolBilling>();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [confirmDisable, setConfirmDisable] = useState(false);
  const [confirmFreshSetup, setConfirmFreshSetup] = useState(false);
  const [setupUncertain, setSetupUncertain] = useState(false);
  const [setupConsent, setSetupConsent] = useState(false);
  const [pendingSetup, setPendingSetup] = useState<PendingPaymentFlow>();
  const [checkout, setCheckout] = useState<{
    url: string;
    flow: PendingPaymentFlow;
  }>();
  const mounted = useRef(true);
  const actionLock = useRef(false);
  const refreshAttempt = useRef(0);

  const refresh = useCallback(async () => {
    const version = getSessionVersion();
    const attempt = ++refreshAttempt.current;
    try {
      const [result, flows] = await Promise.all([
        getSchoolBilling(),
        getPendingPaymentFlows(),
      ]);
      if (
        !mounted.current ||
        version !== getSessionVersion() ||
        attempt !== refreshAttempt.current
      )
        return;
      setBilling(result);
      setPendingSetup(flows.find(flow => flow.kind === 'school-card'));
      setError('');
    } catch (problem) {
      if (
        mounted.current &&
        version === getSessionVersion() &&
        attempt === refreshAttempt.current
      )
        setError(message(problem));
    } finally {
      if (
        mounted.current &&
        version === getSessionVersion() &&
        attempt === refreshAttempt.current
      )
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    refresh();
    const unsubscribe = onPaymentFlowsChanged(() => {
      refresh();
    });
    return () => {
      mounted.current = false;
      unsubscribe();
    };
  }, [refresh]);
  useForegroundRefresh(refresh, !busy);

  async function act(
    action: () => Promise<SchoolBilling>,
    success: (result: SchoolBilling) => string,
  ) {
    if (actionLock.current) return false;
    actionLock.current = true;
    const version = getSessionVersion();
    ++refreshAttempt.current;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await withPaymentResourceLock('school-card', action);
      if (!mounted.current || version !== getSessionVersion()) return false;
      setBilling(result);
      setNotice(success(result));
      dispatch(refreshMarketplace());
      return true;
    } catch (problem) {
      if (mounted.current && version === getSessionVersion())
        setError(message(problem));
      return false;
    } finally {
      actionLock.current = false;
      if (mounted.current && version === getSessionVersion()) setBusy(false);
    }
  }

  async function startSetup(replacePending = false) {
    if (
      actionLock.current ||
      !setupConsent ||
      (!replacePending &&
        (pendingSetup || billing?.setupStatus === 'PENDING' || setupUncertain))
    )
      return;
    actionLock.current = true;
    const version = getSessionVersion();
    setBusy(true);
    setSetupConsent(false);
    setError('');
    setNotice('');
    try {
      await withPaymentResourceLock('school-card', async () => {
        setSetupUncertain(true);
        const session = await createSchoolBillingSetup();
        if (version !== getSessionVersion()) return;
        if (!isStripeCheckoutUrl(session.url))
          throw new Error('Stripe did not return a valid setup page.');
        const flow = await savePaymentFlow({
          kind: 'school-card',
          sessionId: session.sessionId,
          expiresAt: session.expiresAt,
          replacingCard: Boolean(billing?.paymentMethod),
        });
        if (!mounted.current || version !== getSessionVersion()) return;
        setPendingSetup(flow);
        setSetupUncertain(false);
        setNotice(
          'Complete card setup securely in the mobile window.',
        );
        setCheckout({ url: session.url, flow });
      });
    } catch (problem) {
      if (mounted.current && version === getSessionVersion()) {
        await refresh();
        if (mounted.current && version === getSessionVersion())
          setError(message(problem));
      }
    } finally {
      actionLock.current = false;
      if (mounted.current && version === getSessionVersion()) setBusy(false);
    }
  }

  async function finishSetup(flow = pendingSetup) {
    if (!flow || actionLock.current) return;
    actionLock.current = true;
    const version = getSessionVersion();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const checked = await reconcilePaymentFlow(flow);
      if (!mounted.current || version !== getSessionVersion()) return;
      if (checked.state === 'needs-login' || checked.state === 'failed')
        throw new Error(
          checked.error || 'Unable to verify card setup. Please check again.',
        );
      const result = await getSchoolBilling();
      if (!mounted.current || version !== getSessionVersion()) return;
      setBilling(result);
      setNotice(
        result.setupStatus === 'FAILED'
          ? result.lastSetupError ||
              'Card setup failed. You can try a fresh setup.'
          : checked.state === 'resolved' && result.setupStatus === 'READY'
          ? result.automaticPaymentsEnabled
            ? 'Your saved card is ready and automatic payments are enabled.'
            : 'Your saved card is ready. Automatic payments are off.'
          : result.setupStatus === 'READY' &&
            flow.kind === 'school-card' &&
            flow.replacingCard
          ? 'Your currently saved card is ready. Complete the replacement in Stripe, then check the saved card details again.'
          : setupExpired(flow)
          ? 'This setup session has expired. Check the saved card below or start a new setup.'
          : 'Card setup is still awaiting confirmation. You can check again after completing Stripe setup.',
      );
      dispatch(refreshMarketplace());
      await refresh();
    } catch (problem) {
      if (mounted.current && version === getSessionVersion())
        setError(message(problem));
    } finally {
      actionLock.current = false;
      if (mounted.current && version === getSessionVersion()) setBusy(false);
    }
  }

  const hasCard = billing?.paymentMethod?.type === 'card';
  const legacyMethod = Boolean(billing?.paymentMethod && !hasCard);
  const current = billing?.currentPayment;
  const phase = current ? automaticPaymentPhase(current) : null;
  const replacesSetup = Boolean(
    pendingSetup || billing?.setupStatus === 'PENDING' || setupUncertain,
  );

  function requestSetup() {
    if (actionLock.current || !setupConsent) return;
    if (replacesSetup) setConfirmFreshSetup(true);
    else startSetup();
  }

  return (
    <View style={styles.card}>
      <ConfirmDialog
        visible={confirmFreshSetup}
        title="Start a fresh card setup?"
        description="Check setup status first if you already completed Stripe. Starting fresh replaces the previous checkout, so the older session will no longer complete setup. Continue when you want to restart card entry."
        confirmLabel="Start fresh setup"
        onClose={() => setConfirmFreshSetup(false)}
        onConfirm={() => {
          setConfirmFreshSetup(false);
          return startSetup(true);
        }}
      />
      <StripeCheckoutModal
        visible={Boolean(checkout)}
        url={checkout?.url || 'about:blank'}
        onClose={result => {
          const flow = checkout?.flow;
          setCheckout(undefined);
          if (result === 'cancelled')
            setNotice('Card setup was cancelled. No card was changed.');
          if (flow) finishSetup(flow).catch(() => {});
        }}
      />
      <ConfirmDialog
        visible={confirmRemove}
        title="Remove payment method?"
        description="Automatic booking payments will be disabled until a new card is connected. A payment already processing may still complete."
        confirmLabel="Remove card"
        destructive
        onClose={() => setConfirmRemove(false)}
        onConfirm={() =>
          act(removeSchoolPaymentMethod, result =>
            result.stripeSyncStatus === 'SYNCED'
              ? 'The saved payment method was removed.'
              : 'Removal was recorded. Stripe collection changes are still being reconciled.',
          )
        }
      />
      <ConfirmDialog
        visible={confirmDisable}
        title="Turn off automatic payments?"
        description="Future automatic booking submissions will stop. A payment already processing may still complete, and existing Stripe collections may need time to reconcile."
        confirmLabel="Turn off payments"
        onClose={() => setConfirmDisable(false)}
        onConfirm={() =>
          act(
            () => updateAutomaticPayments(false),
            result =>
              result.stripeSyncStatus === 'SYNCED'
                ? 'Automatic payments are off. A payment already processing may still complete.'
                : 'Your opt-out was recorded. Stripe collection changes are still being reconciled.',
          )
        }
      />
      <SettingsCardHeader
        icon={CreditCard}
        title="AUTOMATIC PAYMENTS"
        note="Add a card securely with Stripe. Eligible booking payments are charged when due, without a separate release."
      />
      {loading ? (
        <Text style={styles.cardNote}>Loading billing setup...</Text>
      ) : null}
      {billing ? (
        <>
          <View style={styles.section}>
            <Text style={styles.recordValue}>
              {hasCard
                ? 'Replace your saved card'
                : 'Set up automatic card payments'}
            </Text>
            <Text style={styles.cardNote}>
              Enter your card details in Stripe's secure mobile window. SupplyED stores
              Stripe references and masked details only. No booking payment is
              taken during card setup.
            </Text>
            <Checkbox
              label="I authorise SupplyED to save my card with Stripe and charge eligible booking payments automatically."
              checked={setupConsent}
              disabled={busy}
              onChange={setSetupConsent}
            />
            <Text style={styles.cardNote}>
              Payments follow each booking's agreed schedule: daily, weekly,
              monthly or on completion. The amount is payable teacher earnings
              plus the displayed SupplyED fee. Absences are excluded where
              attendance determines pay. I can turn off future automatic
              payments in Billing.
            </Text>
            <Button
              title={
                replacesSetup
                  ? 'Start a fresh card setup'
                  : hasCard
                  ? 'Replace card securely'
                  : legacyMethod
                  ? 'Replace with a card'
                  : 'Add card and enable automatic payments'
              }
              disabled={busy || loading || !setupConsent}
              loading={busy}
              onPress={requestSetup}
            />
          </View>
          {pendingSetup ? (
            <View style={styles.section}>
              <Text style={styles.cardNote}>
                {setupExpired(pendingSetup)
                  ? 'The earlier setup session has expired. You can start a fresh setup above.'
                  : 'Card setup is pending. Check its status first. To restart card entry, give fresh consent above and deliberately replace that checkout. Closing the Stripe window does not change automatic-payment settings.'}
              </Text>
              <Button
                title="I completed Stripe setup — check status"
                variant="social"
                disabled={busy}
                onPress={finishSetup}
              />
            </View>
          ) : null}
          {!pendingSetup &&
          (billing.setupStatus === 'PENDING' || setupUncertain) ? (
            <Text style={styles.cardNote}>
              The earlier setup could not be confirmed. Refresh billing to check
              your saved card. To restart, give fresh consent above and confirm a
              new setup. This replaces the earlier Stripe session.
            </Text>
          ) : null}
          <View style={styles.record}>
            <Text style={styles.recordLabel}>SAVED PAYMENT METHOD</Text>
            <Text
              style={
                billing.setupStatus === 'READY'
                  ? styles.success
                  : styles.recordValue
              }
            >
              {billing.paymentMethod?.label || 'No saved card'}
            </Text>
            <Text style={styles.cardNote}>
              Card setup: {billing.setupStatus.replace(/_/g, ' ').toLowerCase()}
            </Text>
            {billing.paymentMethod ? (
              <Button
                title="Remove payment method"
                variant="link"
                disabled={busy}
                onPress={() => setConfirmRemove(true)}
              />
            ) : null}
          </View>
          {legacyMethod ? (
            <Text style={styles.cardNote}>
              Replace your previous payment method with a card to continue
              automatic payments. Payments already submitted keep their existing
              Stripe status.
            </Text>
          ) : null}
          {billing.lastSetupError ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {billing.lastSetupError}
            </Text>
          ) : null}
          <View style={styles.automationSwitchCard}>
            <View style={styles.automationSwitchCopy}>
              <Text style={styles.automationSwitchTitle}>
                Automatic booking payments
              </Text>
              <Text style={styles.cardNote}>
                {billing.automaticPaymentsEnabled
                  ? 'On — eligible booking payments follow their agreed schedule.'
                  : 'Off — completed eligible bookings can be paid manually.'}
              </Text>
            </View>
            <Switch
              accessibilityLabel="Automatic booking payments"
              accessibilityHint="Enables or disables automatic charges on the backend"
              value={billing.automaticPaymentsEnabled}
              disabled={
                busy ||
                (!billing.automaticPaymentsEnabled &&
                  (!hasCard || !billing.canEnableAutomaticPayments))
              }
              trackColor={{ false: '#d8dee3', true: '#83d4a4' }}
              thumbColor={
                billing.automaticPaymentsEnabled ? '#14833b' : '#ffffff'
              }
              onValueChange={enabled => {
                if (!enabled) {
                  setConfirmDisable(true);
                  return;
                }
                act(
                  () => updateAutomaticPayments(true),
                  result =>
                    result.automaticPaymentsEnabled
                      ? 'Automatic payments are enabled.'
                      : 'Your preference was recorded. Refresh to check the latest status.',
                );
              }}
            />
          </View>
          <Text style={styles.cardNote}>
            Turning this on authorises SupplyED to charge your saved card for
            eligible teacher earnings and the displayed fee. Turning it off
            updates the backend and stops new automatic payment submissions.
          </Text>
          {!billing.canEnableAutomaticPayments &&
          !billing.automaticPaymentsEnabled ? (
            <Text style={styles.cardNote}>
              Complete card setup above to enable automatic payments.
            </Text>
          ) : null}
          {billing.consentedAt && billing.consentTermsVersion ? (
            <Text style={styles.cardNote}>
              Latest authorisation: {ukDate(billing.consentedAt)} · terms{' '}
              {billing.consentTermsVersion}
            </Text>
          ) : null}
          {billing.stripeSyncStatus !== 'SYNCED' ? (
            <Text accessibilityLiveRegion="polite" style={styles.error}>
              New automatic submissions are blocked locally. Stripe-side
              collection is{' '}
              {billing.stripeSyncStatus === 'FAILED'
                ? 'waiting for reconciliation'
                : 'being reconciled'}
              .{billing.stripeSyncError ? ` ${billing.stripeSyncError}` : ''}
            </Text>
          ) : billing.stripeSyncError ? (
            <Text style={styles.error}>{billing.stripeSyncError}</Text>
          ) : null}
          {current ? (
            <View style={styles.record}>
              <Text style={styles.recordLabel}>CURRENT AUTOMATIC PAYMENT</Text>
              <Text style={styles.recordValue}>
                {requiresCardAuthentication(current.failureCode)
                  ? 'Card approval required'
                  : phase === 'failed'
                  ? 'Needs attention'
                  : phase === 'scheduled'
                  ? 'Scheduled'
                  : phase === 'preparing'
                  ? 'Preparing'
                  : phase === 'paid'
                  ? 'Paid'
                  : 'Processing'}
              </Text>
              <Text style={styles.recordValue}>
                {current.jobTitle} · {formatPence(current.totalAmountPence)}
              </Text>
              {current.failureMessage ? (
                <Text style={styles.error}>{current.failureMessage}</Text>
              ) : (
                <Text style={styles.cardNote}>
                  {phase === 'scheduled'
                    ? 'Stripe will charge this automatically. No release or approval is needed.'
                    : 'Payment status updates when Stripe confirms the result.'}
                </Text>
              )}
              {current.nextAttemptAt ? (
                <Text style={styles.cardNote}>
                  Next provider attempt: {ukDate(current.nextAttemptAt)}
                </Text>
              ) : null}
              <Button
                title="View this booking"
                variant="link"
                onPress={() => {
                  dispatch(openBooking(current.bookingId));
                  onNavigate?.();
                }}
              />
              {current.failureMessage ? (
                <Button
                  title="Review invoices in Billing"
                  variant="social"
                  onPress={() => {
                    dispatch(showPage('Billing'));
                    onNavigate?.();
                  }}
                />
              ) : null}
            </View>
          ) : (
            <Text style={styles.cardNote}>
              No automatic payment is currently processing. The next charge is
              created when an eligible booking payment becomes due.
            </Text>
          )}
          {billing.nextScheduledCollectionAt ? (
            <Text style={styles.cardNote}>
              Next scheduled collection:{' '}
              {ukDate(billing.nextScheduledCollectionAt)}
            </Text>
          ) : null}
        </>
      ) : null}
      <Button
        title={loading ? 'Refreshing...' : 'Refresh billing setup'}
        variant="social"
        disabled={busy || loading}
        onPress={refresh}
      />
      {notice ? (
        <Text accessibilityLiveRegion="polite" style={styles.recordValue}>
          {notice}
        </Text>
      ) : null}
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
