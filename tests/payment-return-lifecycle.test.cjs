require('./register.cjs');
const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');

let harness;
const originalLoad = Module._load;
Module._load = function mockedLoad(request, parent, isMain) {
  if (parent?.filename.endsWith('usePaymentRecovery.ts')) {
    if (request === 'react')
      return {
        useState: initial => harness.useState(initial),
        useRef: initial => harness.useRef(initial),
        useEffect: (effect, dependencies) =>
          harness.useEffect(effect, dependencies),
        useCallback: callback => {
          harness.cursor++;
          return callback;
        },
      };
    if (request === 'react-native')
      return {
        AppState: {
          get currentState() {
            return harness.appState;
          },
          addEventListener: (_event, callback) => {
            harness.appListeners.add(callback);
            return { remove: () => harness.appListeners.delete(callback) };
          },
        },
        Linking: {
          getInitialURL: () => harness.initialURL(),
          addEventListener: (_event, callback) => {
            harness.linkListeners.add(callback);
            return { remove: () => harness.linkListeners.delete(callback) };
          },
          openURL: url => {
            harness.calls.open.push(url);
          },
        },
      };
    if (request.endsWith('/session'))
      return {
        getAccessToken: () => (harness.userId ? 'access-token' : ''),
        getCurrentSessionUser: () =>
          harness.userId ? { id: harness.userId } : undefined,
        getSessionVersion: () => harness.sessionVersion,
        onSessionChanged: callback => {
          harness.sessionListeners.add(callback);
          return () => harness.sessionListeners.delete(callback);
        },
      };
    if (request === './flowCoordinator')
      return {
        getPendingPaymentFlows: () => harness.call('load', 'loadFlows'),
        reconcilePaymentFlow: flow =>
          harness.call('reconcile', 'reconcile', flow),
        reconcilePendingPayments: valid =>
          harness.call('batch', 'reconcilePending', valid),
        savePaymentFlow: input => harness.call('save', 'saveFlow', input),
      };
    if (request.endsWith('/paymentsApi'))
      return {
        syncSchoolBilling: id => harness.call('school', 'syncSchool', id),
        syncBookingTip: (id, session) =>
          harness.call('tip', 'syncTip', id, session),
        createSchoolBillingSetup: () => harness.calls.create.push('school'),
        createBookingTip: () => harness.calls.create.push('tip'),
        createInstantPayout: () => harness.calls.create.push('payout'),
      };
    if (request.endsWith('/paymentSessionsApi'))
      return {
        syncInvoice: id => harness.call('invoice', 'syncInvoice', id),
        createInvoicePaymentSession: () => harness.calls.create.push('invoice'),
      };
    if (request === '../../store')
      return {
        store: { dispatch: action => harness.calls.dispatch.push(action) },
      };
    if (request.endsWith('/navigationSlice'))
      return {
        refreshMarketplace: () => ({
          type: 'dashboardNavigation/refreshMarketplace',
        }),
      };
  }
  return originalLoad.call(this, request, parent, isMain);
};
const { usePaymentRecovery } = require('../utils/payments/usePaymentRecovery');
Module._load = originalLoad;

const link = (kind, references = '', result = 'success') =>
  `supplyed://payments/return?flow=${kind}&result=${result}${references}`;
const schoolLink = id => link('school-card', '&session_id=' + id);
const invoiceLink = id => link('invoice', '&invoice_id=' + id);
const flow = (kind, fields = {}) => ({
  kind,
  version: 1,
  flowId: 'flow-one',
  userId: 'school-a',
  createdAt: '2026-11-12T08:00:00Z',
  ...fields,
});
function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

