import { Linking } from 'react-native';

export function parsePoundsToPence(input: string): number | null {
  const value = input.trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(value)) return null;
  const [whole, fraction = ''] = value.split('.');
  const pence = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return Number.isSafeInteger(pence) ? pence : null;
}

// Backend money fields ending in Pence need to be divided by 100.
// rateAmount is already in pounds and must not use this helper.
export function formatPence(pence?: number | null, currency = 'GBP') {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
  }).format((pence ?? 0) / 100);
}

function safeUrl(value?: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    if (url.port && url.port !== '443') return null;
    return url;
  } catch {
    return null;
  }
}

export function isStripeConnectUrl(value?: string | null) {
  return safeUrl(value)?.hostname === 'connect.stripe.com';
}

export function isStripeInvoiceUrl(value?: string | null) {
  const hostname = safeUrl(value)?.hostname;
  return hostname === 'invoice.stripe.com' || hostname === 'pay.stripe.com';
}

export function isStripeCheckoutUrl(value?: string | null) {
  return safeUrl(value)?.hostname === 'checkout.stripe.com';
}

export function requiresCardAuthentication(value?: string | null) {
  return [
    'authentication_required',
    'invoice_payment_intent_requires_action',
    'payment_intent_requires_action',
  ].includes(value || '');
}

export function automaticPaymentPhase(payment: {
  status: string;
  failureMessage?: string | null;
  nextAttemptAt?: string | null;
  paymentAttemptCount?: number | null;
}) {
  if (payment.status === 'PAID') return 'paid';
  if (payment.failureMessage) return 'failed';
  if (payment.status === 'PENDING') return 'preparing';
  if ((payment.paymentAttemptCount || 0) === 0 && payment.nextAttemptAt)
    return 'scheduled';
  return 'processing';
}

export function openStripeInvoice(value?: string | null) {
  if (!value || !isStripeInvoiceUrl(value)) {
    throw new Error('This invoice does not have a valid Stripe payment link.');
  }
  return Linking.openURL(value);
}

export function openInvoicePdf(value?: string | null) {
  const url = safeUrl(value);
  const validHost =
    url &&
    ['pay.stripe.com', 'invoice.stripe.com', 'files.stripe.com'].includes(
      url.hostname,
    );
  if (!value || !validHost) {
    throw new Error('This invoice does not have a valid Stripe PDF link.');
  }
  return Linking.openURL(value);
}
