/* eslint-env node, es2020 */
require('./register.cjs');
const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');

let harness;
class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}
const originalLoad = Module._load;
Module._load = function mockedLoad(request, parent, isMain) {
  if (
    parent?.filename.endsWith('payoutUtils.ts') &&
    request.endsWith('/api/request')
  )
    return { ApiError };
  if (parent?.filename.endsWith('usePayoutAccount.ts')) {
    if (request === 'react-native') return {
      Linking: { openURL: async url => { harness.calls.website.push(url); } },
    };
    if (request === 'react')
      return {
        useState: initial => harness.useState(initial),
        useRef: initial => harness.useRef(initial),
        useCallback: (callback, dependencies) =>
          harness.useCallback(callback, dependencies),
        useEffect: (effect, dependencies) =>
          harness.useEffect(effect, dependencies),
      };
    if (request.endsWith('/session'))
      return { getSessionVersion: () => harness.sessionVersion };
    if (request.endsWith('/paymentUtils'))
      return {
        isStripeConnectUrl: url =>
          new URL(url).origin === 'https://connect.stripe.com',
      };
    if (request.endsWith('/flowCoordinator'))
      return {
        withPaymentResourceLock: (_resource, action) => action(),
        savePaymentFlow: async input => {
          harness.calls.saved.push(input);
          return { ...input, userId: 'teacher-one', flowId: 'setup-one' };
        },
        openPaymentFlow: async (flow, url) =>
          harness.calls.opened.push({ flow, url }),
        onPaymentFlowsChanged: callback => {
          harness.flowChanged = callback;
          return () => {
            harness.flowChanged = undefined;
          };
        },
      };
    if (request.endsWith('/useForegroundRefresh'))
      return {
        useForegroundRefresh: (refresh, enabled, milliseconds) => {
          harness.foreground = refresh;
          harness.polling = { enabled, milliseconds };
        },
      };
    if (request.endsWith('/paymentsApi'))
      return {
        getPayoutAccount: () => {
          harness.calls.account++;
          return harness.readAccount();
        },
        getPayoutBalance: () => {
          harness.calls.balance++;
          return harness.readBalance();
        },
        createPayoutOnboardingLink: () => {
          harness.calls.links++;
          return harness.createLink();
        },
        createInstantPayout: amount => {
          harness.calls.withdrawals.push(amount);
          return harness.withdraw(amount);
        },
      };
  }
  return originalLoad.call(this, request, parent, isMain);
};
const {
  usePayoutAccount,
} = require('../feature/dashboard/shared/hooks/usePayoutAccount');
const {
  payoutPollingInterval,
  payoutResultIsUncertain,
  readPayoutAmount,
} = require('../utils/payments/payoutUtils');
Module._load = originalLoad;

const readyAccount = {
  connected: true,
  ready: true,
  detailsSubmitted: true,
  chargesEnabled: true,
  payoutsEnabled: true,
  requirementsDue: [],
  disabledReason: null,
};
const funds = {
  pendingPence: 0,
  availablePence: 10000,
  instantAvailablePence: 9500,
  instantDestination: { id: 'destination-one', label: 'Bank ****2345' },
  recentPayouts: [],
};
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
    slots: [],
    effects: [],
    cleanups: [],
    cursor: 0,
    dirty: false,
    mounted: true,
    writesAfterUnmount: 0,
    sessionVersion: 1,
    calls: {
      account: 0,
      balance: 0,
      links: 0,
      saved: [],
      opened: [],
      withdrawals: [],
      website: [],
    },
    readAccount: async () => ({ ...readyAccount }),
    readBalance: async () => ({ ...funds }),
    createLink: async () => ({
      url: 'https://connect.stripe.com/setup/test',
      expiresAt: null,
    }),
    withdraw: async amount => ({
      id: 'payout-one',
      amountPence: amount,
      status: 'in_transit',
    }),
    ...options,
    useState(initial) {
      const index = this.cursor++;
      if (!this.slots[index]) this.slots[index] = { value: initial };
      return [
        this.slots[index].value,
        next => {
          if (!this.mounted) this.writesAfterUnmount++;
          this.slots[index].value =
            typeof next === 'function' ? next(this.slots[index].value) : next;
          this.dirty = true;
        },
      ];
    },
    useRef(initial) {
      const index = this.cursor++;
      if (!this.slots[index]) this.slots[index] = { current: initial };
      return this.slots[index];
    },
    useCallback(callback, dependencies) {
      const index = this.cursor++;
      const previous = this.slots[index];
      if (
        !previous ||
        dependencies.some((value, i) => value !== previous.dependencies[i])
      )
        this.slots[index] = { callback, dependencies };
      return this.slots[index].callback;
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
      // eslint-disable-next-line consistent-this
      harness = this;
      this.cursor = 0;
      this.dirty = false;
      // The explicit harness supplies React state and effect scheduling.
      // eslint-disable-next-line react-hooks/rules-of-hooks
      this.value = usePayoutAccount();
      for (const effect of this.effects.splice(0)) effect();
      return this.value;
    },
    async flush() {
      for (let i = 0; i < 15; i++) {
        await Promise.resolve();
        if (this.mounted && this.dirty) this.render();
      }
      return this.value;
    },
    unmount() {
      for (const cleanup of this.cleanups) cleanup?.();
      this.mounted = false;
    },
  };
  instance.render();
  return instance;
}
test.afterEach(() => {
  if (harness?.mounted) harness.unmount();
});

