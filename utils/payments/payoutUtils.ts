import { ApiError } from '../api/request';
import type {
  PayoutAccount,
  PayoutBalance,
} from '../../feature/dashboard/shared/apis/paymentsApi';

// Keep pounds as text until converting to whole pence, without rounding floats.
export function readPayoutAmount(value: string) {
  const text = value.trim();
  if (!text) return undefined;
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) {
    throw new Error('Enter an amount in pounds with up to two decimal places.');
  }
  const [pounds, fraction = ''] = text.split('.');
  const pence = Number(pounds) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(pence)) {
    throw new Error('Enter a valid withdrawal amount.');
  }
  return pence;
}

export function payoutResultIsUncertain(problem: unknown) {
  if (!(problem instanceof ApiError)) return true;
  return (
    problem.status === 0 || problem.status === 408 || problem.status >= 500
  );
}

export function payoutStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: 'Pending',
    in_transit: 'In transit',
    paid: 'Paid',
    failed: 'Failed',
    canceled: 'Cancelled',
    cancelled: 'Cancelled',
  };
  return labels[status] || status.replace(/_/g, ' ') || 'Unknown';
}

export function payoutPollingInterval(
  account?: PayoutAccount,
  balance?: PayoutBalance,
  failures = 0,
) {
  const reviewing = account?.connected && !account.ready;
  const pending =
    (balance?.pendingPence ?? 0) > 0 ||
    balance?.recentPayouts.some(payout =>
      ['pending', 'in_transit'].includes(payout.status),
    );
  const interval = reviewing ? 5000 : pending ? 30000 : 0;
  // Back off after failures instead of retrying at the normal polling speed.
  // Foreground/manual refresh still remains available.
  return interval && failures
    ? Math.min(120000, interval * 2 ** Math.min(failures, 5))
    : interval;
}

export function describePayoutRequirement(requirement: string) {
  const lower = requirement.toLowerCase();
  if (lower.includes('external_account')) return 'Bank account or debit card';
  if (lower.includes('tos_acceptance')) return 'Accept Stripe terms';
  if (lower.includes('verification.document')) return 'Identity document';
  if (lower.includes('verification.additional_document'))
    return 'Additional identity document';
  if (lower.includes('dob')) return 'Date of birth';
  if (lower.includes('address')) return 'Home address';
  return requirement.replace(/[._]/g, ' ');
}
