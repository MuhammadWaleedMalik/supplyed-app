require('./register.cjs');
const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');

let harness;
const originalLoad = Module._load;
Module._load = function mockedLoad(request, parent, isMain) {
  if (parent?.filename.endsWith('SchoolBillingCard.tsx')) {
    if (request === 'react')
      return {
        useState: value => harness.useState(value),
        useRef: value => harness.useRef(value),
        useEffect: (effect, dependencies) =>
          harness.useEffect(effect, dependencies),
        useCallback: (callback, dependencies) =>
          harness.useCallback(callback, dependencies),
      };
    if (request === 'react-native') return { Text: 'Text', View: 'View' };
    if (request === 'lucide-react-native') return { CreditCard: 'CreditCard' };
    if (request.endsWith('/paymentsApi'))
      return {
        getSchoolBilling: async () => {
          harness.calls.read++;
          return harness.billing;
        },
        createSchoolBillingSetup: () => {
          harness.calls.create++;
          return harness.create();
        },
      };
    if (request.endsWith('/useForegroundRefresh'))
      return { useForegroundRefresh: () => {} };
    if (request.endsWith('/navigationSlice'))
      return { refreshMarketplace: () => ({ type: 'refresh' }) };
    if (request.endsWith('/store/hooks'))
      return { useAppDispatch: () => () => {} };
    if (request.endsWith('/session'))
      return { getSessionVersion: () => harness.version };
    if (request.endsWith('/flowCoordinator'))
      return {
        getPendingPaymentFlows: async () => harness.flows,
        onPaymentFlowsChanged: () => () => {},
        withPaymentResourceLock: async (_resource, action) => action(),
        savePaymentFlow: async input => {
          harness.calls.save.push(input);
          const saved = {
            ...input,
            version: 1,
            flowId: 'new-flow',
            userId: 'school',
            createdAt: '2030-01-01T00:00:00Z',
          };
          harness.flows.unshift(saved);
          return saved;
        },
        openPaymentFlow: async (flow, url) => {
          harness.calls.open.push({ flow, url });
        },
      };
    if (request.endsWith('/paymentUtils'))
      return {
        isStripeCheckoutUrl: value =>
          new URL(value).hostname === 'checkout.stripe.com',
        formatPence: value => 'GBP ' + value / 100,
      };
    if (request === '../Ui/Button') return 'Button';
    if (request === '../Ui/Checkbox') return 'Checkbox';
    if (request === '../Ui/ConfirmDialog') return 'ConfirmDialog';
    if (request === './SettingsCardHeader') return 'SettingsCardHeader';
    if (request === './settingsStyles')
      return { useSettingsStyles: () => ({}) };
  }
  return originalLoad.call(this, request, parent, isMain);
};
const SchoolBillingCard =
  require('../components/dashboard/SchoolBillingCard').default;
Module._load = originalLoad;

function elements(node, type) {
  if (Array.isArray(node)) return node.flatMap(child => elements(child, type));
  if (!node || typeof node !== 'object' || !node.props) return [];
  return [
    ...(node.type === type ? [node] : []),
    ...elements(node.props.children, type),
  ];
}
const pending = {
  kind: 'school-card',
  sessionId: 'cs_previous',
  expiresAt: 2_000_000_000,
  version: 1,
  userId: 'school',
  flowId: 'previous-flow',
  createdAt: '2026-11-12T00:00:00Z',
};