test('onboarding opens each fresh Stripe link in the in-app payout sheet and persists only recovery references', async () => {
  const h = mount();
  await h.flush();
  await h.value.openPayouts();
  await h.flush();
  assert.equal(h.value.payoutUrl, 'https://connect.stripe.com/setup/test');
  await h.value.closePayouts('closed');
  await h.flush();
  await h.value.openPayouts();
  await h.flush();
  assert.equal(h.calls.links, 2);
  assert.deepEqual(h.calls.saved, [
    { kind: 'teacher-onboarding' },
    { kind: 'teacher-onboarding' },
  ]);
  assert.equal(h.calls.opened.length, 0);
  assert.equal(h.value.payoutUrl, 'https://connect.stripe.com/setup/test');
  assert.equal(h.value.account.ready, true);
});

test('changing accounts while requesting a link never persists or launches it for the new account', async () => {
  const link = deferred();
  const h = mount({ createLink: () => link.promise });
  await h.flush();
  const opening = h.value.openPayouts();
  h.sessionVersion++;
  link.resolve({
    url: 'https://connect.stripe.com/setup/old',
    expiresAt: null,
  });
  await opening;
  await h.flush();
  assert.deepEqual(h.calls.saved, []);
  assert.deepEqual(h.calls.opened, []);
  assert.equal(h.value.payoutUrl, '');
});

test('one withdrawal is submitted for repeated presses and the latest balance is read afterward', async () => {
  const sent = deferred();
  const h = mount({ withdraw: () => sent.promise });
  await h.flush();
  const first = h.value.withdraw(400);
  assert.equal(await h.value.withdraw(400), false);
  sent.resolve({ id: 'payout-one', amountPence: 400, status: 'in_transit' });
  assert.equal(await first, true);
  await h.flush();
  assert.deepEqual(h.calls.withdrawals, [400]);
  assert.equal(h.calls.balance, 2);
  assert.match(h.value.notice, /In transit/);
  assert.match(h.value.notice, /not reached your bank/);
});

test('uncertain payout submission refreshes history and never replays the mutation', async () => {
  const h = mount({
    withdraw: async () => {
      throw new ApiError('Timed out', 0);
    },
  });
  await h.flush();
  assert.equal(await h.value.withdraw(400), true);
  await h.flush();
  assert.deepEqual(h.calls.withdrawals, [400]);
  assert.equal(h.calls.balance, 2);
  assert.match(h.value.notice, /could not confirm/);
});

test('failed reconciliation keeps withdrawal blocked until a successful balance refresh', async () => {
  const h = mount();
  await h.flush();
  h.withdraw = async () => {
    throw new ApiError('Unavailable', 503);
  };
  h.readBalance = async () => {
    throw new ApiError('Unavailable', 503);
  };
  await h.value.withdraw(400);
  await h.flush();
  assert.equal(h.value.needsRefresh, true);
  assert.equal(await h.value.withdraw(400), false);
  assert.deepEqual(h.calls.withdrawals, [400]);
});

test('foreground reads serialize and unmounted or changed sessions receive no payout updates', async () => {
  const h = mount();
  await h.flush();
  const balance = deferred();
  h.readBalance = () => balance.promise;
  const refresh = h.value.refresh();
  const second = h.value.refresh();
  await h.flush();
  assert.equal(h.calls.balance, 2);
  h.unmount();
  balance.resolve({ ...funds, instantAvailablePence: 200 });
  assert.equal(await refresh, false);
  assert.equal(await second, false);
  assert.equal(h.writesAfterUnmount, 0);
});

test('polling follows verification and pending bank payouts, with failure backoff', () => {
  assert.equal(
    payoutPollingInterval({ ...readyAccount, ready: false }, funds),
    5000,
  );
  assert.equal(
    payoutPollingInterval(readyAccount, { ...funds, pendingPence: 300 }),
    30000,
  );
  assert.equal(
    payoutPollingInterval(readyAccount, {
      ...funds,
      recentPayouts: [{ status: 'in_transit' }],
    }),
    30000,
  );
  assert.equal(payoutPollingInterval(readyAccount, funds), 0);
  assert.equal(
    payoutPollingInterval({ ...readyAccount, ready: false }, funds, 3),
    40000,
  );
});

test('withdrawal amounts preserve whole pence and decline ambiguous formats', () => {
  assert.equal(readPayoutAmount(''), undefined);
  assert.equal(readPayoutAmount(' 12.05 '), 1205);
  for (const value of [
    '-1',
    '1.001',
    '1e2',
    '1,000',
    'NaN',
    '9007199254740992',
  ])
    assert.throws(() => readPayoutAmount(value));
  assert.equal(payoutResultIsUncertain(new ApiError('No funds', 400)), false);
  assert.equal(
    payoutResultIsUncertain(new ApiError('Provider unavailable', 503)),
    true,
  );
});

test('payout callbacks select the teacher payouts tab and deliberate Billing navigation resets it', () => {
  const navigation = require('../feature/dashboard/shared/store/navigationSlice');
  let state = navigation.default(undefined, { type: '@@init' });
  state = navigation.default(state, navigation.refreshMarketplace());
  state = navigation.default(state, navigation.openPayouts());
  assert.equal(state.page, 'Billing');
  assert.equal(state.billingView, 'Payouts');
  assert.equal(state.dataRevision, 1);
  state = navigation.default(state, navigation.setBillingView('Invoices'));
  assert.equal(state.billingView, 'Invoices');
  state = navigation.default(state, navigation.openPayouts());
  state = navigation.default(state, navigation.showPage('Billing'));
  assert.equal(state.billingView, 'Invoices');
});
