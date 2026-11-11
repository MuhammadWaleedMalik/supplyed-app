import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, BackHandler } from 'react-native';
import { getCurrentUser, User } from '../../feature/auth/apis/authApi';
import {
  clearTokens,
  getAccessToken,
  getSessionVersion,
  onSessionExpired,
  restoreStoredTokens,
  setCurrentSessionUser,
} from '../api/session';
import { getAppRole } from '../auth/authUtils';
import { AccountType } from '../onboarding/onboardingData';
import { needsIdentityStep, nextAccountScreen } from './nextAccountScreen';

type AppScreen =
  | 'restoring'
  | 'landing'
  | 'login'
  | 'register'
  | 'verification'
  | 'twoFactor'
  | 'forgotPassword'
  | 'onboarding'
  | 'identityVerification'
  | 'documents'
  | 'reviewStatus'
  | 'dashboard'
  | 'adminPayments'
  | 'workspaceProfile'
  | 'security'
  | 'settings';

type RegisterBackScreen = 'landing' | 'login';

const publicScreens: AppScreen[] = [
  'landing',
  'login',
  'register',
  'verification',
  'twoFactor',
  'forgotPassword',
];

function getBackTarget(
  screen: AppScreen,
  registerBackScreen: RegisterBackScreen,
): AppScreen {
  if (
    screen === 'verification' ||
    screen === 'twoFactor' ||
    screen === 'forgotPassword'
  ) {
    return 'login';
  }

  if (screen === 'register') {
    return registerBackScreen;
  }

  if (screen === 'onboarding') {
    return 'landing';
  }

  if (screen === 'identityVerification') return 'identityVerification';

  if (
    screen === 'workspaceProfile' ||
    screen === 'security' ||
    screen === 'settings'
  ) {
    return 'dashboard';
  }

  if (
    screen === 'dashboard' ||
    screen === 'adminPayments' ||
    screen === 'reviewStatus' ||
    screen === 'restoring'
  ) {
    return screen;
  }

  return 'landing';
}

