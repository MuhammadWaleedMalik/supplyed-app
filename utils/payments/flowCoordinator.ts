import { AppState, Linking } from 'react-native';
import {
  getAccessToken,
  getCurrentSessionUser,
  getSessionVersion,
} from '../api/session';
import {
  getPayoutAccount,
  getPayoutBalance,
  syncBookingTip,
  syncSchoolBilling,
} from '../../feature/dashboard/shared/apis/paymentsApi';
import { syncInvoice } from '../../constants/paymentSessionsApi';
import {
  isStripeCheckoutUrl,
  isStripeConnectUrl,
  isStripeInvoiceUrl,
} from './paymentUtils';
import {
  loadPaymentFlows,
  paymentFlowReferences,
  persistPaymentFlow,
  removePaymentFlow,
  type PaymentFlowInput,
  type PendingPaymentFlow,
} from './pendingFlows';

export { onPaymentFlowsChanged } from './pendingFlows';
export type { PendingPaymentFlow, PaymentFlowInput } from './pendingFlows';
export type PaymentFlowResult = {
  flow: PendingPaymentFlow;
  state: 'resolved' | 'waiting' | 'needs-login' | 'failed';
  data?: unknown;
  error?: string;
  status?: number;
};

const resourceLocks = new Set<string>();
const reconciliations = new Map<string, Promise<PaymentFlowResult>>();

function account() {
  const userId = getCurrentSessionUser()?.id;
  if (!userId || !getAccessToken())
    throw new Error('Please sign in to continue with this payment.');
  return { userId, version: getSessionVersion() };
}

function owns(flow: PendingPaymentFlow, version = getSessionVersion()) {
  return (
    !!getAccessToken() &&
    flow.userId === getCurrentSessionUser()?.id &&
    version === getSessionVersion()
  );
}

export async function withPaymentResourceLock<T>(
  resource: string,
  action: () => Promise<T>,
): Promise<T> {
  const { userId } = account();
  const key = userId + ':' + resource;
  if (resourceLocks.has(key))
    throw new Error(
      'This payment is already being prepared. Check its status before trying again.',
    );
  resourceLocks.add(key);
  try {
    return await action();
  } finally {
    resourceLocks.delete(key);
  }
}

export async function getPendingPaymentFlows() {
  const { userId, version } = account();
  const flows = await loadPaymentFlows(userId);
  return version === getSessionVersion() &&
    userId === getCurrentSessionUser()?.id
    ? flows
        .reverse()
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    : [];
}

export async function savePaymentFlow(
  input: PaymentFlowInput,
): Promise<PendingPaymentFlow> {
  const { userId, version } = account();
  const flow: PendingPaymentFlow = {
    ...paymentFlowReferences(input),
    version: 1,
    userId,
    flowId: Date.now().toString(36) + '-' + Math.random().toString(36).slice(2),
    createdAt: new Date().toISOString(),
  };
  const saved = await persistPaymentFlow(flow);
  if (!owns(flow, version))
    throw new Error(
      'Your account changed. Reopen payments from the original account.',
    );
  return saved;
}

export async function openPaymentFlow(flow: PendingPaymentFlow, url: string) {
  const version = getSessionVersion();
  if (!owns(flow, version))
    throw new Error(
      'Sign in to the original account to continue this payment.',
    );
  const valid =
    flow.kind === 'invoice'
      ? isStripeInvoiceUrl(url)
      : flow.kind === 'teacher-onboarding'
      ? isStripeConnectUrl(url)
      : isStripeCheckoutUrl(url);
  if (!valid)
    throw new Error('Stripe did not return a valid secure payment page.');
  const saved = await loadPaymentFlows(flow.userId);
  if (!owns(flow, version) || !saved.some(item => item.flowId === flow.flowId))
    throw new Error('Save this payment for recovery before opening Stripe.');
  if (flow.kind === 'school-card' && flow.expiresAt !== null) {
    const expiry =
      typeof flow.expiresAt === 'number'
        ? flow.expiresAt * 1000
        : Date.parse(flow.expiresAt);
    if (expiry <= Date.now())
      throw new Error('This setup link has expired. Start a fresh card setup.');
  }
  // No API credentials are sent to the provider. References remain saved if opening fails.
  await Linking.openURL(url);
}

