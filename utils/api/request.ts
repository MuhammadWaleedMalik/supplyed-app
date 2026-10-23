import { API_URL } from '../../constants/api';
import { userFacingError } from './userFacingError';
import { normalizeMarketplaceResponse } from './marketplaceResponse';
import {
  apiErrorMessage,
  FieldErrors,
  joinApiPath,
  parseApiReply,
  ParsedApiReply,
} from './response';
import { endpoints } from '../../constants/endpoints';
import { refreshDropdowns } from './dropdownEvents';
import {
  expireSession,
  getAccessToken,
  getRefreshToken,
  getSessionVersion,
  saveTokens,
} from './session';

export class ApiError extends Error {
  status: number;
  code: string;
  requestId: string;
  fieldErrors?: FieldErrors;

  constructor(
    message: string,
    status: number,
    code = '',
    requestId = '',
    fieldErrors?: FieldErrors,
  ) {
    super(userFacingError(message, status, code));
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.requestId = requestId;
    this.fieldErrors = fieldErrors;
  }
}

type RequestOptions = { signal?: AbortSignal; timeoutMs?: number };

export async function apiRequest<T>(
  path: string,
  method = 'GET',
  body?: object,
  token = '',
  options: RequestOptions = {},
): Promise<T> {
  if (!__DEV__ && !API_URL.startsWith('https://')) {
    throw new ApiError(
      'A secure production API address is required.',
      0,
      'API_CONFIGURATION',
    );
  }
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, options.timeoutMs ?? 30000);
  const cancel = () => controller.abort();
  options.signal?.addEventListener('abort', cancel, { once: true });
  let response: Response;
  let reply: ParsedApiReply;
  let headerRequestId = '';
  try {
    response = await fetch(joinApiPath(API_URL, path), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    headerRequestId = response.headers?.get('X-Request-Id') || '';
    if (response.status === 204) return undefined as T;
    try {
      reply = parseApiReply(await response.json());
    } catch {
      if (controller.signal.aborted) throw new Error('Request aborted');
      // Preserve the HTTP status when proxies return HTML or empty error bodies.
      throw new ApiError(
        response.ok
          ? 'SupplyED returned an invalid response. Refresh before retrying.'
          : 'SupplyED could not complete the request. Please try again.',
        response.ok ? 0 : response.status,
        'INVALID_RESPONSE',
        headerRequestId,
      );
    }
  } catch (problem) {
    if (problem instanceof ApiError) throw problem;
    throw new ApiError(
      timedOut
        ? 'The request timed out. Refresh to check the latest status before trying again.'
        : controller.signal.aborted
        ? 'The request was cancelled.'
        : 'Cannot reach SupplyEd. Check your connection and try again.',
      0,
      timedOut
        ? 'REQUEST_TIMEOUT'
        : controller.signal.aborted
        ? 'REQUEST_CANCELLED'
        : 'NETWORK_ERROR',
    );
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener('abort', cancel);
  }

  if (!response.ok || reply.success === false) {
    // A failed choices read must not trigger another choices read forever.
    if (method !== 'GET') refreshDropdowns(reply.code || '');
    if (reply.requestId) {
      console.warn('SupplyED API request failed', {
        path,
        status: response.status,
        code: reply.code,
        requestId: reply.requestId,
      });
    }
    throw new ApiError(
      apiErrorMessage(reply),
      response.status,
      reply.code,
      reply.requestId || headerRequestId,
      reply.fieldErrors,
    );
  }
  if (reply.envelope && !reply.hasData) {
    throw new ApiError(
      'SupplyED returned an incomplete response. Refresh the latest status before retrying.',
      0,
      'INVALID_RESPONSE',
      reply.requestId || headerRequestId,
    );
  }
  return normalizeMarketplaceResponse(reply.data, path) as T;
}

// Several screens can load together. They share one token refresh request.
let refreshRequest: Promise<void> | undefined;
let refreshVersion = 0;

async function refreshAccessToken() {
  const previousRefreshToken = getRefreshToken();
  const version = getSessionVersion();
  try {
    const refreshed = await apiRequest<{
      accessToken: string;
      refreshToken?: string;
      tokens?: { accessToken?: string; refreshToken?: string };
    }>(endpoints.refresh, 'POST', { refreshToken: previousRefreshToken });
    if (
      !(refreshed.accessToken || refreshed.tokens?.accessToken) ||
      getSessionVersion() !== version
    ) {
      throw new ApiError('Please sign in again.', 401);
    }
    await saveTokens(refreshed);
  } catch (error) {
    if (
      getSessionVersion() === version &&
      error instanceof ApiError &&
      (error.status === 401 || error.status === 403)
    )
      expireSession();
    throw error;
  }
}

export function refreshSessionToken() {
  const version = getSessionVersion();
  if (!getRefreshToken()) {
    expireSession();
    return Promise.reject(new ApiError('Please sign in again.', 401));
  }
  if (!refreshRequest || refreshVersion !== version) {
    refreshVersion = version;
    refreshRequest = refreshAccessToken().finally(() => {
      if (refreshVersion === version) refreshRequest = undefined;
    });
  }
  return refreshRequest;
}

export async function protectedRequest<T>(
  path: string,
  method = 'GET',
  body?: object,
): Promise<T> {
  const token = getAccessToken();
  const version = getSessionVersion();
  try {
    const result = await apiRequest<T>(path, method, body, token);
    if (getSessionVersion() !== version) {
      throw new ApiError(
        'Your session changed. Please try again.',
        401,
        'SESSION_CHANGED',
      );
    }
    return result;
  } catch (error) {
    // Never replay an old account's request after logout or a new login.
    if (getSessionVersion() !== version) throw error;
    if (!(error instanceof ApiError) || error.status !== 401) throw error;
    // Invalid passwords and 2FA codes also use 401. Refresh only explicit
    // access-token failures; an access-token rejection alone must not discard a
    // still-valid refresh session.
    if (
      ![
        'ACCESS_TOKEN_EXPIRED',
        'AUTH_TOKEN_MISSING',
        'INVALID_ACCESS_TOKEN',
      ].includes(error.code)
    )
      throw error;
    if (!getRefreshToken()) {
      expireSession();
      throw error;
    }
    // Another request may already have replaced the expired access token.
    if (token === getAccessToken()) {
      await refreshSessionToken();
    }
    if (getSessionVersion() !== version) throw error;
    try {
      const result = await apiRequest<T>(path, method, body, getAccessToken());
      if (getSessionVersion() !== version) {
        throw new ApiError(
          'Your session changed. Please try again.',
          401,
          'SESSION_CHANGED',
        );
      }
      return result;
    } catch (retryError) {
      if (
        getSessionVersion() === version &&
        retryError instanceof ApiError &&
        retryError.status === 401 &&
        [
          'ACCESS_TOKEN_EXPIRED',
          'AUTH_TOKEN_MISSING',
          'INVALID_ACCESS_TOKEN',
        ].includes(retryError.code)
      )
        expireSession();
      throw retryError;
    }
  }
}
