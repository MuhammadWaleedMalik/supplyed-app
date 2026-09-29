import { useEffect, useState } from 'react';
import { BackHandler } from 'react-native';
import { getCurrentUser, User } from '../../feature/auth/apis/authApi';
import { clearTokens, getAccessToken } from '../api/session';
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

  if (screen === 'dashboard' || screen === 'reviewStatus' || screen === 'restoring') {
    return screen;
  }

  return 'landing';
}

export function useAppNavigation() {
  const firstScreen: AppScreen = getAccessToken() ? 'restoring' : 'landing';

  const [screen, setScreen] = useState<AppScreen>(firstScreen);
  const [registerBackScreen, setRegisterBackScreen] =
    useState<RegisterBackScreen>('landing');
  const [verificationEmail, setVerificationEmail] = useState('');
  const [profileType, setProfileType] = useState<AccountType>('school');
  const [otpToken, setOtpToken] = useState('');
  const [twoFactorToken, setTwoFactorToken] = useState('');

  const backTarget = getBackTarget(screen, registerBackScreen);

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

  function showDashboard() {
    setScreen('dashboard');
  }

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
    setVerificationEmail(user.email);

    const role = getAppRole(user.role);
    if (!role) {
      clearTokens();
      setScreen('landing');
      return;
    }

    setProfileType(role);
    setScreen(await nextAccountScreen(role));
  }

  function showLanding() {
    clearTokens();
    setScreen('landing');
  }

  function showDocuments(type: AccountType) {
    setProfileType(type);
    setScreen('documents');
  }

  useEffect(() => {
    async function restoreSession() {
      if (!getAccessToken()) {
        setScreen('landing');
        return;
      }

      try {
        const user = await getCurrentUser();
        setVerificationEmail(user.email);

        const role = getAppRole(user.role);
        if (!role) {
          clearTokens();
          setScreen('landing');
          return;
        }

        setProfileType(role);
        setScreen(await nextAccountScreen(role));
      } catch {
        clearTokens();
        setScreen('landing');
      }
    }

    restoreSession();
  }, []);

  useEffect(() => {
    function handleBackButton() {
      if (screen === 'landing') {
        return false;
      }

      if (screen === 'dashboard' || screen === 'reviewStatus' || screen === 'restoring') {
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
