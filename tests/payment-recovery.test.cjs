/* eslint-env node, es2020 */
require('./register.cjs');
const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');

let userId = 'school-one';
let version = 1;
let token = 'access';
let storageFails = false;
let syncCalls = 0;
let syncImplementation;
const secureStore = new Map();
const opened = [];
const keychain = {
  ACCESSIBLE: { WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'device-only' },
  async getGenericPassword({ service }) {
    const password = secureStore.get(service);
    return password ? { username: 'payment-references', password } : false;
  },
  async setGenericPassword(_username, password, { service }) {
    if (storageFails) throw new Error('Storage locked');
    secureStore.set(service, password);
    return { service };
  },
};
const originalLoad = Module._load;
Module._load = function mockedLoad(request, parent, isMain) {
  if (request === 'react-native-keychain') return keychain;
  if (request === 'react-native') return {
    AppState: { currentState: 'active' },
    Linking: { openURL: async url => { opened.push(url); } },
  };
  if (request.endsWith('/api/session')) return {
    getCurrentSessionUser: () => userId ? { id: userId } : undefined,
    getSessionVersion: () => version,
    getAccessToken: () => token,
  };
  if (request.endsWith('/apis/paymentsApi')) return {
    syncSchoolBilling: async () => { syncCalls++; return syncImplementation(); },
    syncBookingTip: async () => { syncCalls++; return syncImplementation(); },
    getPayoutAccount: async () => ({ ready: false }),
    getPayoutBalance: async () => ({ availablePence: 0 }),
  };
  if (request.endsWith('/paymentSessionsApi')) return {
    syncInvoice: async () => { syncCalls++; return syncImplementation(); },
  };
  return originalLoad.call(this, request, parent, isMain);
};

const flows = require('../utils/payments/flowCoordinator');
const { paymentReturnFromLink } = require('../utils/payments/paymentLinks');
const { parsePoundsToPence } = require('../utils/payments/paymentUtils');

test.beforeEach(() => {
  userId = 'school-one'; version = 1; token = 'access'; storageFails = false;
  syncCalls = 0; opened.length = 0; secureStore.clear();
  syncImplementation = () => ({ setupStatus: 'PENDING', automaticPaymentsEnabled: false });
});

test('stores account-scoped references and survives module reload without storing provider secrets', async () => {
  const flow = await flows.savePaymentFlow({
    kind: 'school-card', sessionId: 'cs_test_one', expiresAt: 9999999999,
    url: 'https://checkout.stripe.com/sensitive', clientSecret: 'must-not-store',
  });
  const serialized = [...secureStore.values()].join();
  assert.doesNotMatch(serialized, /checkout\.stripe\.com|must-not-store|clientSecret|access/);
  assert.equal((await flows.getPendingPaymentFlows())[0].flowId, flow.flowId);
  const filename = require.resolve('../utils/payments/pendingFlows');
  delete require.cache[filename];
  const reloaded = require('../utils/payments/pendingFlows');
  assert.equal((await reloaded.loadPaymentFlows(userId))[0].sessionId, 'cs_test_one');
  userId = 'school-two'; version++;
  assert.deepEqual(await flows.getPendingPaymentFlows(), []);
  await assert.rejects(flows.openPaymentFlow(flow, 'https://checkout.stripe.com/test'));
  assert.equal((await flows.reconcilePaymentFlow(flow)).state, 'needs-login');
  assert.equal(syncCalls, 0);
});

test('failed storage preserves prior recovery and prevents opening Stripe', async () => {
  const prior = await flows.savePaymentFlow({ kind: 'invoice', invoiceId: 'invoice-one' });
  const previous = [...secureStore.values()][0];
  storageFails = true;
  await assert.rejects(flows.savePaymentFlow({ kind: 'invoice', invoiceId: 'invoice-two' }));
  assert.equal([...secureStore.values()][0], previous);
  assert.equal(opened.length, 0);
  storageFails = false;
  assert.equal((await flows.getPendingPaymentFlows())[0].flowId, prior.flowId);
});