function mount(options = {}) {
  const instance = {
    userId: 'school-a',
    sessionVersion: 1,
    appState: 'active',
    mounted: true,
    dirty: false,
    writesAfterUnmount: 0,
    slots: [],
    effects: [],
    cleanups: [],
    cursor: 0,
    flows: [],
    linkListeners: new Set(),
    appListeners: new Set(),
    sessionListeners: new Set(),
    calls: {
      load: [],
      reconcile: [],
      batch: [],
      save: [],
      school: [],
      tip: [],
      invoice: [],
      dispatch: [],
      create: [],
      open: [],
    },
    initialURL: async () => null,
    async loadFlows() {
      return this.flows.filter(item => item.userId === this.userId);
    },
    async reconcile(current) {
      return { flow: current, state: 'waiting', data: { status: 'OPEN' } };
    },
    async reconcilePending() {
      return [];
    },
    async syncSchool() {
      return { setupStatus: 'PENDING', automaticPaymentsEnabled: false };
    },
    async syncInvoice() {
      return { status: 'OPEN' };
    },
    async syncTip() {
      return { status: 'PROCESSING' };
    },
    async saveFlow(input) {
      const saved = flow(input.kind, {
        ...input,
        userId: this.userId,
        flowId: 'saved-' + this.calls.save.length,
      });
      this.flows.push(saved);
      return saved;
    },
    ...options,
    call(name, method, ...args) {
      this.calls[name].push({ userId: this.userId, args });
      return this[method](...args);
    },
    useState(initial) {
      const index = this.cursor++;
      if (!this.slots[index])
        this.slots[index] = {
          value: typeof initial === 'function' ? initial() : initial,
        };
      return [
        this.slots[index].value,
        next => {
          if (!this.mounted) this.writesAfterUnmount++;
          const value =
            typeof next === 'function' ? next(this.slots[index].value) : next;
          if (this.slots[index].value !== value) {
            this.slots[index].value = value;
            this.dirty = true;
          }
        },
      ];
    },
    useRef(initial) {
      const index = this.cursor++;
      if (!this.slots[index]) this.slots[index] = { current: initial };
      return this.slots[index];
    },
    useEffect(effect, dependencies) {
      const index = this.cursor++;
      const previous = this.slots[index];
      if (
        !previous ||
        dependencies.some((value, i) => value !== previous.dependencies[i])
      ) {
        this.slots[index] = { dependencies };
        this.effects.push(() => {
          this.cleanups[index]?.();
          this.cleanups[index] = effect();
        });
      }
    },
    render() {
      harness = this;
      this.cursor = 0;
      this.dirty = false;
      this.value = usePaymentRecovery();
      for (const effect of this.effects.splice(0)) effect();
    },
    async flush() {
      // Drain nested API, reconciliation and serialized queue continuations without timers.
      for (let i = 0; i < 40; i++) {
        await Promise.resolve();
        if (this.mounted && this.dirty) this.render();
      }
      return this.value;
    },
    sendLink(url) {
      for (const listener of this.linkListeners) listener({ url });
    },
    changeAppState(state) {
      this.appState = state;
      for (const listener of this.appListeners) listener(state);
    },
    changeUser(userId) {
      this.userId = userId;
      this.sessionVersion++;
      for (const listener of this.sessionListeners) listener();
    },
    unmount() {
      this.mounted = false;
      for (const cleanup of this.cleanups) cleanup?.();
    },
  };
  instance.render();
  return instance;
}

test.afterEach(() => {
  if (harness?.mounted) harness.unmount();
});

test('mount and foreground reconcile existing references without creating payment sessions or opening Stripe', async () => {
  const h = mount();
  await h.flush();
  assert.equal(h.calls.batch.length, 1);
  assert.equal(h.value.returnDestination, null);
  assert.deepEqual(h.calls.create, []);
  assert.deepEqual(h.calls.save, []);
  assert.deepEqual(h.calls.open, []);
  h.changeAppState('background');
  await h.flush();
  assert.equal(h.calls.batch.length, 1);
  h.changeAppState('active');
  await h.flush();
  assert.equal(h.calls.batch.length, 2);
  assert.deepEqual(h.calls.create, []);
});

test('cold-start callback checks the backend before persisting an unfinished invoice and navigating', async () => {
  const response = deferred();
  const h = mount({
    initialURL: async () => invoiceLink('invoice-one'),
    syncInvoice: () => response.promise,
  });
  await h.flush();
  assert.deepEqual(
    h.calls.invoice.map(call => call.args),
    [['invoice-one']],
  );
  assert.deepEqual(h.calls.save, []);
  assert.equal(h.value.returnDestination, null);
  response.resolve({ status: 'OPEN' });
  await h.flush();
  assert.deepEqual(
    h.calls.save.map(call => call.args[0]),
    [{ kind: 'invoice', invoiceId: 'invoice-one' }],
  );
  assert.equal(h.calls.reconcile.length, 1);
  assert.equal(h.value.returnDestination, 'invoice');
  assert.ok(h.calls.dispatch.length > 0);
  assert.deepEqual(h.calls.create, []);
  h.value.clearPaymentReturn();
  await h.flush();
  assert.equal(h.value.returnDestination, null);
});

