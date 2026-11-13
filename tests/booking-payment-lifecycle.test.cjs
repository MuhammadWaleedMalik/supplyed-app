/* eslint-env node, es2020 */
require('./register.cjs');
const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');

let harness;
class ApiError extends Error {}
const Button = function Button() {};
const ConfirmDialog = function ConfirmDialog() {};
const Input = function Input() {};
const originalLoad = Module._load;
Module._load = function mockedLoad(request, parent, isMain) {
  if (parent?.filename.endsWith('BookingInvoiceCard.tsx')) {
    if (request === 'react') return {
      Fragment: 'Fragment',
      useState: initial => harness.useState(initial),
      useRef: initial => harness.useRef(initial),
      useCallback: callback => callback,
      useEffect: (effect, dependencies) => harness.useEffect(effect, dependencies),
    };
    if (request === 'react-native') return { Text: 'Text', View: 'View' };
    if (request.endsWith('/session')) return { getSessionVersion: () => harness.sessionVersion };
    if (request.endsWith('/request')) return { ApiError };
    if (request.endsWith('/bookingsApi')) return {
      syncBookingPayment: id => { harness.calls.sync.push(id); return harness.sync(); },
    };
    if (request.endsWith('/invoicesApi')) return {
      createInvoice: data => { harness.calls.created.push(data); return harness.create(); },
    };
    if (request.endsWith('/paymentUtils')) return {
      automaticPaymentPhase: () => '',
      formatPence: amount => String(amount ?? 0),
      requiresCardAuthentication: () => false,
    };
    if (request === '../Ui/Button') return Button;
    if (request === '../Ui/ConfirmDialog') return ConfirmDialog;
    if (request === '../Ui/Input') return Input;
    if (
      request === './BookingTipCard' ||
      request === './InvoiceCard' ||
      request === './PaymentReleaseScheduleModal'
    )
      return () => null;
    if (request === './dashboardStyles') return { useStyles: () => ({}) };
    if (request === './jobStyles') return { useJobStyles: () => ({}) };
  }
  return originalLoad.call(this, request, parent, isMain);
};
const BookingInvoiceCard = require('../components/dashboard/BookingInvoiceCard').default;
Module._load = originalLoad;

const booking = {
  id: 'booking-one', status: 'COMPLETED', job: { title: 'Supply teaching' },
  payType: 'fixed', invoice: null, automaticPayment: { state: 'DISABLED' },
};
function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function mount(options = {}) {
  const instance = {
    slots: [], effects: [], cleanups: [], cursor: 0, dirty: false,
    mounted: true, sessionVersion: 1, staleWrites: 0,
    calls: { sync: [], created: [], changed: 0 },
    sync: async () => ({ ...booking }),
    create: async () => ({ id: 'invoice-one', status: 'OPEN' }),
    changed: async () => {},
    ...options,
    useState(initial) {
      const index = this.cursor++;
      if (!this.slots[index]) this.slots[index] = { value: initial };
      return [this.slots[index].value, next => {
        if (!this.mounted || this.sessionVersion !== 1) this.staleWrites++;
        this.slots[index].value = typeof next === 'function' ? next(this.slots[index].value) : next;
        this.dirty = true;
      }];
    },
    useRef(initial) {
      const index = this.cursor++;
      if (!this.slots[index]) this.slots[index] = { current: initial };
      return this.slots[index];
    },
    useEffect(effect, dependencies) {
      const index = this.cursor++;
      const previous = this.slots[index];
      if (!previous || dependencies.some((value, i) => value !== previous[i])) {
        this.slots[index] = dependencies;
        this.effects.push(() => { this.cleanups[index]?.(); this.cleanups[index] = effect(); });
      }
    },
    render() {
      // eslint-disable-next-line consistent-this
      harness = this;
      this.cursor = 0;
      this.dirty = false;
      this.tree = BookingInvoiceCard({
        booking, role: 'INSTITUTION',
        onChanged: () => { this.calls.changed++; return this.changed(); },
      });
      for (const effect of this.effects.splice(0)) effect();
      return this.tree;
    },
    async flush() {
      for (let i = 0; i < 6; i++) {
        await Promise.resolve();
        if (this.mounted && this.dirty) this.render();
      }
    },
    find(type, predicate = () => true) {
      function visit(node) {
        if (Array.isArray(node)) return node.flatMap(visit);
        if (!node || typeof node !== 'object') return [];
        return [node, ...visit(node.props?.children)];
      }
      const element = visit(this.tree).find(node => node.type === type && predicate(node.props));
      assert.ok(element, 'Expected rendered action');
      return element.props;
    },
    unmount() {
      for (const cleanup of this.cleanups) cleanup?.();
      this.mounted = false;
    },
  };
  instance.render();
  return instance;
}
test.afterEach(() => { if (harness?.mounted) harness.unmount(); });