test('resuming the same provider operation reuses its durable recovery record', async () => {
  const first = await flows.savePaymentFlow({ kind: 'invoice', invoiceId: 'invoice-one' });
  const resumed = await flows.savePaymentFlow({ kind: 'invoice', invoiceId: 'invoice-one' });
  assert.equal(resumed.flowId, first.flowId);
  assert.equal((await flows.getPendingPaymentFlows()).length, 1);
});

test('resource locks reject a second session creation and release on failure', async () => {
  let release;
  const pending = flows.withPaymentResourceLock('school-card', () => new Promise(resolve => { release = resolve; }));
  await assert.rejects(flows.withPaymentResourceLock('school-card', async () => 'duplicate'), /already being prepared/);
  release('one');
  assert.equal(await pending, 'one');
  await assert.rejects(flows.withPaymentResourceLock('school-card', async () => { throw new Error('offline'); }));
  assert.equal(await flows.withPaymentResourceLock('school-card', async () => 'retry'), 'retry');
});

test('only validates and opens saved provider URLs and checks Unix-second setup expiry', async () => {
  const flow = await flows.savePaymentFlow({ kind: 'school-card', sessionId: 'cs_test_one', expiresAt: Math.floor(Date.now() / 1000) + 60 });
  for (const url of [
    'http://checkout.stripe.com/test', 'https://checkout.stripe.com.attacker.test/test',
    'https://someone@checkout.stripe.com/test', 'https://checkout.stripe.com:444/test',
    'https://connect.stripe.com/test',
  ]) await assert.rejects(flows.openPaymentFlow(flow, url));
  await flows.openPaymentFlow(flow, 'https://checkout.stripe.com/test');
  assert.deepEqual(opened, ['https://checkout.stripe.com/test']);
  const expired = await flows.savePaymentFlow({ kind: 'school-card', sessionId: 'cs_old', expiresAt: 100 });
  await assert.rejects(flows.openPaymentFlow(expired, 'https://checkout.stripe.com/test'), /expired/);
});

test('serializes duplicate reconciliations, retains pending and removes only the resolved attempt', async () => {
  const old = await flows.savePaymentFlow({ kind: 'school-card', sessionId: 'cs_old', expiresAt: null });
  const replacement = await flows.savePaymentFlow({ kind: 'school-card', sessionId: 'cs_new', expiresAt: null });
  let complete;
  syncImplementation = () => new Promise(resolve => { complete = resolve; });
  const first = flows.reconcilePaymentFlow(old);
  const duplicate = flows.reconcilePaymentFlow(old);
  assert.equal(syncCalls, 1);
  complete({ setupStatus: 'PENDING', automaticPaymentsEnabled: false });
  assert.equal((await first).state, 'waiting');
  await duplicate;
  assert.equal((await flows.getPendingPaymentFlows()).length, 2);
  syncImplementation = () => ({ setupStatus: 'READY', automaticPaymentsEnabled: true });
  assert.equal((await flows.reconcilePaymentFlow(old)).state, 'resolved');
  assert.deepEqual((await flows.getPendingPaymentFlows()).map(flow => flow.flowId), [replacement.flowId]);
});

test('a failed card setup resolves only that attempt and never implies automation is enabled', async () => {
  const flow = await flows.savePaymentFlow({ kind: 'school-card', sessionId: 'cs_failed', expiresAt: null });
  syncImplementation = () => ({ setupStatus: 'FAILED', automaticPaymentsEnabled: false, lastSetupError: 'Setup failed' });
  const result = await flows.reconcilePaymentFlow(flow);
  assert.equal(result.state, 'resolved');
  assert.equal(result.data.setupStatus, 'FAILED');
  assert.equal(result.data.automaticPaymentsEnabled, false);
  assert.deepEqual(await flows.getPendingPaymentFlows(), []);
});

test('an existing READY card does not prematurely discard replacement recovery', async () => {
  const flow = await flows.savePaymentFlow({ kind: 'school-card', sessionId: 'cs_replace', expiresAt: 9999999999, replacingCard: true });
  syncImplementation = () => ({ setupStatus: 'READY', automaticPaymentsEnabled: true });
  assert.equal((await flows.reconcilePaymentFlow(flow)).state, 'waiting');
  assert.equal((await flows.getPendingPaymentFlows())[0].replacingCard, true);
  const expired = await flows.savePaymentFlow({ kind: 'school-card', sessionId: 'cs_expired', expiresAt: 100, replacingCard: true });
  assert.equal((await flows.reconcilePaymentFlow(expired)).state, 'resolved');
  assert.equal((await flows.getPendingPaymentFlows()).length, 1);
});