function mount(options = {}) {
  const instance = {
    version: 1,
    slots: [],
    cleanups: [],
    effects: [],
    cursor: 0,
    dirty: false,
    mounted: true,
    flows: [],
    calls: { read: 0, create: 0, save: [], open: [] },
    billing: {
      setupStatus: 'NOT_STARTED',
      automaticPaymentsEnabled: false,
      stripeSyncStatus: 'SYNCED',
      canEnableAutomaticPayments: false,
      paymentMethod: null,
    },
    create: async () => ({
      sessionId: 'cs_fresh',
      url: 'https://checkout.stripe.com/c/setup',
      expiresAt: 2_000_000_000,
    }),
    ...options,
    useState(initial) {
      const index = this.cursor++;
      if (!this.slots[index])
        this.slots[index] = {
          value: typeof initial === 'function' ? initial() : initial,
        };
      return [
        this.slots[index].value,
        next => {
          const value =
            typeof next === 'function' ? next(this.slots[index].value) : next;
          if (value !== this.slots[index].value) {
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
    useCallback(callback, dependencies) {
      const index = this.cursor++;
      const previous = this.slots[index];
      if (
        !previous ||
        dependencies.some((value, i) => value !== previous.dependencies[i])
      )
        this.slots[index] = { dependencies, callback };
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
      harness = this;
      this.cursor = 0;
      this.dirty = false;
      this.tree = SchoolBillingCard({});
      for (const effect of this.effects.splice(0)) effect();
    },
    async flush() {
      for (let i = 0; i < 24; i++) {
        await Promise.resolve();
        if (this.mounted && this.dirty) this.render();
      }
    },
    button(title) {
      return elements(this.tree, 'Button').find(
        element => element.props.title === title,
      );
    },
    consent() {
      return elements(this.tree, 'Checkbox')[0];
    },
    confirmation() {
      return elements(this.tree, 'ConfirmDialog').find(
        element => element.props.title === 'Start a fresh card setup?',
      );
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

test('pending setup can be deliberately restarted with fresh consent and confirmation, retaining old recovery references', async () => {
  const h = mount({
    flows: [{ ...pending }],
    billing: {
      setupStatus: 'PENDING',
      automaticPaymentsEnabled: false,
      stripeSyncStatus: 'SYNCED',
    },
  });
  await h.flush();
  assert.equal(h.consent().props.checked, false);
  assert.equal(h.consent().props.disabled, false);
  assert.equal(h.button('Start a fresh card setup').props.disabled, true);
  await h.button('Start a fresh card setup').props.onPress();
  await h.flush();
  assert.equal(h.calls.create, 0);
  assert.equal(h.confirmation().props.visible, false);
  h.consent().props.onChange(true);
  await h.flush();
  await h.button('Start a fresh card setup').props.onPress();
  await h.flush();
  assert.equal(h.calls.create, 0);
  assert.equal(h.confirmation().props.visible, true);
  assert.match(h.confirmation().props.description, /Check setup status first/);
  assert.match(
    h.confirmation().props.description,
    /old link will no longer complete setup/,
  );
  await h.confirmation().props.onConfirm();
  await h.flush();
  assert.equal(h.calls.create, 1);
  assert.equal(h.calls.save.length, 1);
  assert.equal(h.calls.open.length, 1);
  assert.equal(h.flows.length, 2);
  assert.equal(h.flows[1].sessionId, 'cs_previous');
  assert.equal(h.consent().props.checked, false);
});

test('a lost setup-creation response refreshes settings and requires new consent and confirmation without automatic replay', async () => {
  const h = mount();
  h.create = async () => {
    h.billing = { ...h.billing, setupStatus: 'PENDING' };
    throw new Error('Request timed out');
  };
  await h.flush();
  h.consent().props.onChange(true);
  await h.flush();
  await h.button('Add card and enable automatic payments').props.onPress();
  await h.flush();
  assert.equal(h.calls.create, 1);
  assert.equal(h.calls.read, 2);
  assert.deepEqual(h.calls.save, []);
  assert.deepEqual(h.calls.open, []);
  assert.equal(h.consent().props.checked, false);
  assert.equal(h.button('Start a fresh card setup').props.disabled, true);
  h.consent().props.onChange(true);
  await h.flush();
  await h.button('Start a fresh card setup').props.onPress();
  await h.flush();
  assert.equal(h.calls.create, 1);
  assert.equal(h.confirmation().props.visible, true);
});

test('restarting saved-card setup marks the new recovery reference as a replacement', async () => {
  const h = mount({
    flows: [{ ...pending }],
    billing: {
      setupStatus: 'READY',
      automaticPaymentsEnabled: true,
      stripeSyncStatus: 'SYNCED',
      paymentMethod: { type: 'card', label: 'Visa ending 4242' },
    },
  });
  await h.flush();
  h.consent().props.onChange(true);
  await h.flush();
  await h.button('Start a fresh card setup').props.onPress();
  await h.flush();
  await h.confirmation().props.onConfirm();
  await h.flush();
  assert.equal(h.calls.save[0].replacingCard, true);
  assert.equal(h.calls.save[0].sessionId, 'cs_fresh');
  assert.equal(h.flows[1].sessionId, 'cs_previous');
});
