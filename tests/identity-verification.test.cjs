require('./register.cjs');
const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const fs = require('node:fs');
const path = require('node:path');

const passwords = new Map();
const originalLoad = Module._load;
Module._load = function mockedLoad(request, parent, isMain) {
  if (request === 'react-native') return { Platform: { OS: 'android' } };
  if (request === 'react-native-keychain') return {
    ACCESSIBLE: { WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'device-only' },
    getGenericPassword: async ({ service }) => passwords.has(service)
      ? { username: 'session', password: passwords.get(service) } : false,
    setGenericPassword: async (_username, password, { service }) => {
      passwords.set(service, password);
      return { service };
    },
    resetGenericPassword: async ({ service }) => passwords.delete(service),
  };
  return originalLoad.call(this, request, parent, isMain);
};

const api = require('../feature/identityVerification/apis/identityVerificationApi');
const session = require('../utils/api/session');
const verification = {
  id: 'check-one',
  status: 'LINK_SENT',
  result: null,
  guestLinkUrl: 'https://provider.example.test/journey?token=opaque',
  createdAt: '2030-01-01T12:00:00Z',
  linkExpiresAt: '2030-01-08T12:00:00Z',
  submittedAt: null,
  completedAt: null,
};
const identity = {
  canStart: true, required: true, state: 'LINK_SENT', verification, verifiedAt: null,
};

function response(status, data, code) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => null },
    json: async () => ({ success: status < 400, data, code, message: code }),
  };
}

test.beforeEach(async () => {
  session.clearTokens();
  await session.saveTokens({ accessToken: 'access-old', refreshToken: 'refresh-old' });
  session.setCurrentSessionUser({ id: 'teacher-one', email: 'teacher@example.test' });
});

test('identity gate and pending states match the web for every backend state', () => {
  for (const state of [
    'NOT_STARTED', 'LINK_SENT', 'PROCESSING', 'IN_REVIEW', 'RETRY_PENDING',
    'VERIFIED', 'UNSUCCESSFUL',
  ]) {
    assert.equal(api.identityStepRequired({ ...identity, state }),
      ['NOT_STARTED', 'UNSUCCESSFUL'].includes(state), state);
    assert.equal(api.identityStepRequired({ ...identity, state, required: false }), false);
    assert.equal(api.identityCheckPending(state),
      ['LINK_SENT', 'PROCESSING', 'IN_REVIEW', 'RETRY_PENDING'].includes(state), state);
  }
});

test('expired and cancelled checks preserve backend status without claiming verification', () => {
  for (const status of ['EXPIRED', 'CANCELLED']) {
    const item = api.normalizeMyIdentityVerification({
      ...identity, state: 'NOT_STARTED', verification: { ...verification, status },
    });
    assert.equal(item.verification.status, status);
    assert.equal(item.verification.guestLinkUrl, null);
    assert.equal(item.state, 'NOT_STARTED');
    assert.equal(api.identityStepRequired(item), true);
  }
  assert.match(api.describeIdentityState({
    ...identity, state: 'NOT_STARTED', verification: { ...verification, status: 'EXPIRED' },
  }), /expired/);
});

test('only the current LINK_SENT check exposes a valid HTTPS provider URL', () => {
  assert.equal(api.normalizeIdentityVerification(verification).guestLinkUrl,
    verification.guestLinkUrl);
  for (const guestLinkUrl of [
    'http://provider.example.test', 'javascript:alert(1)', 'supplyed://verified',
    'https://', 'https://user:password@provider.example.test', '', null,
  ]) {
    assert.equal(api.normalizeIdentityVerification({ ...verification, guestLinkUrl }).guestLinkUrl,
      null, String(guestLinkUrl));
  }
  for (const status of ['SUBMITTED', 'RESULTS_READY', 'COMPLETED', 'EXPIRED', 'CANCELLED']) {
    assert.equal(api.normalizeIdentityVerification({ ...verification, status }).guestLinkUrl, null);
  }
});

test('malformed identity responses do not disable the gate or fabricate verification', () => {
  assert.equal(api.normalizeMyIdentityVerification(null).required, true);
  assert.equal(api.normalizeMyIdentityVerification({ required: 'false', state: 'PASSED' }).state,
    'NOT_STARTED');
  assert.equal(api.normalizeIdentityVerification({ ...verification, id: '' }), null);
  assert.equal(api.normalizeIdentityVerification({ ...verification, status: 'PASSED' }), null);
  assert.equal(api.normalizeIdentityVerification({ ...verification, result: 'PASSED' }).result, null);
});

test('normalization retains only teacher-safe fields from identity and DBS records', () => {
  const value = api.normalizeIdentityVerification({
    ...verification, decisionNote: 'private', documentNotes: 'private', providerContainerId: 'private',
  });
  assert.deepEqual(value, verification);
  for (const state of ['IN_PROGRESS', 'VERIFIED', 'CERTIFICATE_NEEDED', 'NOT_VERIFIED']) {
    const check = api.normalizeMyDbsCheck({ dbsCheck: {
      id: 'dbs-one', state, submittedAt: null, resultAt: null,
      decisionNote: 'private', ucheckReference: 'private', reportUrl: 'private',
    } });
    assert.deepEqual(check, { id: 'dbs-one', state, submittedAt: null, resultAt: null });
    assert.ok(api.describeDbsCheck(check));
  }
  assert.equal(api.normalizeMyDbsCheck({ dbsCheck: null }), null);
  assert.throws(() => api.normalizeMyDbsCheck({ dbsCheck: { id: 'dbs', state: 'CLEAR' } }));
});