test('a success callback is only a return signal and retains a server-pending saved-card attempt', async () => {
  const saved = flow('school-card', {
    sessionId: 'cs_pending',
    expiresAt: null,
  });
  const h = mount({ flows: [saved] });
  await h.flush();
  h.sendLink(schoolLink('cs_pending'));
  await h.flush();
  assert.equal(h.calls.reconcile.length, 1);
  assert.deepEqual(h.calls.reconcile[0].args, [saved]);
  assert.equal(h.value.returnDestination, 'school-card');
  assert.equal(h.flows[0], saved);
  assert.deepEqual(h.calls.school, []);
  assert.deepEqual(h.calls.save, []);
});

test('a callback received while logged out waits for authentication and backend ownership verification', async () => {
  const h = mount({
    userId: '',
    initialURL: async () => schoolLink('cs_original'),
  });
  await h.flush();
  assert.deepEqual(h.calls.school, []);
  assert.deepEqual(h.calls.save, []);
  h.changeUser('school-a');
  await h.flush();
  assert.deepEqual(
    h.calls.school.map(call => ({ userId: call.userId, id: call.args[0] })),
    [{ userId: 'school-a', id: 'cs_original' }],
  );
  assert.equal(h.calls.save.length, 1);
  assert.equal(h.value.returnDestination, 'school-card');
});

test('switching accounts during callback ownership validation cannot persist or reconcile the old session under the new account', async () => {
  const checked = deferred();
  const h = mount({ syncSchool: () => checked.promise });
  await h.flush();
  h.sendLink(schoolLink('cs_school_a'));
  await h.flush();
  assert.equal(h.calls.school.length, 1);
  h.changeUser('school-b');
  checked.resolve({ setupStatus: 'PENDING', automaticPaymentsEnabled: false });
  await h.flush();
  assert.deepEqual(h.calls.save, []);
  assert.deepEqual(h.calls.reconcile, []);
  assert.equal(h.value.returnDestination, null);
  assert.deepEqual(
    h.calls.school.map(call => call.userId),
    ['school-a'],
  );
  // Switching back allows the original owner to resolve its retained callback.
  h.changeUser('school-a');
  await h.flush();
  assert.equal(h.calls.school.length, 2);
  assert.deepEqual(
    h.calls.save.map(call => call.userId),
    ['school-a'],
  );
  assert.equal(h.value.returnDestination, 'school-card');
});

test('distinct callbacks arriving during an active reconciliation are both processed and duplicate events are ignored', async () => {
  const firstCheck = deferred();
  const first = flow('invoice', { invoiceId: 'invoice-one', flowId: 'first' });
  const second = flow('invoice', {
    invoiceId: 'invoice-two',
    flowId: 'second',
  });
  const h = mount({
    flows: [first, second],
    reconcile: current =>
      current.flowId === 'first'
        ? firstCheck.promise
        : Promise.resolve({ flow: current, state: 'resolved' }),
  });
  await h.flush();
  h.sendLink(invoiceLink('invoice-one'));
  await h.flush();
  h.sendLink(invoiceLink('invoice-two'));
  h.sendLink(invoiceLink('invoice-one'));
  h.sendLink(invoiceLink('invoice-two'));
  await h.flush();
  assert.deepEqual(
    h.calls.reconcile.map(call => call.args[0].invoiceId),
    ['invoice-one'],
  );
  firstCheck.resolve({ flow: first, state: 'resolved' });
  await h.flush();
  assert.deepEqual(
    h.calls.reconcile.map(call => call.args[0].invoiceId),
    ['invoice-one', 'invoice-two'],
  );
  assert.equal(h.value.returnDestination, 'invoice');
  assert.deepEqual(h.calls.create, []);
});

test('invalid return URLs do not sync, save, reconcile, or navigate', async () => {
  const h = mount();
  await h.flush();
  const baseline = h.calls.batch.length;
  for (const url of [
    'https://attacker.example/mobile/payments/return?flow=invoice&result=success&invoice_id=one',
    'supplyed://payments/return?flow=invoice&result=success&invoice_id=one&invoice_id=two',
    'supplyed://payments/return?flow=school-card&result=success',
    'supplyed://payments/return?flow=invoice&result=success&invoice_id=one#success',
    'supplyed://evil/return?flow=invoice&result=success&invoice_id=one',
  ])
    h.sendLink(url);
  await h.flush();
  for (const key of [
    'school',
    'tip',
    'invoice',
    'save',
    'reconcile',
    'dispatch',
  ])
    assert.deepEqual(h.calls[key], [], key);
  assert.equal(h.calls.batch.length, baseline);
  assert.equal(h.value.returnDestination, null);
});