export function reconcilePaymentFlow(
  flow: PendingPaymentFlow,
): Promise<PaymentFlowResult> {
  const key = flow.userId + ':' + flow.flowId;
  const existing = reconciliations.get(key);
  if (existing) return existing;
  const request = reconcile(flow).finally(() => {
    reconciliations.delete(key);
  });
  reconciliations.set(key, request);
  return request;
}

async function reconcile(flow: PendingPaymentFlow): Promise<PaymentFlowResult> {
  const version = getSessionVersion();
  if (!owns(flow, version)) return { flow, state: 'needs-login' };
  try {
    let data: unknown;
    let resolved = false;
    switch (flow.kind) {
      case 'school-card': {
        const billing = await syncSchoolBilling(flow.sessionId);
        data = billing;
        const expiry =
          flow.expiresAt === null
            ? Infinity
            : typeof flow.expiresAt === 'number'
            ? flow.expiresAt * 1000
            : Date.parse(flow.expiresAt);
        // READY can describe the existing card while replacement Checkout is
        // still open. Keep that reference for missed-webhook recovery until expiry.
        resolved =
          billing.setupStatus === 'FAILED' ||
          expiry <= Date.now() ||
          (billing.setupStatus === 'READY' &&
            billing.automaticPaymentsEnabled &&
            !flow.replacingCard);
        break;
      }
      case 'tip': {
        const tip = await syncBookingTip(flow.tipId, flow.sessionId);
        data = tip;
        resolved = ['PAID', 'FAILED', 'CANCELLED', 'REFUNDED'].includes(
          tip.status,
        );
        break;
      }
      case 'invoice': {
        const invoice = await syncInvoice(flow.invoiceId);
        data = invoice;
        resolved = ['PAID', 'VOID'].includes(invoice.status);
        break;
      }
      case 'teacher-onboarding': {
        const accountState = await getPayoutAccount();
        if (!owns(flow, version)) return { flow, state: 'needs-login' };
        const balance = await getPayoutBalance();
        data = { account: accountState, balance };
        resolved = accountState.ready;
        break;
      }
    }
    if (!owns(flow, version)) return { flow, state: 'needs-login' };
    if (resolved) await removePaymentFlow(flow.userId, flow.flowId);
    if (!owns(flow, version)) return { flow, state: 'needs-login' };
    return { flow, state: resolved ? 'resolved' : 'waiting', data };
  } catch (error) {
    if (!owns(flow, version)) return { flow, state: 'needs-login' };
    const status =
      typeof error === 'object' && error !== null && 'status' in error
        ? Number(error.status)
        : 0;
    if (flow.kind === 'school-card' && status === 404) {
      await removePaymentFlow(flow.userId, flow.flowId);
      if (!owns(flow, version)) return { flow, state: 'needs-login' };
    }
    return {
      flow,
      state: status === 401 ? 'needs-login' : 'failed',
      status,
      error:
        error instanceof Error
          ? error.message
          : 'Unable to check this payment. Please check again.',
    };
  }
}

export async function reconcilePendingPayments(
  shouldContinue: () => boolean = () => true,
) {
  const flows = await getPendingPaymentFlows();
  const version = getSessionVersion();
  const results: PaymentFlowResult[] = [];
  for (const flow of flows) {
    if (
      !shouldContinue() ||
      !owns(flow, version) ||
      AppState.currentState !== 'active'
    )
      break;
    let result = await reconcilePaymentFlow(flow);
    for (
      let attempt = 1;
      flow.kind === 'invoice' && result.state === 'waiting' && attempt < 5;
      attempt++
    ) {
      await new Promise<void>(resolve => setTimeout(resolve, 1500));
      if (
        !shouldContinue() ||
        !owns(flow, version) ||
        AppState.currentState !== 'active'
      )
        break;
      result = await reconcilePaymentFlow(flow);
    }
    results.push(result);
    if (result.state === 'needs-login' || result.status === 429) break;
  }
  return results;
}