export function useAppNavigation() {
  const firstScreen: AppScreen = 'restoring';

  const [screen, setScreen] = useState<AppScreen>(firstScreen);
  const [registerBackScreen, setRegisterBackScreen] =
    useState<RegisterBackScreen>('landing');
  const [verificationEmail, setVerificationEmail] = useState('');
  const [profileType, setProfileType] = useState<AccountType>('school');
  const [otpToken, setOtpToken] = useState('');
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [accountReturnScreen, setAccountReturnScreen] =
    useState<AppScreen>('dashboard');
  const [identityReturnScreen, setIdentityReturnScreen] =
    useState<AppScreen>('dashboard');
  const [restoreError, setRestoreError] = useState('');
  const restoreAttempt = useRef(0);
  const accessAttempt = useRef(0);
  const [checkingAccess, setCheckingAccess] = useState(false);
  const [accessError, setAccessError] = useState('');

  const defaultBackTarget = ['workspaceProfile', 'settings', 'security'].includes(screen)
    ? accountReturnScreen
    : getBackTarget(screen, registerBackScreen);
  const backTarget =
    isAdmin && defaultBackTarget === 'dashboard'
      ? 'adminPayments'
      : defaultBackTarget;

  function openScreen(nextScreen: AppScreen) {
    const signedIn = Boolean(getAccessToken());
    const isPublicScreen = publicScreens.includes(nextScreen);

    if (signedIn && isPublicScreen) {
      return;
    }

    if (nextScreen === 'register') {
      const previousScreen = screen === 'login' ? 'login' : 'landing';
      setRegisterBackScreen(previousScreen);
    }

    setScreen(nextScreen);
  }

  function showLogin() {
    openScreen('login');
  }

  function showRegister() {
    openScreen('register');
  }

  function showForgotPassword() {
    openScreen('forgotPassword');
  }

  function showReviewStatus() {
    setScreen('reviewStatus');
  }

  const showDashboard = useCallback(async () => {
    if (!getAccessToken()) return;
    if (isAdmin) {
      setScreen('adminPayments');
      return;
    }
    const attempt = ++accessAttempt.current;
    const version = getSessionVersion();
    setCheckingAccess(true);
    setAccessError('');
    try {
      const destination = await nextAccountScreen(profileType);
      if (version !== getSessionVersion() || attempt !== accessAttempt.current) return;
      setScreen(destination);
      setCheckingAccess(false);
    } catch (problem) {
      if (version !== getSessionVersion() || attempt !== accessAttempt.current) return;
      setAccessError(problem instanceof Error ? problem.message : 'Unable to check account access. Please retry.');
    }
  }, [isAdmin, profileType]);

  useEffect(() => {
    let previous = AppState.currentState;
    const listener = AppState.addEventListener('change', state => {
      if (state === 'active' && previous !== 'active' && screen === 'dashboard')
        showDashboard();
      previous = state;
    });
    return () => listener.remove();
  }, [screen, showDashboard]);

  function showWorkspaceProfile() {
    setAccountReturnScreen(
      screen === 'reviewStatus' ? 'reviewStatus' : 'dashboard',
    );
    setScreen('workspaceProfile');
  }

  function showSecurity() {
    setAccountReturnScreen(screen === 'reviewStatus' ? 'reviewStatus' : 'dashboard');
    setScreen('security');
  }

  function showSettings() {
    setAccountReturnScreen(
      screen === 'reviewStatus' ? 'reviewStatus' : 'dashboard',
    );
    setScreen('settings');
  }

  function goBack() {
    const cannotGoBack =
      screen === 'landing' ||
      screen === 'reviewStatus' ||
      screen === 'dashboard' ||
      screen === 'adminPayments' ||
      screen === 'restoring';

    if (!cannotGoBack) {
      if (backTarget === 'dashboard') showDashboard();
      else openScreen(backTarget);
    }
  }

  function showVerification(email: string, token: string) {
    setVerificationEmail(email);
    setOtpToken(token);
    openScreen('verification');
  }

  function showTwoFactor(email: string, token: string) {
    setVerificationEmail(email);
    setTwoFactorToken(token);
    openScreen('twoFactor');
  }

  async function showAuthenticated(user: User) {
    if (!getAccessToken()) return;
    const version = getSessionVersion();
    setOtpToken('');
    setTwoFactorToken('');
    setRestoreError('');
    setVerificationEmail(user.email);
    setCurrentSessionUser(user);
    setIdentityReturnScreen('dashboard');
    setIsAdmin(user.role === 'ADMIN');
    if (user.role === 'ADMIN') {
      setScreen('adminPayments');
      return;
    }

    const role = getAppRole(user.role);
    if (!role) {
      clearTokens();
      setScreen('landing');
      return;
    }

    setProfileType(role);
    setScreen('restoring');
    try {
      const nextScreen = await nextAccountScreen(role);
      if (getSessionVersion() === version) setScreen(nextScreen);
    } catch (problem) {
      if (getSessionVersion() !== version) return;
      setRestoreError(
        problem instanceof Error
          ? problem.message
          : 'Unable to load your account. Please try again.',
      );
    }
  }

  function showLanding() {
    restoreAttempt.current += 1;
    accessAttempt.current += 1;
    setCheckingAccess(false);
    setAccessError('');
    clearTokens();
    setVerificationEmail('');
    setOtpToken('');
    setTwoFactorToken('');
    setRestoreError('');
    setIsAdmin(false);
    setIdentityReturnScreen('dashboard');
    setScreen('landing');
  }

  function showDocuments(type: AccountType) {
    setProfileType(type);
    setScreen('documents');
  }

  async function showProfileDocuments(type: AccountType) {
    const version = getSessionVersion();
    const attempt = ++accessAttempt.current;
    setProfileType(type);
    setIdentityReturnScreen('documents');
    setCheckingAccess(true);
    const needsIdentity = type === 'teacher' && (await needsIdentityStep());
    if (version !== getSessionVersion() || attempt !== accessAttempt.current) return;
    setScreen(needsIdentity ? 'identityVerification' : 'documents');
    setCheckingAccess(false);
  }

  function showIdentityVerification() {
    if (profileType === 'teacher') {
      setIdentityReturnScreen(screen);
      setScreen('identityVerification');
    }
  }

  function continueAfterIdentity() {
    if (identityReturnScreen === 'dashboard') showDashboard();
    else if (
      ['workspaceProfile', 'settings', 'reviewStatus'].includes(identityReturnScreen)
    )
      setScreen(identityReturnScreen);
    else showDocuments(profileType);
  }

  const restoreSession = useCallback(async () => {
    const attempt = ++restoreAttempt.current;
    setRestoreError('');
    try {
      await restoreStoredTokens();
    } catch {
      if (attempt !== restoreAttempt.current) return;
      setRestoreError(
        'Unable to read your saved session. Retry or sign in again.',
      );
      setScreen('restoring');
      return;
    }
    if (attempt !== restoreAttempt.current) return;
    const version = getSessionVersion();
    setRestoreError('');
    if (!getAccessToken()) {
      setScreen('landing');
      return;
    }

    try {
      const user = await getCurrentUser();
      if (getSessionVersion() !== version || attempt !== restoreAttempt.current)
        return;
      setCurrentSessionUser(user);
      setIdentityReturnScreen('dashboard');
      setVerificationEmail(user.email);
      setIsAdmin(user.role === 'ADMIN');
      if (user.role === 'ADMIN') {
        setScreen('adminPayments');
        return;
      }

      const role = getAppRole(user.role);
      if (!role) {
        clearTokens();
        setScreen('landing');
        return;
      }

      setProfileType(role);
      const nextScreen = await nextAccountScreen(role);
      if (getSessionVersion() === version && attempt === restoreAttempt.current)
        setScreen(nextScreen);
    } catch (problem) {
      if (getSessionVersion() !== version || attempt !== restoreAttempt.current)
        return;
      setRestoreError(
        problem instanceof Error
          ? problem.message
          : 'Unable to load your account. Please try again.',
      );
      setScreen('restoring');
    }
  }, []);

  useEffect(() => {
    restoreSession();
    return () => {
      restoreAttempt.current += 1;
    };
  }, [restoreSession]);

  useEffect(
    () =>
      onSessionExpired(() => {
        restoreAttempt.current += 1;
        accessAttempt.current += 1;
        setCheckingAccess(false);
        setAccessError('');
        setVerificationEmail('');
        setOtpToken('');
        setTwoFactorToken('');
        setRestoreError('');
        setIsAdmin(false);
        setScreen('login');
      }),
    [],
  );

  useEffect(() => {
    function handleBackButton() {
      if (screen === 'landing' || screen === 'dashboard') {
        return false;
      }

      if (
        screen === 'adminPayments' ||
        screen === 'reviewStatus' ||
        screen === 'restoring'
      ) {
        return true;
      }

      const signedIn = Boolean(getAccessToken());
      const targetIsPublic = publicScreens.includes(backTarget);
      if (signedIn && targetIsPublic) {
        return true;
      }

      if (checkingAccess) return true;
      if (backTarget === 'dashboard') showDashboard();
      else setScreen(backTarget);
      return true;
    }

    const backPress = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackButton,
    );

    return () => backPress.remove();
  }, [screen, backTarget, checkingAccess, showDashboard]);

  return {
    screen,
    checkingAccess,
    accessError,
    restoreError,
    restoreSession,
    verificationEmail,
    profileType,
    otpToken,
    twoFactorToken,
    showLogin,
    showRegister,
    showVerification,
    showTwoFactor,
    showForgotPassword,
    showAuthenticated,
    showDocuments,
    showProfileDocuments,
    showIdentityVerification,
    continueAfterIdentity,
    showReviewStatus,
    showDashboard,
    showWorkspaceProfile,
    showSecurity,
    showSettings,
    showLanding,
    goBack,
  };
}
