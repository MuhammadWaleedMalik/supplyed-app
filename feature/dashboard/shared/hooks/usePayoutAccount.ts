import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { openStripeConnect } from '../../../../utils/payments/paymentUtils';
import { payoutResultIsUncertain } from '../../../../utils/payments/payoutUtils';
import {
  createInstantPayout,
  createPayoutDashboardLink,
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
  // The ref also blocks two taps before React has rendered the disabled button.
  const actionRunning = useRef(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setNeedsRefresh(true);
    setError('');
    try {
      const latestAccount = await getPayoutAccount();
      setAccount(latestAccount);
      if (latestAccount.ready) {
        setBalance(await getPayoutBalance());
      } else {
        setBalance(undefined);
      }
      setNeedsRefresh(false);
      return true;
    } catch (problem) {
      setError(errorMessage(problem));
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const subscription = AppState.addEventListener('change', state => {
      // Stripe updates arrive through the backend, so read them again on return.
      if (state === 'active') refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  async function openPayouts() {
    if (actionRunning.current || loading) return;
    actionRunning.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      // Always request a fresh link. Stripe onboarding links expire quickly.
      const link = account?.ready
        ? await createPayoutDashboardLink()
        : await createPayoutOnboardingLink();
      await openStripeConnect(link.url);
    } catch (problem) {
      setError(errorMessage(problem));
    } finally {
      actionRunning.current = false;
      setBusy(false);
    }
  }

  async function withdraw(amountPence?: number) {
    if (actionRunning.current || loading || needsRefresh) return;
    const requested = amountPence ?? balance?.instantAvailablePence ?? 0;
    if (!account?.ready || !balance?.instantDestination) {
      setError(
        'Finish payout setup and add an eligible debit card before withdrawing.',
      );
      return;
    }
    if (!Number.isSafeInteger(requested) || requested < 40) {
      setError('The minimum instant withdrawal is £0.40.');
      return;
    }
    if (requested > balance.instantAvailablePence) {
      setError('The amount exceeds your available instant balance.');
      return;
    }

    actionRunning.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const payout = await createInstantPayout(amountPence);
      setNotice(
        'Withdrawal requested. Status: ' +
          payout.status.replace(/_/g, ' ') +
          '.',
      );
      // Until a successful refresh, do not allow another withdrawal on old data.
      setNeedsRefresh(true);
      await refresh();
    } catch (problem) {
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
      } else {
        setError(errorMessage(problem));
      }
    } finally {
      actionRunning.current = false;
      setBusy(false);
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
    withdraw,
  };
}
