import { Linking } from 'react-native';

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

export function openStripeConnect(value?: string | null) {
  if (!value || !isStripeConnectUrl(value)) {
    throw new Error(
      'Stripe did not return a valid payout link. Please try again.',
    );
  }
  return Linking.openURL(value);
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
