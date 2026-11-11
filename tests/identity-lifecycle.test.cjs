require('./register.cjs');
const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');

// Exercise the real hook without a native runtime. React state/effects are
// rendered explicitly; the shared foreground hook exposes its callback and
// requested polling interval so tests never need real clocks or network calls.
let harness;
const originalLoad = Module._load;
Module._load = function mockedLoad(request, parent, isMain) {
  if (parent?.filename.endsWith('useIdentityVerification.ts')) {
    if (request === 'react') return {
      useState: initial => harness.useState(initial),
      useRef: initial => harness.useRef(initial),
      useEffect: (effect, dependencies) => harness.useEffect(effect, dependencies),
    };
    if (request === 'react-native') return {
      Linking: { openURL: url => harness.openURL(url) },
    };
    if (request.endsWith('/authApi')) return {
      getCurrentUser: () => { harness.calls.user++; return harness.readUser(); },
    };
    if (request.endsWith('/useForegroundRefresh')) return {
      useForegroundRefresh: (refresh, enabled, milliseconds) => {
        harness.foreground = refresh;
        harness.polling = { enabled, milliseconds };
      },
    };
    if (request.endsWith('/session')) return {
      getSessionVersion: () => harness.sessionVersion,
    };
    if (request.endsWith('/identityVerificationApi')) return {
      getMyIdentityVerification: () => {
        harness.calls.identity++;
        return harness.readIdentity();
      },
      getMyDbsCheck: () => { harness.calls.dbs++; return harness.readDbs(); },
      startIdentityVerification: consent => {
        harness.calls.start.push(consent);
        return harness.createVerification(consent);
      },
    };
  }
  if (parent?.filename.endsWith('useForegroundRefresh.ts')) {
    if (request === 'react') return {
      useRef: initial => harness.useRef(initial),
      useEffect: (effect, dependencies) => harness.useEffect(effect, dependencies),
    };
    if (request === 'react-native') return {
      AppState: {
        get currentState() { return harness.appState; },
        addEventListener: (_event, callback) => {
          harness.listeners.add(callback);
          return { remove: () => harness.listeners.delete(callback) };
        },
      },
    };
    if (request.endsWith('/store/hooks')) return {
      useAppSelector: select => select({ dashboardNavigation: { dataRevision: harness.revision } }),
    };
  }
  return originalLoad.call(this, request, parent, isMain);
};
const { useIdentityVerification } = require('../feature/identityVerification/hooks/useIdentityVerification');
const { useForegroundRefresh } = require('../feature/dashboard/shared/hooks/useForegroundRefresh');
Module._load = originalLoad;

