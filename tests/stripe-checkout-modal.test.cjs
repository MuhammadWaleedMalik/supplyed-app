require('./register.cjs');
const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');

const originalLoad = Module._load;
Module._load = function mockedLoad(request, parent, isMain) {
  if (parent?.filename.endsWith('StripeCheckoutModal.tsx')) {
    if (request === 'react')
      return {
        useEffect: () => {},
        useRef: value => ({ current: value }),
      };
    if (request === 'react-native')
      return {
        Linking: {},
        Modal: 'Modal',
        Pressable: 'Pressable',
        Text: 'Text',
        View: 'View',
      };
    if (request === 'react-native-safe-area-context')
      return { SafeAreaView: 'SafeAreaView' };
    if (request === 'lucide-react-native') return { X: 'X' };
    if (request === 'react-native-webview') return { WebView: 'WebView' };
    if (request.endsWith('/constants/env'))
      return { PAYMENT_WEB_ORIGIN: 'https://supplyed.vercel.app' };
    if (request.endsWith('/Ui/theme'))
      return {
        createThemedStyles: () => () => ({}),
        useTheme: () => ({ colors: {} }),
      };
  }
  return originalLoad.call(this, request, parent, isMain);
};
const { checkoutReturn } = require('../components/payments/StripeCheckoutModal');
Module._load = originalLoad;

test('Stripe callbacks close before an unreachable local return page loads', () => {
  assert.equal(
    checkoutReturn('http://localhost:3000/settings?setup=success', ['/settings']),
    'success',
  );
  assert.equal(
    checkoutReturn('http://192.168.18.147:3000/settings?setup=cancelled', [
      '/settings',
    ]),
    'cancelled',
  );
  assert.equal(
    checkoutReturn('http://127.0.0.1:3000/payouts/return', [
      '/payouts/return',
      '/payouts/refresh',
    ]),
    'success',
  );
  assert.equal(
    checkoutReturn('http://10.0.2.2:3000/payouts/refresh/', [
      '/payouts/return',
      '/payouts/refresh',
    ]),
    'cancelled',
  );
});

test('unrelated and incomplete URLs are not accepted as Stripe callbacks', () => {
  assert.equal(
    checkoutReturn('https://checkout.stripe.com/settings', ['/settings']),
    null,
  );
  assert.equal(
    checkoutReturn('https://example.com/unrelated?setup=success', ['/settings']),
    null,
  );
  assert.equal(
    checkoutReturn('https://example.com/settings?setup=success', ['/settings']),
    null,
  );
});
