import { Linking } from 'react-native';
import {
  formatPence,
  isStripeConnectUrl,
  isStripeInvoiceUrl,
  openInvoicePdf,
  openStripeConnect,
  openStripeInvoice,
} from '../utils/payments/paymentUtils';

it('formats backend pence amounts as pounds including the minimum payout', () => {
  expect(formatPence(91125)).toBe('£911.25');
  expect(formatPence(40)).toBe('£0.40');
  expect(formatPence(null)).toBe('£0.00');
});

it.each([
  'http://connect.stripe.com/setup',
  'https://connect.stripe.com.evil.example/setup',
  'https://attacker@connect.stripe.com/setup',
  'https://connect.stripe.com:8080/setup',
  // eslint-disable-next-line no-script-url
  'javascript:alert(1)',
  '',
])('rejects an unsafe payout URL: %s', value => {
  expect(isStripeConnectUrl(value)).toBe(false);
});

it.each([
  'https://invoice.stripe.com/i/123',
  'https://pay.stripe.com/invoice/123',
])('accepts a Stripe-hosted invoice URL: %s', value => {
  expect(isStripeInvoiceUrl(value)).toBe(true);
});

it('rejects missing links and credential URLs before opening a browser', () => {
  const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  expect(() => openStripeConnect('https://example.com/setup')).toThrow();
  expect(() =>
    openStripeInvoice('https://user:pass@invoice.stripe.com/i/1'),
  ).toThrow();
  expect(() => openInvoicePdf(null)).toThrow();
  expect(open).not.toHaveBeenCalled();
  open.mockRestore();
});

describe('installed React Native URL implementation', () => {
  const originalURL = globalThis.URL;
  beforeAll(() => {
    const nativeUrl = jest.requireActual<{ URL: typeof URL }>(
      'react-native/Libraries/Blob/URL',
    );
    globalThis.URL = nativeUrl.URL;
  });
  afterAll(() => {
    globalThis.URL = originalURL;
  });

  it('validates Stripe links on a device as well as in Node', () => {
    expect(isStripeConnectUrl('https://connect.stripe.com/setup/123')).toBe(
      true,
    );
    expect(isStripeInvoiceUrl('https://invoice.stripe.com/i/123')).toBe(true);
    expect(isStripeInvoiceUrl('https://pay.stripe.com/invoice/123')).toBe(true);
    expect(
      isStripeConnectUrl('https://attacker@connect.stripe.com/setup'),
    ).toBe(false);
    expect(
      isStripeInvoiceUrl('https://invoice.stripe.com.evil.example/i/123'),
    ).toBe(false);
  });
});