const verification = {
  id: 'identity-one', status: 'LINK_SENT', result: null,
  guestLinkUrl: 'https://provider.example.test/guest?token=opaque',
  linkExpiresAt: '2030-01-15T12:00:00Z', createdAt: '2030-01-01T12:00:00Z',
  submittedAt: null, completedAt: null,
};
function standing(state = 'NOT_STARTED', changes = {}) {
  return {
    required: true, state, verifiedAt: null, canStart: state === 'NOT_STARTED',
    verification: state === 'NOT_STARTED' ? null : { ...verification },
    ...changes,
  };
}
function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function mount(options = {}) {
  const instance = {
    slots: [], effects: [], cleanups: [], cursor: 0, dirty: false,
    mounted: true, writesAfterUnmount: 0, sessionVersion: 1,
    calls: { identity: 0, user: 0, dbs: 0, start: [], urls: [] },
    readIdentity: async () => standing(),
    readUser: async () => ({ id: 'teacher-one', phoneVerified: true }),
    readDbs: async () => null,
    createVerification: async () => ({ ...verification }),
    async openURL(url) { this.calls.urls.push(url); },
    ...options,
    useState(initial) {
      const index = this.cursor++;
      if (!this.slots[index]) this.slots[index] = {
        value: typeof initial === 'function' ? initial() : initial,
      };
      return [this.slots[index].value, next => {
        if (!this.mounted) this.writesAfterUnmount++;
        this.slots[index].value = typeof next === 'function'
          ? next(this.slots[index].value) : next;
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
      if (!previous || dependencies.some((value, i) => value !== previous.dependencies[i])) {
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
      this.value = options.renderHook
        ? options.renderHook()
        : useIdentityVerification(options.setup ?? true, options.showDbs ?? true);
      for (const effect of this.effects.splice(0)) effect();
      return this.value;
    },
    async flush() {
      // Promise.allSettled and the hook's continuations each queue microtasks.
      for (let i = 0; i < 12; i++) {
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

test.afterEach(() => { if (harness?.mounted) harness.unmount(); });

test('mount loads each requested resource once and never starts a provider session', async () => {
  const h = mount();
  await h.flush();
  assert.equal(h.calls.identity, 1);
  assert.equal(h.calls.user, 1);
  assert.equal(h.calls.dbs, 1);
  assert.deepEqual(h.calls.start, []);
  assert.equal(h.value.loading, false);
  assert.equal(h.value.identity.state, 'NOT_STARTED');
  assert.equal(h.value.dbsLoaded, true);
});

test('double start presses create one session and then use backend authoritative standing', async () => {
  const created = deferred();
  const h = mount({ createVerification: () => created.promise });
  await h.flush();
  const first = h.value.start(true);
  const second = h.value.start(true);
  await h.flush();
  assert.equal(h.value.starting, true);
  assert.deepEqual(h.calls.start, [true]);
  const authoritative = standing('PROCESSING', {
    verification: { ...verification, status: 'RESULTS_READY', guestLinkUrl: null },
  });
  h.readIdentity = async () => authoritative;
  created.resolve(verification);
  await Promise.all([first, second]);
  await h.flush();
  assert.deepEqual(h.value.identity, authoritative);
  assert.equal(h.calls.identity, 2);
  assert.equal(h.value.starting, false);
  assert.deepEqual(h.calls.urls, []);
});

test('consent, verified phone and backend eligibility are required before start', async () => {
  const h = mount();
  await h.flush();
  await h.value.start(false);
  h.value.updateUser({ id: 'teacher-one', phoneVerified: false });
  await h.flush();
  await h.value.start(true);
  h.value.updateUser({ id: 'teacher-one', phoneVerified: true });
  for (const identity of [
    standing('NOT_STARTED', { canStart: false }),
    standing('LINK_SENT', { canStart: true }),
    standing('UNSUCCESSFUL', { canStart: true }),
    standing('VERIFIED', { canStart: true }),
  ]) {
    h.readIdentity = async () => identity;
    await h.value.refresh();
    await h.flush();
    await h.value.start(true);
  }
  assert.deepEqual(h.calls.start, []);
});

test('a refresh already in flight prevents duplicate reads and session creation on slow networks', async () => {
  const pending = deferred();
  const h = mount();
  await h.flush();
  h.readIdentity = () => pending.promise;
  const first = h.value.refresh();
  await h.value.refresh();
  await h.foreground();
  await h.value.start(true);
  assert.equal(h.calls.identity, 2);
  assert.deepEqual(h.calls.start, []);
  pending.resolve(standing());
  await first;
  await h.flush();
  assert.equal(h.value.loading, false);
});

test('browser opening uses the exact guest URL and foreground return cannot verify an account', async () => {
  const current = standing('LINK_SENT');
  const h = mount({ readIdentity: async () => current });
  await h.flush();
  await h.value.openTrustId();
  await h.flush();
  assert.deepEqual(h.calls.urls, [verification.guestLinkUrl]);
  assert.deepEqual(h.value.identity, current);
  await h.foreground();
  await h.flush();
  assert.equal(h.value.identity.state, 'LINK_SENT');
  assert.equal(h.calls.identity, 2);
  assert.deepEqual(h.calls.start, []);
  h.readIdentity = async () => standing('VERIFIED', { verifiedAt: '2030-01-02T12:00:00Z' });
  await h.foreground();
  await h.flush();
  assert.equal(h.value.identity.state, 'VERIFIED');
});

test('browser cancellation/failure retains backend state, reports error and permits reopening', async () => {
  const launched = deferred();
  const h = mount({ readIdentity: async () => standing('LINK_SENT') });
  h.openURL = url => { h.calls.urls.push(url); return launched.promise; };
  await h.flush();
  const first = h.value.openTrustId();
  await h.value.openTrustId();
  await h.flush();
  assert.equal(h.value.opening, true);
  assert.equal(h.calls.urls.length, 1);
  launched.reject(new Error('native browser unavailable'));
  await first;
  await h.flush();
  assert.match(h.value.error, /Unable to open TrustID/);
  assert.equal(h.value.identity.state, 'LINK_SENT');
  assert.equal(h.value.opening, false);
  h.openURL = async url => { h.calls.urls.push(url); };
  await h.value.openTrustId();
  await h.flush();
  assert.equal(h.calls.urls.length, 2);
  assert.equal(h.value.error, '');
});

test('only LINK_SENT records with an available guest URL can launch the browser', async () => {
  const h = mount();
  await h.flush();
  for (const status of ['SUBMITTED', 'RESULTS_READY', 'COMPLETED', 'EXPIRED', 'CANCELLED']) {
    h.readIdentity = async () => standing('NOT_STARTED', {
      verification: { ...verification, status },
    });
    await h.value.refresh();
    await h.flush();
    await h.value.openTrustId();
  }
  h.readIdentity = async () => standing('LINK_SENT', {
    verification: { ...verification, guestLinkUrl: null },
  });
  await h.value.refresh();
  await h.flush();
  await h.value.openTrustId();
  assert.deepEqual(h.calls.urls, []);
});

test('only provider-active identity states request polling and all terminal/review states stop it', async () => {
  const h = mount();
  await h.flush();
  for (const state of [
    'LINK_SENT', 'PROCESSING', 'IN_REVIEW', 'RETRY_PENDING',
    'VERIFIED', 'UNSUCCESSFUL', 'NOT_STARTED',
  ]) {
    h.readIdentity = async () => standing(state);
    await h.value.refresh();
    await h.flush();
    assert.equal(h.polling.enabled, true);
    assert.equal(h.polling.milliseconds,
      ['LINK_SENT', 'PROCESSING'].includes(state) ? 30000 : 0, state);
  }
});

test('network errors retain prior identity and DBS records and a later refresh clears errors', async () => {
  const identity = standing('PROCESSING');
  const dbs = { id: 'dbs-one', state: 'IN_PROGRESS', submittedAt: null, resultAt: null };
  const h = mount({ readIdentity: async () => identity, readDbs: async () => dbs });
  await h.flush();
  h.readIdentity = async () => { throw new Error('No internet connection'); };
  h.readDbs = async () => { throw new Error('DBS connection timed out'); };
  await h.value.refresh();
  await h.flush();
  assert.deepEqual(h.value.identity, identity);
  assert.deepEqual(h.value.dbs, dbs);
  assert.equal(h.value.dbsLoaded, true);
  assert.equal(h.value.error, 'No internet connection');
  assert.equal(h.value.dbsError, 'DBS connection timed out');
  assert.equal(h.value.loading, false);
  h.readIdentity = async () => identity;
  h.readDbs = async () => dbs;
  await h.foreground();
  await h.flush();
  assert.equal(h.value.error, '');
  assert.equal(h.value.dbsError, '');
});

test('DBS or phone read failures do not hide a successful identity result', async () => {
  const identity = standing('VERIFIED');
  const h = mount({
    readIdentity: async () => identity,
    readDbs: async () => { throw new Error('DBS unavailable'); },
    readUser: async () => { throw new Error('Phone status unavailable'); },
  });
  await h.flush();
  assert.deepEqual(h.value.identity, identity);
  assert.equal(h.value.error, '');
  assert.equal(h.value.dbsError, 'DBS unavailable');
  assert.equal(h.value.dbsLoaded, false);
  assert.equal(h.value.userError, 'Phone status unavailable');
});

test('provider start failures surface their message, keep eligibility and allow a retry', async () => {
  const h = mount({ createVerification: async () => { throw new Error('Identity provider unavailable'); } });
  await h.flush();
  await h.value.start(true);
  await h.flush();
  assert.equal(h.value.error, 'Identity provider unavailable');
  assert.equal(h.value.identity.state, 'NOT_STARTED');
  assert.equal(h.value.starting, false);
  h.createVerification = async () => verification;
  h.readIdentity = async () => standing('LINK_SENT');
  await h.value.start(true);
  await h.flush();
  assert.equal(h.value.identity.state, 'LINK_SENT');
  assert.equal(h.value.error, '');
  assert.deepEqual(h.calls.start, [true, true]);
});

test('a timed-out POST refreshes the existing guest link instead of allowing a duplicate start', async () => {
  const h = mount({ createVerification: async () => { throw new Error('Request timed out'); } });
  await h.flush();
  const live = standing('LINK_SENT');
  h.readIdentity = async () => live;
  await h.value.start(true);
  await h.flush();
  assert.deepEqual(h.value.identity, live);
  assert.equal(h.value.identity.canStart, false);
  assert.equal(h.value.error, 'Request timed out');
  assert.equal(h.calls.identity, 2);
  await h.value.start(true);
  assert.deepEqual(h.calls.start, [true]);
  assert.equal(h.calls.identity, 2);
  await h.value.openTrustId();
  assert.deepEqual(h.calls.urls, [verification.guestLinkUrl]);
});

test('a 409 refreshes authoritative live or processing standing and disables further starts', async () => {
  for (const state of ['LINK_SENT', 'PROCESSING']) {
    const conflict = Object.assign(new Error('Your identity check is being processed'), { status: 409 });
    const h = mount({ createVerification: async () => { throw conflict; } });
    await h.flush();
    const current = standing(state, {
      verification: state === 'PROCESSING'
        ? { ...verification, status: 'SUBMITTED', guestLinkUrl: null } : verification,
    });
    h.readIdentity = async () => current;
    await h.value.start(true);
    await h.flush();
    assert.deepEqual(h.value.identity, current, state);
    assert.equal(h.value.identity.canStart, false);
    assert.equal(h.value.error, conflict.message);
    assert.equal(h.calls.identity, 2);
    await h.value.start(true);
    assert.deepEqual(h.calls.start, [true]);
    h.unmount();
  }
});

test('successful session creation keeps the guest link when the follow-up status read fails', async () => {
  const h = mount();
  await h.flush();
  h.readIdentity = async () => { throw new Error('Latest status unavailable'); };
  await h.value.start(true);
  await h.flush();
  assert.equal(h.value.identity.state, 'LINK_SENT');
  assert.equal(h.value.identity.canStart, false);
  assert.deepEqual(h.value.identity.verification, verification);
  assert.equal(h.value.error, 'Latest status unavailable');
  assert.equal(h.value.starting, false);
  assert.equal(h.calls.identity, 2);
  await h.value.start(true);
  assert.deepEqual(h.calls.start, [true]);
  await h.value.openTrustId();
  assert.deepEqual(h.calls.urls, [verification.guestLinkUrl]);
});

test('failed session creation cannot trigger a follow-up read after logout or unmount', async () => {
  for (const invalidate of ['session', 'unmount']) {
    const created = deferred();
    const h = mount({ createVerification: () => created.promise });
    await h.flush();
    const pending = h.value.start(true);
    if (invalidate === 'session') h.sessionVersion++;
    else h.unmount();
    created.reject(new Error('Request timed out'));
    await pending;
    await h.flush();
    assert.equal(h.calls.identity, 1, invalidate);
    assert.deepEqual(h.calls.urls, []);
    assert.equal(h.writesAfterUnmount, 0);
    if (h.mounted) h.unmount();
  }
});

test('an in-flight post-start status reply cannot overwrite state after logout or unmount', async () => {
  for (const invalidate of ['session', 'unmount']) {
    const latest = deferred();
    const h = mount();
    await h.flush();
    h.readIdentity = () => latest.promise;
    const pending = h.value.start(true);
    await h.flush();
    assert.equal(h.calls.identity, 2);
    assert.equal(h.value.identity.state, 'LINK_SENT');
    if (invalidate === 'session') h.sessionVersion++;
    else h.unmount();
    latest.resolve(standing('VERIFIED'));
    await pending;
    await h.flush();
    assert.equal(h.value.identity.state, 'LINK_SENT', invalidate);
    assert.equal(h.calls.identity, 2);
    assert.deepEqual(h.calls.urls, []);
    assert.equal(h.writesAfterUnmount, 0);
    if (h.mounted) h.unmount();
  }
});

test('session changes suppress stale start results and block browser launches from old closures', async () => {
  const created = deferred();
  const h = mount({ createVerification: () => created.promise });
  await h.flush();
  const before = h.value.identity;
  const pending = h.value.start(true);
  h.sessionVersion++;
  created.resolve(verification);
  await pending;
  await h.flush();
  assert.deepEqual(h.value.identity, before);
  assert.equal(h.calls.identity, 1);
  await h.value.openTrustId();
  await h.foreground();
  assert.deepEqual(h.calls.urls, []);
  assert.equal(h.calls.identity, 1);
});

test('unmount during a pending read or session creation suppresses updates and browser launch', async () => {
  const read = deferred();
  const h = mount({ readIdentity: () => read.promise });
  const stale = h.value;
  h.unmount();
  read.resolve(standing('VERIFIED'));
  await h.flush();
  assert.equal(h.writesAfterUnmount, 0);
  await stale.openTrustId();
  assert.deepEqual(h.calls.urls, []);

  const created = deferred();
  const second = mount({ createVerification: () => created.promise });
  await second.flush();
  const pending = second.value.start(true);
  second.unmount();
  created.resolve(verification);
  await pending;
  await second.flush();
  assert.equal(second.writesAfterUnmount, 0);
  assert.equal(second.calls.identity, 1);
  assert.deepEqual(second.calls.urls, []);
});

test('a loaded guest link cannot launch after logout or navigation away', async () => {
  const h = mount({ readIdentity: async () => standing('LINK_SENT') });
  await h.flush();
  const stale = h.value;
  h.sessionVersion++;
  await stale.openTrustId();
  assert.deepEqual(h.calls.urls, []);
  h.unmount();
  await stale.openTrustId();
  assert.deepEqual(h.calls.urls, []);
});

test('an in-flight browser rejection does not update an unmounted screen', async () => {
  const opened = deferred();
  const h = mount({ readIdentity: async () => standing('LINK_SENT') });
  await h.flush();
  h.openURL = () => opened.promise;
  const pending = h.value.openTrustId();
  h.unmount();
  opened.reject(new Error('browser closed'));
  await pending;
  assert.equal(h.writesAfterUnmount, 0);
});

test('reopening the screen retrieves pending work from the backend without creating another session', async () => {
  const first = mount({ readIdentity: async () => standing('LINK_SENT') });
  await first.flush();
  first.unmount();
  const reopened = mount({ readIdentity: async () => standing('PROCESSING') });
  await reopened.flush();
  assert.equal(reopened.value.identity.state, 'PROCESSING');
  assert.deepEqual(reopened.calls.start, []);
  assert.equal(reopened.calls.identity, 1);
});

test('a status-only card does not fetch setup user or DBS resources unless requested', async () => {
  const h = mount({ setup: false, showDbs: false });
  await h.flush();
  assert.equal(h.calls.identity, 1);
  assert.equal(h.calls.user, 0);
  assert.equal(h.calls.dbs, 0);
  assert.equal(h.value.user, undefined);
  assert.equal(h.value.dbs, null);
});

function mountForeground(context, options = {}) {
  const timers = new Map();
  let timerId = 0;
  context.mock.method(global, 'setInterval', (callback, milliseconds) => {
    timers.set(++timerId, { callback, milliseconds });
    return timerId;
  });
  context.mock.method(global, 'clearInterval', id => timers.delete(id));
  return mount({
    timers, listeners: new Set(), appState: 'active', revision: 0,
    enabled: undefined, milliseconds: undefined, refreshes: 0,
    refreshCallback: () => { harness.refreshes++; },
    ...options,
    renderHook: () => useForegroundRefresh(
      harness.refreshCallback, harness.enabled, harness.milliseconds,
    ),
    tick() { for (const timer of this.timers.values()) timer.callback(); },
    changeAppState(state) {
      this.appState = state;
      for (const listener of this.listeners) listener(state);
    },
  });
}

test('shared foreground helper preserves its 30-second default and only refreshes while active', t => {
  const h = mountForeground(t);
  assert.deepEqual([...h.timers.values()].map(timer => timer.milliseconds), [30000]);
  assert.equal(h.listeners.size, 1);
  assert.equal(h.refreshes, 0);
  h.tick();
  assert.equal(h.refreshes, 1);
  h.changeAppState('background');
  h.tick();
  h.revision++;
  h.render();
  assert.equal(h.refreshes, 1);
  h.changeAppState('active');
  assert.equal(h.refreshes, 2);
  h.revision++;
  h.render();
  assert.equal(h.refreshes, 3);
  h.render();
  assert.equal(h.refreshes, 3);
  let latestCalls = 0;
  h.refreshCallback = () => { latestCalls++; };
  h.render();
  h.tick();
  assert.equal(latestCalls, 1);
  assert.equal(h.refreshes, 3);
  assert.equal(h.timers.size, 1);
  h.unmount();
  assert.equal(h.timers.size, 0);
  assert.equal(h.listeners.size, 0);
});

test('zero polling clears the old interval but retains foreground and notification refresh', t => {
  const h = mountForeground(t, { milliseconds: 30000 });
  assert.equal(h.timers.size, 1);
  h.milliseconds = 0;
  h.render();
  assert.equal(h.timers.size, 0);
  assert.equal(h.listeners.size, 1);
  h.tick();
  assert.equal(h.refreshes, 0);
  h.changeAppState('background');
  h.changeAppState('active');
  assert.equal(h.refreshes, 1);
  h.revision++;
  h.render();
  assert.equal(h.refreshes, 2);
  h.milliseconds = 30000;
  h.render();
  assert.equal(h.timers.size, 1);
  assert.equal(h.listeners.size, 1);
  h.unmount();
  assert.equal(h.timers.size, 0);
  assert.equal(h.listeners.size, 0);
});

test('disabled shared foreground refresh removes all background work and ignores revisions', t => {
  const h = mountForeground(t);
  h.enabled = false;
  h.render();
  assert.equal(h.timers.size, 0);
  assert.equal(h.listeners.size, 0);
  h.revision++;
  h.render();
  h.changeAppState('active');
  h.tick();
  assert.equal(h.refreshes, 0);
  h.unmount();
});