test('booking payment reads never create an invoice and discard late results after account changes', async () => {
  const response = deferred();
  const h = mount({ sync: () => response.promise });
  await h.flush();
  assert.equal(h.calls.sync.length, 0);
  const refresh = h.find(Button, props => props.title === 'Refresh payment').onPress;
  const action = refresh();
  await refresh();
  assert.deepEqual(h.calls.sync, ['booking-one']);
  h.sessionVersion++;
  response.resolve({ ...booking, invoice: { id: 'other-invoice', status: 'PAID' } });
  await action;
  assert.equal(h.staleWrites, 0);
  assert.equal(h.calls.changed, 0);
  assert.equal(h.calls.created.length, 0);
  await refresh();
  assert.equal(h.calls.sync.length, 1);
});

test('unmounted booking payment reads and failures cannot update state or refresh parents', async () => {
  for (const fails of [false, true]) {
    const response = deferred();
    const h = mount({ sync: () => response.promise });
    await h.flush();
    const action = h.find(Button, props => props.title === 'Refresh payment').onPress();
    h.unmount();
    if (fails) response.reject(new Error('Network unavailable'));
    else response.resolve({ ...booking });
    await action;
    assert.equal(h.staleWrites, 0);
    assert.equal(h.calls.changed, 0);
  }
});

test('manual invoice creation submits once and never applies a late result to another session', async () => {
  const response = deferred();
  const h = mount({ create: () => response.promise });
  await h.flush();
  const confirm = h.find(ConfirmDialog).onConfirm;
  const action = confirm();
  assert.equal(await confirm(), false);
  assert.deepEqual(h.calls.created, [{ bookingId: 'booking-one' }]);
  h.sessionVersion++;
  response.resolve({ id: 'invoice-one', status: 'OPEN' });
  assert.equal(await action, false);
  assert.equal(h.staleWrites, 0);
  assert.equal(h.calls.changed, 0);
  assert.equal(await confirm(), false);
  assert.equal(h.calls.created.length, 1);
});

test('manual payment preflight stops when the booking was already paid', async () => {
  const h = mount({
    sync: async () => ({
      ...booking,
      invoice: { id: 'paid-invoice', status: 'PAID' },
    }),
  });
  await h.flush();
  assert.equal(await h.find(ConfirmDialog).onConfirm(), false);
  await h.flush();
  assert.deepEqual(h.calls.sync, ['booking-one']);
  assert.equal(h.calls.created.length, 0);
  assert.equal(h.calls.changed, 1);
});

test('manual invoice rejection and parent refresh completion are guarded after unmount', async () => {
  const failed = deferred();
  const h = mount({ create: () => failed.promise });
  await h.flush();
  const action = h.find(ConfirmDialog).onConfirm();
  await h.flush();
  assert.equal(h.calls.created.length, 1);
  h.unmount();
  failed.reject(new ApiError('Unknown submission result'));
  assert.equal(await action, false);
  assert.equal(h.staleWrites, 0);
  assert.equal(h.calls.changed, 0);

  const parent = deferred();
  const current = mount({ changed: () => parent.promise });
  await current.flush();
  const creation = current.find(ConfirmDialog).onConfirm();
  await current.flush();
  assert.equal(current.calls.changed, 1);
  current.unmount();
  parent.resolve();
  assert.equal(await creation, false);
  assert.equal(current.staleWrites, 0);
});
