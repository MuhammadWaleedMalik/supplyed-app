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
    super(message);
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

function errorMessage(reply: Reply) {
  if (Array.isArray(reply.message)) return reply.message.join(', ');
  return reply.message || 'Something went wrong. Please try again.';
}

export async function apiRequest<T>(
  path: string,
  method = 'GET',
  body?: object,
  token = '',
): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  let response: Response;
  let reply: Reply;
  try {
    response = await fetch(API_URL + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    if (response.status === 204) return undefined as T;
    reply = (await response.json()) as Reply;
    if (!reply || typeof reply !== 'object') {
      throw new Error('Invalid API response');
    }
  } catch {
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
      reply.meta?.requestId,
    );
  }
  if (reply.success !== true || !('data' in reply)) {
    throw new ApiError(
      'SupplyED returned an incomplete response. Refresh the latest status before retrying.',
      0,
      'INVALID_RESPONSE',
      reply.meta?.requestId,
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
    if (getSessionVersion() === version) expireSession();
    throw error;
  }
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
      if (!refreshRequest || refreshVersion !== version) {
        refreshVersion = version;
        refreshRequest = refreshAccessToken().finally(() => {
          if (refreshVersion === version) refreshRequest = undefined;
        });
      }
      await refreshRequest;
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
