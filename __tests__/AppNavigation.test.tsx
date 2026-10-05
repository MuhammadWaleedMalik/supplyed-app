import React from 'react';
import { BackHandler } from 'react-native';
import renderer, { act } from 'react-test-renderer';
import { getCurrentUser, User } from '../feature/auth/apis/authApi';
import { clearTokens, expireSession, getAccessToken, getCurrentSessionUser, saveTokens } from '../utils/api/session';
import { useAppNavigation } from '../utils/navigation/appNavigation';
import { nextAccountScreen } from '../utils/navigation/nextAccountScreen';

jest.mock('../feature/auth/apis/authApi', () => ({ getCurrentUser: jest.fn() }));
jest.mock('../utils/navigation/nextAccountScreen', () => ({ nextAccountScreen: jest.fn() }));

let navigation: ReturnType<typeof useAppNavigation>;
let screen: renderer.ReactTestRenderer;
let hardwareBack: (event: { type: string; timeStamp: number }) => boolean | null | undefined;

function NavigationHarness() {
  navigation = useAppNavigation();
  return null;
}

function user(role: string): User {
  return { id: 'user-1', email: 'person@example.com', role, phoneVerified: false };
}

async function mountNavigation() {
  await act(async () => { screen = renderer.create(<NavigationHarness />); });
}

async function signIn(role: string) {
  await act(async () => {
    saveTokens({ accessToken: 'access-token', refreshToken: 'refresh-token' });
    await navigation.showAuthenticated(user(role));
  });
}

beforeEach(() => {
  clearTokens();
  jest.mocked(getCurrentUser).mockReset();
  jest.mocked(nextAccountScreen).mockReset().mockResolvedValue('dashboard');
  jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_event, listener) => {
    hardwareBack = listener;
    return { remove: jest.fn() };
  });
});

afterEach(async () => {
  if (screen) await act(async () => screen.unmount());
  clearTokens();
  jest.restoreAllMocks();
});

it('takes admin login directly to payments without a teacher or school profile lookup', async () => {
  await mountNavigation();
  await signIn('ADMIN');
  expect(navigation.screen).toBe('adminPayments');
  expect(nextAccountScreen).not.toHaveBeenCalled();
  expect(getCurrentSessionUser()?.role).toBe('ADMIN');
});

it('restores an admin session directly to payments', async () => {
  saveTokens({ accessToken: 'existing-token' });
  jest.mocked(getCurrentUser).mockResolvedValue(user('ADMIN'));
  await mountNavigation();
  expect(getCurrentUser).toHaveBeenCalledTimes(1);
  expect(navigation.screen).toBe('adminPayments');
  expect(nextAccountScreen).not.toHaveBeenCalled();
});

it('returns admin Security to payments for both screen and Android back buttons', async () => {
  await mountNavigation();
  await signIn('ADMIN');
  await act(async () => navigation.showSecurity());
  expect(navigation.screen).toBe('security');
  await act(async () => navigation.goBack());
  expect(navigation.screen).toBe('adminPayments');
  await act(async () => navigation.showSecurity());
  await act(async () => { expect(hardwareBack({ type: 'hardwareBackPress', timeStamp: 0 })).toBe(true); });
  expect(navigation.screen).toBe('adminPayments');
});

it('takes an expired session to login and clears its tokens', async () => {
  await mountNavigation();
  await signIn('ADMIN');
  await act(async () => expireSession());
  expect(navigation.screen).toBe('login');
  expect(getAccessToken()).toBe('');
  expect(getCurrentSessionUser()).toBeUndefined();
});

it.each([
  ['INSTRUCTOR', 'teacher'],
  ['INSTITUTION', 'school'],
])('keeps %s profile routing and Settings back navigation', async (role, type) => {
  await mountNavigation();
  await signIn(role);
  expect(navigation.profileType).toBe(type);
  expect(nextAccountScreen).toHaveBeenCalledWith(type);
  expect(navigation.screen).toBe('dashboard');
  await act(async () => navigation.showSettings());
  expect(navigation.screen).toBe('settings');
  await act(async () => navigation.goBack());
  expect(navigation.screen).toBe('dashboard');
});

it.each(['onboarding', 'documents', 'reviewStatus'] as const)('preserves the teacher %s destination returned by profile readiness', async destination => {
  await mountNavigation();
  jest.mocked(nextAccountScreen).mockResolvedValueOnce(destination);
  await signIn('INSTRUCTOR');
  expect(navigation.screen).toBe(destination);
});

it('returns logout to the landing screen and permits login again', async () => {
  await mountNavigation();
  await signIn('INSTITUTION');
  await act(async () => navigation.showLanding());
  expect(navigation.screen).toBe('landing');
  expect(getAccessToken()).toBe('');
  await act(async () => navigation.showLogin());
  expect(navigation.screen).toBe('login');
});

it('keeps tokens after a network restore failure and retries account loading', async () => {
  saveTokens({ accessToken: 'existing-token', refreshToken: 'refresh-token' });
  jest.mocked(getCurrentUser).mockRejectedValueOnce(new Error('Cannot reach SupplyED.'));
  await mountNavigation();
  expect(navigation.screen).toBe('restoring');
  expect(navigation.restoreError).toBe('Cannot reach SupplyED.');
  expect(getAccessToken()).toBe('existing-token');
  jest.mocked(getCurrentUser).mockResolvedValueOnce(user('ADMIN'));
  await act(async () => navigation.restoreSession());
  expect(navigation.screen).toBe('adminPayments');
  expect(navigation.restoreError).toBe('');
  expect(getAccessToken()).toBe('existing-token');
});

it('does not let a delayed admin restore reopen the workspace after logout', async () => {
  saveTokens({ accessToken: 'existing-token' });
  let finishUserRequest: (value: User) => void = () => {};
  jest.mocked(getCurrentUser).mockImplementationOnce(() => new Promise(resolve => {
    finishUserRequest = resolve;
  }));
  await mountNavigation();
  expect(navigation.screen).toBe('restoring');
  await act(async () => navigation.showLanding());
  await act(async () => finishUserRequest(user('ADMIN')));
  expect(navigation.screen).toBe('landing');
  expect(getAccessToken()).toBe('');
});

it('does not let a delayed profile readiness lookup override logout', async () => {
  saveTokens({ accessToken: 'existing-token' });
  jest.mocked(getCurrentUser).mockResolvedValueOnce(user('INSTRUCTOR'));
  let finishProfileLookup: (value: 'dashboard') => void = () => {};
  jest.mocked(nextAccountScreen).mockImplementationOnce(() => new Promise<'dashboard'>(resolve => {
    finishProfileLookup = resolve;
  }));
  await mountNavigation();
  expect(nextAccountScreen).toHaveBeenCalledWith('teacher');
  await act(async () => navigation.showLanding());
  await act(async () => finishProfileLookup('dashboard'));
  expect(navigation.screen).toBe('landing');
  expect(getAccessToken()).toBe('');
});
