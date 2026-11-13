import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking } from 'react-native';
import { PAYMENT_WEB_URL } from '../../../../constants/payments';
import { isStripeConnectUrl } from '../../../../utils/payments/paymentUtils';
import {
  payoutResultIsUncertain,
  payoutStatusLabel,
  payoutPollingInterval,
} from '../../../../utils/payments/payoutUtils';
import { getSessionVersion } from '../../../../utils/api/session';
import {
  onPaymentFlowsChanged,
  openPaymentFlow,
  savePaymentFlow,
  withPaymentResourceLock,
} from '../../../../utils/payments/flowCoordinator';
import { useForegroundRefresh } from './useForegroundRefresh';
import {
  createInstantPayout,
  createPayoutOnboardingLink,
  getPayoutAccount,
  getPayoutBalance,
  PayoutAccount,
  PayoutBalance,
} from '../apis/paymentsApi';

function errorMessage(problem: unknown) {
  return problem instanceof Error ? problem.message : 'Unable to load payouts.';
}

export function usePayoutAccount() {
  const [account, setAccount] = useState<PayoutAccount>();
  const [balance, setBalance] = useState<PayoutBalance>();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [refreshFailures, setRefreshFailures] = useState(0);
  // The ref also blocks two taps before React has rendered the disabled button.
  const actionRunning = useRef(false);
  const refreshing = useRef<Promise<boolean> | null>(null);
  const mounted = useRef(true);
  const session = useRef(getSessionVersion()).current;
  const isActive = useCallback(
    () => mounted.current && getSessionVersion() === session,
    [session],
  );

  const refresh = useCallback((): Promise<boolean> => {
    if (!isActive()) return Promise.resolve(false);
    if (refreshing.current) return refreshing.current;
    const operation = (async () => {
      setLoading(true);
      setNeedsRefresh(true);
      setError('');
      try {
        const latestAccount = await getPayoutAccount();
        if (!isActive()) return false;
        setAccount(latestAccount);
        if (latestAccount.ready) {
          const latestBalance = await getPayoutBalance();
          if (!isActive()) return false;
          setBalance(latestBalance);
        } else {
          setBalance(undefined);
        }
        setNeedsRefresh(false);
        setRefreshFailures(0);
        return true;
      } catch (problem) {
        if (!isActive()) return false;
        setError(errorMessage(problem));
        setRefreshFailures(value => value + 1);
        return false;
      } finally {
        refreshing.current = null;
        if (isActive()) setLoading(false);
      }
    })();
    refreshing.current = operation;
    return operation;
  }, [isActive]);

  useEffect(() => {
    mounted.current = true;
    refresh();
    const unsubscribe = onPaymentFlowsChanged(() => {
      if (!actionRunning.current) return refresh();
    });
    return () => {
      mounted.current = false;
      unsubscribe();
    };
  }, [refresh]);

  // Only mounted, foreground screens poll. A returned Stripe page never proves
  // readiness or bank arrival; both come from the authenticated backend.
  useForegroundRefresh(
    () => {
      if (!actionRunning.current) return refresh();
    },
    true,
    payoutPollingInterval(account, balance, refreshFailures),
  );

  async function openPayouts() {
    if (!isActive() || actionRunning.current || loading || refreshing.current)
      return;
    actionRunning.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await withPaymentResourceLock('teacher-onboarding', async () => {
        // Onboarding also collects newly required payout details. An Express
        // dashboard is not available for the backend's default account mode.
        // Never keep the signed link; request a fresh one for every visit.
        const link = await createPayoutOnboardingLink();
        if (!isActive()) return;
        if (!isStripeConnectUrl(link.url))
          throw new Error('Stripe did not return a valid payout link.');
        if (link.expiresAt && Date.parse(link.expiresAt) <= Date.now())
          throw new Error('The payout setup link expired. Please try again.');
        const flow = await savePaymentFlow({ kind: 'teacher-onboarding' });
        if (!isActive()) return;
        await openPaymentFlow(flow, link.url);
        if (!isActive()) return;
        setNotice(
          'Stripe opened in your browser. Return here to check your payout status after updating your details.',
        );
      });
    } catch (problem) {
      if (isActive()) setError(errorMessage(problem));
    } finally {
      actionRunning.current = false;
      if (isActive()) setBusy(false);
    }
  }

  async function withdraw(amountPence?: number) {
    if (
      !isActive() ||
      actionRunning.current ||
      loading ||
      refreshing.current ||
      needsRefresh
    )
      return false;
    const requested = amountPence ?? balance?.instantAvailablePence ?? 0;
    if (!account?.ready || !balance?.instantDestination) {
      setError(
        'Finish payout setup and add an eligible debit card before withdrawing.',
      );
      return false;
    }
    if (!Number.isSafeInteger(requested) || requested < 40) {
      setError('The minimum instant withdrawal is £0.40.');
      return false;
    }
    if (requested > balance.instantAvailablePence) {
      setError('The amount exceeds your available instant balance.');
      return false;
    }

    actionRunning.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const payout = await createInstantPayout(amountPence);
      if (!isActive()) return true;
      setNotice(
        'Withdrawal requested. Status: ' +
          payoutStatusLabel(payout.status) +
          '. A pending or in-transit payout has not reached your bank yet.',
      );
      // Until a successful refresh, do not allow another withdrawal on old data.
      setNeedsRefresh(true);
      await refresh();
      return true;
    } catch (problem) {
      if (!isActive()) return true;
      if (payoutResultIsUncertain(problem)) {
        setNeedsRefresh(true);
        setNotice(
          'We could not confirm the withdrawal. Review the latest balance and recent payouts before trying again.',
        );
        const refreshed = await refresh();
        if (!refreshed) {
          setError(
            'Unable to check the withdrawal. Refresh payouts before trying again.',
          );
        }
        // Close this confirmation after an uncertain submission. A new attempt
        // must start with a new review of the balance, history and destination.
        return true;
      } else {
        setError(errorMessage(problem));
        return false;
      }
    } finally {
      actionRunning.current = false;
      if (isActive()) setBusy(false);
    }
  }

  async function openWebsitePayouts() {
    if (!isActive() || actionRunning.current) return;
    actionRunning.current = true;
    setBusy(true);
    setError('');
    try {
      await Linking.openURL(PAYMENT_WEB_URL + '/billing');
      if (isActive())
        setNotice(
          'Manage bank details in your SupplyED website account. You may need to sign in there. Return here to refresh your payouts.',
        );
    } catch {
      if (isActive())
        setError('Unable to open the SupplyED website. Please try again.');
    } finally {
      actionRunning.current = false;
      if (isActive()) setBusy(false);
    }
  }

  return {
    account,
    balance,
    loading,
    busy,
    needsRefresh,
    error,
    notice,
    refresh,
    openPayouts,
    openWebsitePayouts,
    withdraw,
  };
}
