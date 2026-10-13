import type { User } from '../../feature/auth/apis/authApi';
import * as Keychain from 'react-native-keychain';

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
const sessionListeners = new Set<() => void>();
const credentialService = 'com.supplyed.session';
let storageQueue: Promise<unknown> = Promise.resolve();
let persistSession = true;

export function setSessionPersistence(remember: boolean) {
  persistSession = remember;
}

function persistTokens() {
  const savedAccess = persistSession ? accessToken : '';
  const savedRefresh = refreshToken;
  // Keep writes ordered: logout must remove even a still-pending login write.
  storageQueue = storageQueue
    .catch(() => {})
    .then(async () => {
      if (!savedAccess) {
        await Keychain.resetGenericPassword({ service: credentialService });
        return;
      }
      await Keychain.setGenericPassword(
        'session',
        JSON.stringify({
          accessToken: savedAccess,
          refreshToken: savedRefresh,
        }),
        {
          service: credentialService,
          accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        },
      );
    })
    .catch(() => {
      console.warn(
        'Secure session storage is unavailable. You may need to sign in after restarting.',
      );
    });
}

export async function restoreStoredTokens() {
  if (accessToken) return;
  const version = sessionVersion;
  await storageQueue;
  const saved = await Keychain.getGenericPassword({
    service: credentialService,
  });
  if (!saved || accessToken || version !== sessionVersion) return;
  const tokens = JSON.parse(saved.password) as Tokens;
  if (
    typeof tokens.accessToken !== 'string' ||
    !tokens.accessToken ||
    typeof tokens.refreshToken !== 'string'
  )
    return;
  accessToken = tokens.accessToken;
  refreshToken = tokens.refreshToken;
  sessionVersion += 1;
  sessionListeners.forEach(listener => listener());
}

export function onSessionChanged(listener: () => void) {
  sessionListeners.add(listener);
  return () => {
    sessionListeners.delete(listener);
  };
}

export function getCurrentSessionUser() {
  return currentUser;
}

export function getSessionVersion() {
  return sessionVersion;
}

export function setCurrentSessionUser(user: User) {
  currentUser = user;
  sessionListeners.forEach(listener => listener());
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
  const nextAccess = result.accessToken || result.tokens?.accessToken;
  if (typeof nextAccess !== 'string' || !nextAccess.trim()) {
    throw new Error('The server did not return a valid session. Please sign in again.');
  }
  if (!accessToken) sessionVersion += 1;
  accessToken = nextAccess;
  refreshToken =
    result.refreshToken || result.tokens?.refreshToken || refreshToken;
  persistTokens();
  sessionListeners.forEach(listener => listener());
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
  persistTokens();
  persistSession = true;
  sessionListeners.forEach(listener => listener());
}
