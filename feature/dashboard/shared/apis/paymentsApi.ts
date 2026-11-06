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

export type SchoolBilling = {
  automaticPaymentsEnabled: boolean;
  canEnableAutomaticPayments: boolean;
  consentedAt: string | null;
  consentTermsVersion: string | null;
  currentPayment: {
    bookingId: string;
    jobTitle: string;
    failureCode: string | null;
    failureMessage: string | null;
    id: string;
    nextAttemptAt: string | null;
    paymentAttemptCount: number;
    status: string;
    totalAmountPence: number;
  } | null;
  lastSetupError: string | null;
  nextScheduledCollectionAt: string | null;
  paymentMethod: {
    label: string;
    last4: string;
    mandateStatus: string | null;
    type: string;
  } | null;
  setupStatus: 'NOT_STARTED' | 'PENDING' | 'READY' | 'FAILED';
  stripeSyncError: string | null;
  stripeSyncStatus: string;
};

export type SchoolBillingSession = {
  sessionId: string;
  url: string;
  expiresAt: number | string | null;
};

export type BookingTipCheckout = {
  tipId: string;
  sessionId: string;
  url: string;
  tipAmountPence: number;
  feeAmountPence: number;
  totalAmountPence: number;
};

export type BookingTipResult = {
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
  tipAmountPence: number;
  totalAmountPence: number;
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

export function getSchoolBilling() {
  return protectedRequest<SchoolBilling>(endpoints.schoolBilling);
}

export function createSchoolBillingSetup() {
  return protectedRequest<SchoolBillingSession>(
    endpoints.schoolBillingSetup,
    'POST',
    { consentToTerms: true },
  );
}

export function syncSchoolBilling(sessionId: string) {
  return protectedRequest<SchoolBilling>(endpoints.schoolBillingSync, 'POST', {
    sessionId,
  });
}

export function updateAutomaticPayments(enabled: boolean) {
  return protectedRequest<SchoolBilling>(endpoints.schoolBilling, 'PATCH', {
    automaticPaymentsEnabled: enabled,
    ...(enabled ? { consentToTerms: true } : {}),
  });
}

export function removeSchoolPaymentMethod() {
  return protectedRequest<SchoolBilling>(
    endpoints.schoolBillingPaymentMethod,
    'DELETE',
  );
}

export function createBookingTip(bookingId: string, amountPence: number) {
  return protectedRequest<BookingTipCheckout>(
    endpoints.bookingTipCheckout,
    'POST',
    { bookingId, amountPence },
  );
}

export function syncBookingTip(tipId: string, sessionId: string) {
  return protectedRequest<BookingTipResult>(
    endpoints.bookingTipSync(tipId),
    'POST',
    { sessionId },
  );
}