test('start posts exactly the existing consent payload using the signed-in account', async () => {
  const requests = [];
  global.fetch = async (url, options) => {
    requests.push({ url, ...options });
    return response(201, verification);
  };
  assert.deepEqual(await api.startIdentityVerification(true), verification);
  assert.equal(requests.length, 1);
  assert.match(requests[0].url, /\/api\/identity-verification\/me$/);
  assert.equal(requests[0].method, 'POST');
  assert.deepEqual(JSON.parse(requests[0].body), { consent: true });
  assert.equal(requests[0].headers.Authorization, 'Bearer access-old');
});

test('consent is required before any provider session request', async () => {
  let requests = 0;
  global.fetch = async () => { requests++; return response(201, verification); };
  await assert.rejects(api.startIdentityVerification(false), /Agree to the identity check/);
  await assert.rejects(api.startIdentityVerification(undefined), /Agree to the identity check/);
  assert.equal(requests, 0);
});

test('status refresh reads the trusted teacher identity and DBS endpoints without starting checks', async () => {
  const requests = [];
  const dbsCheck = { id: 'dbs-one', state: 'CERTIFICATE_NEEDED', submittedAt: null, resultAt: null };
  global.fetch = async (url, options) => {
    requests.push({ url, ...options });
    return response(200, url.endsWith('/dbs-checks/me') ? { dbsCheck } : identity);
  };
  assert.deepEqual(await api.getMyIdentityVerification(), identity);
  assert.deepEqual(await api.getMyDbsCheck(), dbsCheck);
  assert.equal(requests.length, 2);
  assert.ok(requests.every(request => request.method === 'GET' && !request.body));
  assert.ok(requests.every(request => request.headers.Authorization === 'Bearer access-old'));
});

test('authentication expiry refreshes tokens and replays the same consent payload once', async () => {
  const requests = [];
  global.fetch = async (url, options) => {
    requests.push({ url, ...options });
    if (url.endsWith('/auth/refresh'))
      return response(200, { accessToken: 'access-new', refreshToken: 'refresh-new' });
    if (options.headers.Authorization === 'Bearer access-old')
      return response(401, null, 'ACCESS_TOKEN_EXPIRED');
    return response(201, verification);
  };
  assert.deepEqual(await api.startIdentityVerification(true), verification);
  assert.equal(requests.length, 3);
  assert.equal(requests[2].headers.Authorization, 'Bearer access-new');
  assert.deepEqual(JSON.parse(requests[2].body), { consent: true });
});

test('provider conflict and eligibility failures are surfaced without another session request', async () => {
  for (const [status, code] of [[409, 'IDENTITY_ALREADY_IN_PROGRESS'], [403, 'FORBIDDEN']]) {
    let requests = 0;
    global.fetch = async () => { requests++; return response(status, null, code); };
    await assert.rejects(api.startIdentityVerification(true), error =>
      error.status === status && error.code === code);
    assert.equal(requests, 1);
  }
});

test('offline errors and malformed successful start responses remain errors', async () => {
  global.fetch = async () => { throw new Error('offline'); };
  await assert.rejects(api.getMyIdentityVerification(), error => error.code === 'NETWORK_ERROR');
  await assert.rejects(api.getMyDbsCheck(), error => error.code === 'NETWORK_ERROR');
  global.fetch = async () => response(201, { status: 'LINK_SENT' });
  await assert.rejects(api.startIdentityVerification(true), /could not be started/);
});

test('an old account response cannot appear after the session changes', async () => {
  let finish;
  global.fetch = async () => new Promise(resolve => { finish = resolve; });
  const pending = api.getMyIdentityVerification();
  session.clearTokens();
  finish(response(200, identity));
  await assert.rejects(pending, error => error.code === 'SESSION_CHANGED');
});

const webDirectory = path.resolve(__dirname, '..', '..', '..', 'supplyed-web');
const presentationFile = path.join(webDirectory, 'features', 'identity-verification', 'presentation.ts');
test('all mobile identity labels, descriptions and gates match the existing web implementation', {
  skip: !fs.existsSync(presentationFile),
}, () => {
  const web = require(presentationFile);
  const schemas = require(path.join(webDirectory, 'features', 'identity-verification', 'schemas.ts'));
  for (const state of [
    'NOT_STARTED', 'LINK_SENT', 'PROCESSING', 'IN_REVIEW', 'RETRY_PENDING',
    'VERIFIED', 'UNSUCCESSFUL',
  ]) {
    const item = { ...identity, state, verifiedAt: '2030-01-03T12:00:00Z' };
    assert.deepEqual(api.normalizeMyIdentityVerification(item), schemas.normalizeMyIdentityVerification(item));
    assert.deepEqual(api.identityStateTag(state), web.identityStateTag(state));
    assert.equal(api.describeIdentityState(item), web.describeIdentityState(item));
    assert.equal(api.identityStepRequired(item), web.identityStepRequired(item));
    assert.equal(api.identityCheckPending(state), web.identityCheckPending(state));
  }
});
