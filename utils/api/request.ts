import { API_URL } from '../../constants/api';
import { endpoints } from '../../constants/endpoints';
import {
  expireSession,
  getAccessToken,
  getRefreshToken,
  getSessionVersion,
  saveTokens,
} from './session';

type Reply = {
  data?: unknown;
  message?: string | string[];
  code?: string;
  success?: boolean;
  meta?: { requestId?: string };
};

export class ApiError extends Error {
  status: number;
  code: string;
  requestId: string;

  constructor(message: string, status: number, code = '', requestId = '') {
    super(requestId ? message + '\nSupport reference: ' + requestId : message);
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

function errorMessage(reply: Reply) {
  if (Array.isArray(reply.message)) return reply.message.join(', ');
  return reply.message || 'Something went wrong. Please try again.';
}

function parseReply(value: unknown): Reply {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const record = value as Record<string, unknown>;
  const meta = record.meta;
  return {
    ...('data' in record ? { data: record.data } : {}),
    success: typeof record.success === 'boolean' ? record.success : undefined,
    message: typeof record.message === 'string'
      ? record.message
      : Array.isArray(record.message)
        ? record.message.filter((item): item is string => typeof item === 'string')
        : undefined,
    code: typeof record.code === 'string' ? record.code : undefined,
    meta: meta && typeof meta === 'object' && 'requestId' in meta && typeof meta.requestId === 'string'
      ? { requestId: meta.requestId }
      : undefined,
  };
}

export async function apiRequest<T>(
  path: string,
  method = 'GET',
  body?: object,
  token = '',
): Promise<T> {
  if (!__DEV__ && !API_URL.startsWith('https://')) {
    throw new ApiError('A secure production API address is required.', 0, 'API_CONFIGURATION');
  }
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  let response: Response;
  let reply: Reply;
  let headerRequestId = '';
  try {
    response = await fetch(API_URL + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    headerRequestId = response.headers?.get('X-Request-Id') || '';
    if (response.status === 204) return undefined as T;
    try {
      reply = parseReply(await response.json());
    } catch {
      if (controller.signal.aborted) throw new Error('Request aborted');
      // Preserve the HTTP status when proxies return HTML or empty error bodies.
      throw new ApiError(
        response.ok ? 'SupplyED returned an invalid response. Refresh before retrying.' : 'SupplyED could not complete the request. Please try again.',
        response.ok ? 0 : response.status,
        'INVALID_RESPONSE',
        headerRequestId,
      );
    }
  } catch (problem) {
    if (problem instanceof ApiError) throw problem;
    throw new ApiError(
      controller.signal.aborted
        ? 'The request timed out. Refresh to check the latest status before trying again.'
        : 'Cannot reach SupplyED. Check your connection and API address.',
      0,
      controller.signal.aborted ? 'REQUEST_TIMEOUT' : 'NETWORK_ERROR',
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok || reply.success === false) {
    if (reply.meta?.requestId) {
      console.warn('SupplyED API request failed', {
        path,
        status: response.status,
        code: reply.code,
        requestId: reply.meta.requestId,
      });
    }
    throw new ApiError(
      errorMessage(reply),
      response.status,
      reply.code,
      reply.meta?.requestId || headerRequestId,
    );
  }
  if (reply.success !== true || !('data' in reply)) {
    throw new ApiError(
      'SupplyED returned an incomplete response. Refresh the latest status before retrying.',
      0,
      'INVALID_RESPONSE',
      reply.meta?.requestId || headerRequestId,
    );
  }
  return reply.data as T;
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
    }>(endpoints.refresh, 'POST', { refreshToken: previousRefreshToken });
    if (!refreshed.accessToken || getSessionVersion() !== version) {
      throw new ApiError('Please sign in again.', 401);
    }
    saveTokens(refreshed);
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
    if (
      error.code === 'AUTH_TOKEN_MISSING' ||
      error.code === 'INVALID_ACCESS_TOKEN'
    ) {
      expireSession();
      throw error;
    }
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
        retryError.status === 401
      )
        expireSession();
      throw retryError;
    }
  }
}
