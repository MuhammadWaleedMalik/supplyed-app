import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler } from 'react-native';
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
import { nextAccountScreen } from './nextAccountScreen';

type AppScreen =
  | 'restoring'
  | 'landing'
  | 'login'
  | 'register'
  | 'verification'
  | 'twoFactor'
  | 'forgotPassword'
  | 'onboarding'
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
  const [restoreError, setRestoreError] = useState('');
  const restoreAttempt = useRef(0);

  const defaultBackTarget = getBackTarget(screen, registerBackScreen);
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

  const showDashboard = useCallback(() => {
    if (!getAccessToken()) return;
    setScreen(isAdmin ? 'adminPayments' : 'dashboard');
  }, [isAdmin]);

  function showWorkspaceProfile() {
    setScreen('workspaceProfile');
  }

  function showSecurity() {
    setScreen('security');
  }

  function showSettings() {
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
      openScreen(backTarget);
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
      setRestoreError(problem instanceof Error ? problem.message : 'Unable to load your account. Please try again.');
    }
  }

  function showLanding() {
    restoreAttempt.current += 1;
    clearTokens();
    setVerificationEmail('');
    setOtpToken('');
    setTwoFactorToken('');
    setRestoreError('');
    setIsAdmin(false);
    setScreen('landing');
  }

  function showDocuments(type: AccountType) {
    setProfileType(type);
    setScreen('documents');
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
      if (getSessionVersion() !== version || attempt !== restoreAttempt.current) return;
      setCurrentSessionUser(user);
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
      if (getSessionVersion() === version && attempt === restoreAttempt.current) setScreen(nextScreen);
    } catch (problem) {
      if (getSessionVersion() !== version || attempt !== restoreAttempt.current) return;
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
    return () => { restoreAttempt.current += 1; };
  }, [restoreSession]);

  useEffect(
    () =>
      onSessionExpired(() => {
        restoreAttempt.current += 1;
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
      if (screen === 'landing') {
        return false;
      }

      if (
        screen === 'dashboard' ||
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

      setScreen(backTarget);
      return true;
    }

    const backPress = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackButton,
    );

    return () => backPress.remove();
  }, [screen, backTarget]);

  return {
    screen,
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
    showReviewStatus,
    showDashboard,
    showWorkspaceProfile,
    showSecurity,
    showSettings,
    showLanding,
    goBack,
  };
}
