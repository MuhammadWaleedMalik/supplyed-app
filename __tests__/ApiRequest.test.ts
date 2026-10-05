import { apiRequest, ApiError, protectedRequest } from '../utils/api/request';
import {
  clearTokens,
  getAccessToken,
  onSessionExpired,
  saveTokens,
} from '../utils/api/session';
import { endpoints } from '../constants/endpoints';

function response(status: number, body: object) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

const fetchMock = jest.fn();
const originalFetch = globalThis.fetch;

beforeEach(() => {
  clearTokens();
  fetchMock.mockReset();
  globalThis.fetch = fetchMock;
});

afterAll(() => {
  globalThis.fetch = originalFetch;
});

it('unwraps backend data and attaches the signed-in bearer token', async () => {
  saveTokens({ accessToken: 'access', refreshToken: 'refresh' });
  fetchMock.mockResolvedValue(
    response(200, { success: true, data: { ready: true } }),
  );

  await expect(protectedRequest(endpoints.payoutAccount)).resolves.toEqual({
    ready: true,
  });
  expect(fetchMock.mock.calls[0][0]).toMatch(
    /\/api\/payments\/payout-account$/,
  );
  expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe(
    'Bearer access',
  );
});

it('keeps backend messages, error codes, and support request IDs', async () => {
  const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
  fetchMock.mockResolvedValue(
    response(429, {
      success: false,
      message: ['Wait before requesting another code.'],
      code: 'OTP_RATE_LIMIT',
      meta: { requestId: 'request-123' },
    }),
  );

  await expect(
    apiRequest(endpoints.phoneOtpSend, 'POST', { phone: '+447911123456' }),
  ).rejects.toMatchObject({
    message: 'Wait before requesting another code.',
    status: 429,
    code: 'OTP_RATE_LIMIT',
    requestId: 'request-123',
  });
  expect(warning).toHaveBeenCalledWith(
    'SupplyED API request failed',
    expect.objectContaining({ requestId: 'request-123' }),
  );
  warning.mockRestore();
});

it('rejects an incomplete successful response so mutations are reconciled before retry', async () => {
  fetchMock.mockResolvedValue(response(200, { success: true }));
  await expect(
    apiRequest(endpoints.instantPayout, 'POST', {}, 'access'),
  ).rejects.toMatchObject({ status: 0, code: 'INVALID_RESPONSE' });
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

it('refreshes once when multiple screens receive an expired-token response', async () => {
  saveTokens({ accessToken: 'expired', refreshToken: 'refresh' });
  let finishRefresh!: (value: Response) => void;
  fetchMock.mockImplementation((url: string, options: RequestInit) => {
    if (url.endsWith(endpoints.refresh)) {
      return new Promise<Response>(resolve => {
        finishRefresh = resolve;
      });
    }
    const headers = options.headers as Record<string, string>;
    return Promise.resolve(
      headers.Authorization === 'Bearer expired'
        ? response(401, { success: false, code: 'ACCESS_TOKEN_EXPIRED' })
        : response(200, { success: true, data: { ready: true } }),
    );
  });

  const first = protectedRequest(endpoints.payoutAccount);
  const second = protectedRequest(endpoints.invoicesMine);
  // Let both failed requests reach the shared refresh promise.
  for (let index = 0; index < 8; index += 1) await Promise.resolve();
  finishRefresh(
    response(200, { success: true, data: { accessToken: 'fresh' } }),
  );

  await expect(Promise.all([first, second])).resolves.toEqual([
    { ready: true },
    { ready: true },
  ]);
  expect(
    fetchMock.mock.calls.filter(([url]) => url.endsWith(endpoints.refresh)),
  ).toHaveLength(1);
  expect(getAccessToken()).toBe('fresh');
});

it('clears the session and tells navigation when refresh fails', async () => {
  saveTokens({ accessToken: 'expired', refreshToken: 'invalid-refresh' });
  const expired = jest.fn();
  const unsubscribe = onSessionExpired(expired);
  fetchMock.mockResolvedValue(
    response(401, { success: false, message: 'Please sign in again.' }),
  );

  await expect(protectedRequest(endpoints.invoicesMine)).rejects.toBeInstanceOf(
    ApiError,
  );
  expect(getAccessToken()).toBe('');
  expect(expired).toHaveBeenCalledTimes(1);
  unsubscribe();
});

it('never repeats an old account mutation after another account signs in', async () => {
  saveTokens({ accessToken: 'teacher-a', refreshToken: 'refresh-a' });
  let finishRequest!: (value: Response) => void;
  fetchMock.mockImplementation(
    () =>
      new Promise<Response>(resolve => {
        finishRequest = resolve;
      }),
  );
  const request = protectedRequest(endpoints.instantPayout, 'POST', {});
  clearTokens();
  saveTokens({ accessToken: 'teacher-b', refreshToken: 'refresh-b' });
  finishRequest(
    response(401, { success: false, code: 'ACCESS_TOKEN_EXPIRED' }),
  );

  await expect(request).rejects.toBeInstanceOf(ApiError);
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(getAccessToken()).toBe('teacher-b');
});

it.each(['AUTH_TOKEN_MISSING', 'INVALID_ACCESS_TOKEN'])(
  'returns to login for %s without refreshing',
  async code => {
    saveTokens({ accessToken: 'invalid', refreshToken: 'refresh' });
    const expired = jest.fn();
    const unsubscribe = onSessionExpired(expired);
    fetchMock.mockResolvedValue(response(401, { success: false, code }));

    await expect(
      protectedRequest(endpoints.invoicesMine),
    ).rejects.toMatchObject({ code });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(expired).toHaveBeenCalledTimes(1);
    unsubscribe();
  },
);

it('reports a payment timeout without automatically repeating the mutation', async () => {
  jest.useFakeTimers();
  fetchMock.mockImplementation(
    (_url: string, options: RequestInit) =>
      new Promise((_resolve, reject) => {
        options.signal?.addEventListener('abort', () =>
          reject(new Error('Aborted')),
        );
      }),
  );
  const request = apiRequest(endpoints.instantPayout, 'POST', {}, 'access');
  const outcome = request.catch(error => error);
  jest.advanceTimersByTime(30000);
  expect(await outcome).toMatchObject({ status: 0, code: 'REQUEST_TIMEOUT' });
  expect(fetchMock).toHaveBeenCalledTimes(1);
  jest.useRealTimers();
});
