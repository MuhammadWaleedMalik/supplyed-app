import { API_URL } from '../../constants/api';
import { endpoints } from '../../constants/endpoints';
import { getAccessToken, getRefreshToken, saveTokens } from './session';

type Reply = {
  data?: unknown;
  message?: string | string[];
  code?: string;
  success?: boolean;
};

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code = '') {
    super(message);
    this.status = status;
    this.code = code;
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

  let response: Response;
  try {
    response = await fetch(API_URL + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error(
      'Cannot reach SupplyED. Check your connection and API address.',
    );
  }

  if (response.status === 204) return undefined as T;
  const reply = (await response.json().catch(() => ({}))) as Reply;
  if (!response.ok || reply.success === false) {
    throw new ApiError(errorMessage(reply), response.status, reply.code);
  }
  return (reply.data === undefined ? reply : reply.data) as T;
}

export async function protectedRequest<T>(
  path: string,
  method = 'GET',
  body?: object,
): Promise<T> {
  try {
    return await apiRequest<T>(path, method, body, getAccessToken());
  } catch (error) {
    if (
      !(error instanceof ApiError) ||
      error.status !== 401 ||
      !getRefreshToken()
    )
      throw error;
    const refreshed = await apiRequest<{
      accessToken: string;
      refreshToken?: string;
    }>(endpoints.refresh, 'POST', { refreshToken: getRefreshToken() });
    saveTokens(refreshed);
    return apiRequest<T>(path, method, body, getAccessToken());
  }
}