test('a denied callback does not block a second valid callback or delete saved owned references', async () => {
  const denied = deferred();
  const owned = flow('invoice', { invoiceId: 'owned-invoice' });
  const h = mount({ flows: [owned], syncInvoice: () => denied.promise });
  await h.flush();
  h.sendLink(invoiceLink('foreign-invoice'));
  await h.flush();
  h.sendLink(invoiceLink('owned-invoice'));
  denied.reject(Object.assign(new Error('Forbidden'), { status: 403 }));
  await h.flush();
  assert.equal(h.calls.invoice.length, 1);
  assert.equal(h.calls.reconcile.length, 1);
  assert.equal(h.calls.reconcile[0].args[0], owned);
  assert.equal(h.flows[0], owned);
  assert.equal(h.value.returnDestination, 'invoice');
});

test('a temporarily unavailable callback retains recovery while allowing another queued invoice to refresh', async () => {
  const unavailable = deferred();
  const owned = flow('invoice', { invoiceId: 'available-invoice' });
  const h = mount({
    flows: [owned],
    syncInvoice: () => unavailable.promise,
  });
  await h.flush();
  h.sendLink(invoiceLink('temporarily-unavailable'));
  await h.flush();
  h.sendLink(invoiceLink('available-invoice'));
  unavailable.reject(
    Object.assign(new Error('Provider temporarily unavailable'), {
      status: 503,
    }),
  );
  await h.flush();
  assert.deepEqual(
    h.calls.reconcile.map(call => call.args[0].invoiceId),
    ['available-invoice'],
  );
  assert.equal(h.value.returnDestination, 'invoice');
  // Retry the preserved reference on a later foreground instead of creating a charge.
  const attempts = h.calls.invoice.length;
  h.syncInvoice = async () => ({ status: 'PAID' });
  h.changeAppState('background');
  h.changeAppState('active');
  await h.flush();
  assert.ok(h.calls.invoice.length > attempts);
  assert.equal(h.calls.invoice.at(-1).args[0], 'temporarily-unavailable');
  assert.deepEqual(h.calls.create, []);
});

test('backgrounding during a callback prevents stale navigation and the next foreground checks again', async () => {
  const firstRead = deferred();
  let reads = 0;
  const h = mount({
    syncInvoice: () =>
      ++reads === 1 ? firstRead.promise : Promise.resolve({ status: 'PAID' }),
  });
  await h.flush();
  h.sendLink(invoiceLink('invoice-resume'));
  await h.flush();
  h.changeAppState('background');
  firstRead.resolve({ status: 'OPEN' });
  await h.flush();
  assert.equal(h.value.returnDestination, null);
  assert.deepEqual(h.calls.save, []);
  h.changeAppState('active');
  await h.flush();
  assert.equal(h.calls.invoice.length, 2);
  assert.equal(h.value.returnDestination, 'invoice');
  assert.deepEqual(h.calls.save, []);
});

test('unmount removes listeners and suppresses pending callback updates, persistence and dispatch', async () => {
  const checked = deferred();
  const h = mount({ syncSchool: () => checked.promise });
  await h.flush();
  h.sendLink(schoolLink('cs_unmount'));
  await h.flush();
  h.unmount();
  checked.resolve({ setupStatus: 'PENDING', automaticPaymentsEnabled: false });
  await h.flush();
  assert.equal(h.linkListeners.size, 0);
  assert.equal(h.appListeners.size, 0);
  assert.equal(h.sessionListeners.size, 0);
  assert.equal(h.writesAfterUnmount, 0);
  assert.deepEqual(h.calls.save, []);
  assert.deepEqual(h.calls.dispatch, []);
});

test('a late cold-start URL after cleanup does not start any API work', async () => {
  const initial = deferred();
  const h = mount({ initialURL: () => initial.promise });
  await h.flush();
  h.unmount();
  initial.resolve(schoolLink('cs_too_late'));
  await h.flush();
  assert.deepEqual(h.calls.school, []);
  assert.deepEqual(h.calls.save, []);
  assert.equal(h.writesAfterUnmount, 0);
});
