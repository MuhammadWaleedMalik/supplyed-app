import { endpoints } from '../../../../constants/endpoints';
import { protectedRequest } from '../../../../utils/api/request';

export type PayoutAccount = {
  connected: boolean;
  ready: boolean;
  detailsSubmitted: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  requirementsDue: string[];
  disabledReason: string | null;
};

export type StripeLink = {
  url: string;
  expiresAt: string | null;
};

export type PayoutSummary = {
  id: string;
  amountPence: number;
  method: string;
  status: string;
  arrivalDate: string | null;
};

export type PayoutBalance = {
  pendingPence: number;
  availablePence: number;
  instantAvailablePence: number;
  instantDestination: { id: string; label: string } | null;
  recentPayouts: PayoutSummary[];
};

export function getPayoutAccount() {
  return protectedRequest<PayoutAccount>(endpoints.payoutAccount);
}

export function createPayoutOnboardingLink() {
  return protectedRequest<StripeLink>(endpoints.payoutOnboardingLink, 'POST');
}

export function createPayoutDashboardLink() {
  return protectedRequest<StripeLink>(endpoints.payoutDashboardLink, 'POST');
}

export function getPayoutBalance() {
  return protectedRequest<PayoutBalance>(endpoints.payoutBalance);
}

export function createInstantPayout(amountPence?: number) {
  // An empty body asks the backend to withdraw the full instant balance.
  const body = amountPence === undefined ? {} : { amountPence };
  return protectedRequest<PayoutSummary>(endpoints.instantPayout, 'POST', body);
}

export function getInstructorPayoutAccount(instructorId: string) {
  return protectedRequest<PayoutAccount>(
    endpoints.instructorPayoutAccounts +
      '/' +
      encodeURIComponent(instructorId.trim()),
  );
}
