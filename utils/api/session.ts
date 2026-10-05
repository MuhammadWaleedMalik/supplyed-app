import type { User } from '../../feature/auth/apis/authApi';

type Tokens = {
  accessToken?: string;
  refreshToken?: string;
  tokens?: { accessToken?: string; refreshToken?: string };
};

let accessToken = '';
let refreshToken = '';
let currentUser: User | undefined;
let sessionVersion = 0;
const expiryListeners = new Set<() => void>();

export function getCurrentSessionUser() {
  return currentUser;
}

export function getSessionVersion() {
  return sessionVersion;
}

export function setCurrentSessionUser(user: User) {
  currentUser = user;
}

export function onSessionExpired(listener: () => void) {
  expiryListeners.add(listener);
  return () => {
    expiryListeners.delete(listener);
  };
}

export function expireSession() {
  clearTokens();
  expiryListeners.forEach(listener => listener());
}

export function saveTokens(result: Tokens) {
  if (!accessToken) sessionVersion += 1;
  accessToken = result.accessToken || result.tokens?.accessToken || '';
  refreshToken =
    result.refreshToken || result.tokens?.refreshToken || refreshToken;
}

export function getAccessToken() {
  return accessToken;
}

export function getRefreshToken() {
  return refreshToken;
}

export function clearTokens() {
  sessionVersion += 1;
  accessToken = '';
  refreshToken = '';
  currentUser = undefined;
}
