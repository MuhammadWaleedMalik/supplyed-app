require('./register.cjs');
const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');

const secureStore = new Map();
const keychain = {
  ACCESSIBLE: { WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'device-only' },
  async getGenericPassword({ service }) {
    const password = secureStore.get(service);
    return password ? { username: 'session', password } : false;
  },
  async setGenericPassword(_username, password, { service }) {
    secureStore.set(service, password);
    return { service };
  },
  async resetGenericPassword({ service }) {
    secureStore.delete(service);
    return true;
  },
};
const originalLoad = Module._load;
Module._load = function mockedLoad(request, parent, isMain) {
  if (request === 'react-native') return { Platform: { OS: 'android' } };
  if (request === 'react-native-keychain') return keychain;
  return originalLoad.call(this, request, parent, isMain);
};

const {
  ApiError,
  apiRequest,
  protectedRequest,
} = require('../utils/api/request');
const {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  saveTokens,
  setCurrentSessionUser,
  getCurrentSessionUser,
} = require('../utils/api/session');

function response(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => null },
    json: async () => body,
  };
}

function expired() {
  return response(401, {
    success: false,
    statusCode: 401,
    message: 'Access token expired',
    code: 'ACCESS_TOKEN_EXPIRED',
    data: null,
  });
}

async function session() {
  clearTokens();
  await saveTokens({
    accessToken: 'access-old',
    refreshToken: 'refresh-old',
  });
  setCurrentSessionUser({ id: 'account-one', email: 'one@example.test' });
}

test.beforeEach(session);

test('accepts a successful raw backend payload', async () => {
  global.fetch = async () => response(200, { id: 'raw-job' });
  assert.deepEqual(await apiRequest('/jobs/raw'), {
    id: 'raw-job',
    hours: null,
    days: null,
  });
});

test('shares one refresh, persists rotated tokens and replays each request once', async () => {
  let resourceCalls = 0;
  let refreshCalls = 0;
  global.fetch = async (url, options) => {
    if (url.endsWith('/auth/refresh')) {
      refreshCalls += 1;
      assert.deepEqual(JSON.parse(options.body), {
        refreshToken: 'refresh-old',
      });
      await new Promise(resolve => setTimeout(resolve, 5));
      return response(200, {
        success: true,
        data: {
          tokens: {
            accessToken: 'access-new',
            refreshToken: 'refresh-new',
          },
        },
      });
    }
    resourceCalls += 1;
    if (options.headers.Authorization === 'Bearer access-old') return expired();
    assert.equal(options.headers.Authorization, 'Bearer access-new');
    return response(200, { success: true, data: { call: resourceCalls } });
  };

  const results = await Promise.all([
    protectedRequest('/resource'),
    protectedRequest('/resource'),
  ]);
  assert.equal(refreshCalls, 1);
  assert.equal(resourceCalls, 4);
  assert.equal(results.length, 2);
  assert.equal(getAccessToken(), 'access-new');
  assert.equal(getRefreshToken(), 'refresh-new');
});

test('keeps the account on a transient refresh-service failure', async () => {
  global.fetch = async url => {
    if (url.endsWith('/auth/refresh'))
      return response(503, {
        success: false,
        message: 'Unavailable',
        code: 'SERVICE_UNAVAILABLE',
        data: null,
      });
    return expired();
  };
  await assert.rejects(
    protectedRequest('/resource'),
    error => error instanceof ApiError && error.status === 503,
  );
  assert.equal(getAccessToken(), 'access-old');
  assert.equal(getRefreshToken(), 'refresh-old');
  assert.equal(getCurrentSessionUser().id, 'account-one');
});

test('expires the account only when refresh is definitively rejected', async () => {
  global.fetch = async url =>
    url.endsWith('/auth/refresh')
      ? response(401, {
          success: false,
          message: 'Refresh rejected',
          code: 'INVALID_REFRESH_TOKEN',
          data: null,
        })
      : expired();
  await assert.rejects(protectedRequest('/resource'));
  assert.equal(getAccessToken(), '');
  assert.equal(getRefreshToken(), '');
  assert.equal(getCurrentSessionUser(), undefined);
});

test('retries an expired request once and never loops', async () => {
  let resourceCalls = 0;
  let refreshCalls = 0;
  global.fetch = async url => {
    if (url.endsWith('/auth/refresh')) {
      refreshCalls += 1;
      return response(200, {
        success: true,
        data: { accessToken: 'access-new', refreshToken: 'refresh-new' },
      });
    }
    resourceCalls += 1;
    return expired();
  };
  await assert.rejects(protectedRequest('/resource'));
  assert.equal(refreshCalls, 1);
  assert.equal(resourceCalls, 2);
  assert.equal(getAccessToken(), '');
});

test('does not refresh unrelated 401 domain failures', async () => {
  let calls = 0;
  global.fetch = async () => {
    calls += 1;
    return response(401, {
      success: false,
      message: 'Invalid code',
      code: 'INVALID_TWO_FACTOR_CODE',
      data: null,
    });
  };
  await assert.rejects(protectedRequest('/protected-action'));
  assert.equal(calls, 1);
  assert.equal(getAccessToken(), 'access-old');
});

test('recovers an explicitly invalid access token through refresh', async () => {
  let resourceCalls = 0;
  let refreshCalls = 0;
  global.fetch = async (url, options) => {
    if (url.endsWith('/auth/refresh')) {
      refreshCalls += 1;
      return response(200, {
        success: true,
        data: { accessToken: 'access-recovered' },
      });
    }
    resourceCalls += 1;
    if (options.headers.Authorization === 'Bearer access-old')
      return response(401, {
        success: false,
        message: 'Invalid access token',
        code: 'INVALID_ACCESS_TOKEN',
        data: null,
      });
    return response(200, { success: true, data: { recovered: true } });
  };
  assert.deepEqual(await protectedRequest('/resource'), { recovered: true });
  assert.equal(refreshCalls, 1);
  assert.equal(resourceCalls, 2);
  assert.equal(getAccessToken(), 'access-recovered');
  assert.equal(getRefreshToken(), 'refresh-old');
});
