import {
  PAYMENT_APP_SCHEME,
  PAYMENT_RETURN_PATH,
  PAYMENT_WEB_URL,
} from '../../constants/payments';
import type { PaymentFlowInput } from './pendingFlows';

export type PaymentReturn = {
  kind: PaymentFlowInput['kind'];
  result: 'success' | 'cancelled' | 'return' | 'refresh';
  sessionId?: string;
  tipId?: string;
  invoiceId?: string;
};

function reference(value: string | null) {
  return value && /^[a-zA-Z0-9_-]{1,300}$/.test(value) ? value : undefined;
}

export function paymentReturnFromLink(value: string): PaymentReturn | null {
  try {
    const url = new URL(value);
    if (url.username || url.password || url.hash) return null;
    const custom =
      url.protocol === PAYMENT_APP_SCHEME + ':' &&
      url.hostname === 'payments' &&
      url.pathname === '/return' &&
      !url.port;
    const web =
      url.protocol === 'https:' &&
      url.origin === PAYMENT_WEB_URL &&
      url.pathname === PAYMENT_RETURN_PATH;
    if (!custom && !web) return null;
    const allowed = ['flow', 'result', 'session_id', 'tip_id', 'invoice_id'];
    for (const key of url.searchParams.keys()) {
      if (!allowed.includes(key) || url.searchParams.getAll(key).length !== 1)
        return null;
    }
    const kind = url.searchParams.get('flow');
    const result = url.searchParams.get('result');
    if (
      !['school-card', 'tip', 'invoice', 'teacher-onboarding'].includes(
        kind || '',
      ) ||
      !['success', 'cancelled', 'return', 'refresh'].includes(result || '')
    )
      return null;
    const sessionId = reference(url.searchParams.get('session_id'));
    const tipId = reference(url.searchParams.get('tip_id'));
    const invoiceId = reference(url.searchParams.get('invoice_id'));
    if (kind === 'school-card' && result === 'success' && !sessionId)
      return null;
    if (kind === 'tip' && (!tipId || (result === 'success' && !sessionId)))
      return null;
    if (kind === 'invoice' && !invoiceId) return null;
    return { kind, result, sessionId, tipId, invoiceId } as PaymentReturn;
  } catch {
    return null;
  }
}