test('a superseded setup 404 removes only its own reference', async () => {
  const old = await flows.savePaymentFlow({ kind: 'school-card', sessionId: 'cs_old', expiresAt: null });
  const current = await flows.savePaymentFlow({ kind: 'school-card', sessionId: 'cs_current', expiresAt: null });
  syncImplementation = () => { throw Object.assign(new Error('Setup session not found'), { status: 404 }); };
  assert.equal((await flows.reconcilePaymentFlow(old)).state, 'failed');
  assert.deepEqual((await flows.getPendingPaymentFlows()).map(item => item.flowId), [current.flowId]);
});

test('account switching during sync cannot resolve or update another account', async () => {
  const flow = await flows.savePaymentFlow({ kind: 'invoice', invoiceId: 'invoice-one' });
  let complete;
  syncImplementation = () => new Promise(resolve => { complete = resolve; });
  const request = flows.reconcilePaymentFlow(flow);
  userId = 'school-two'; version++;
  complete({ status: 'PAID' });
  assert.equal((await request).state, 'needs-login');
  userId = 'school-one'; version++;
  assert.equal((await flows.getPendingPaymentFlows()).length, 1);
});

test('tip processing is pending; refunded and failed remain faithful terminal data', async () => {
  const flow = await flows.savePaymentFlow({ kind: 'tip', bookingId: 'booking-one', tipId: 'tip-one', sessionId: 'cs_tip' });
  syncImplementation = () => ({ status: 'PROCESSING' });
  assert.equal((await flows.reconcilePaymentFlow(flow)).state, 'waiting');
  assert.equal((await flows.getPendingPaymentFlows()).length, 1);
  syncImplementation = () => ({ status: 'REFUNDED', amountRefundedPence: 1000 });
  const result = await flows.reconcilePaymentFlow(flow);
  assert.equal(result.state, 'resolved');
  assert.equal(result.data.status, 'REFUNDED');
  assert.deepEqual(await flows.getPendingPaymentFlows(), []);
});

test('network ambiguity is retained and never replays a payment creation or withdrawal', async () => {
  const flow = await flows.savePaymentFlow({ kind: 'invoice', invoiceId: 'invoice-one' });
  syncImplementation = () => { throw Object.assign(new Error('Request timed out'), { status: 0 }); };
  const result = await flows.reconcilePaymentFlow(flow);
  assert.equal(result.state, 'failed');
  assert.match(result.error, /timed out/);
  assert.equal(syncCalls, 1);
  assert.equal((await flows.getPendingPaymentFlows()).length, 1);
});

test('callback parser trusts only the configured origin/path or registered scheme and references', () => {
  const query = '?flow=school-card&result=success&session_id=cs_test_one';
  assert.equal(paymentReturnFromLink('supplyed://payments/return' + query).sessionId, 'cs_test_one');
  assert.equal(paymentReturnFromLink('https://supplyed.vercel.app/mobile/payments/return' + query).kind, 'school-card');
  for (const url of [
    'https://attacker.test/mobile/payments/return' + query,
    'https://supplyed.vercel.app/settings' + query,
    'supplyed://payments/wrong' + query,
    'supplyed://payments/return' + query + '&client_secret=secret',
    'supplyed://payments/return' + query + '&session_id=another',
    'supplyed://payments/return?flow=tip&result=success&tip_id=tip-one',
    'supplyed://payments/return?flow=invoice&result=success&invoice_id=../other',
  ]) assert.equal(paymentReturnFromLink(url), null, url);
});

test('money parsing uses exact pence and rejects ambiguous or unsafe input', () => {
  assert.equal(parsePoundsToPence('10.09'), 1009);
  assert.equal(parsePoundsToPence('0.01'), 1);
  assert.equal(parsePoundsToPence(' 1.1 '), 110);
  for (const value of ['-1', '1.001', '1e2', '1,000', 'NaN', '.5', '999999999999999999999'])
    assert.equal(parsePoundsToPence(value), null, value);
});
