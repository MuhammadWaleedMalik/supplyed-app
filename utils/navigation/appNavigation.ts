import { useEffect, useState } from 'react';
import { BackHandler } from 'react-native';
import { AccountType } from '../onboarding/onboardingData';
import { getCurrentUser, User } from '../../feature/auth/apis/authApi';
import { getAppRole } from '../auth/authUtils';
import { clearTokens, getAccessToken } from '../api/session';
import { nextAccountScreen } from './nextAccountScreen';

type AppScreen =
  | 'landing' | 'login' | 'register' | 'verification' | 'twoFactor'
  | 'forgotPassword' | 'onboarding' | 'documents' | 'dashboard'
  | 'workspaceProfile' | 'security' | 'settings';
type RegisterBackScreen = 'landing' | 'login';

export function useAppNavigation() {
  const [screen, setScreen] = useState<AppScreen>('landing');
  const [registerBackScreen, setRegisterBackScreen] =
    useState<RegisterBackScreen>('landing');
  const [verificationEmail, setVerificationEmail] = useState('');
  const [profileType, setProfileType] = useState<AccountType>('school');
  const [otpToken, setOtpToken] = useState('');
  const [twoFactorToken, setTwoFactorToken] = useState('');
  let backTarget: AppScreen = 'landing';
  if (screen === 'verification' || screen === 'twoFactor' || screen === 'forgotPassword')
    backTarget = 'login';
  if (screen === 'register') backTarget = registerBackScreen;
  if (screen === 'onboarding') backTarget = 'verification';
  if (screen === 'workspaceProfile' || screen === 'security' || screen === 'settings')
    backTarget = 'dashboard';

  function replace(nextScreen: AppScreen) {
    if (nextScreen === 'register')
      setRegisterBackScreen(screen === 'login' ? 'login' : 'landing');
    setScreen(nextScreen);
  }

  function goBack() {
    if (screen !== 'landing') replace(backTarget);
  }

  function showVerification(email: string, token: string) {
    setVerificationEmail(email);
    setOtpToken(token);
    replace('verification');
  }

  function showTwoFactor(email: string, token: string) {
    setVerificationEmail(email);
    setTwoFactorToken(token);
    replace('twoFactor');
  }

  async function showAuthenticated(user: User) {
    setVerificationEmail(user.email);
    const role = getAppRole(user.role);
    if (!role) {
      replace('onboarding');
      return;
    }
    setProfileType(role);
    const next = await nextAccountScreen(role);
    replace(next);
  }

  function showLanding() {
    clearTokens();
    replace('landing');
  }

  function showDocuments(type: AccountType) {
    setProfileType(type);
    replace('documents');
  }

  useEffect(() => {
    async function restoreSession() {
      if (!getAccessToken()) return;
      try {
        const user = await getCurrentUser();
        setVerificationEmail(user.email);
        const role = getAppRole(user.role);
        if (!role) {
          setScreen('onboarding');
          return;
        }
        setProfileType(role);
        const next = await nextAccountScreen(role);
        setScreen(next);
      } catch {
        clearTokens();
      }
    }
    restoreSession();
  }, []);

  useEffect(() => {
    const backPress = BackHandler.addEventListener('hardwareBackPress', () => {
      if (screen === 'landing') return false;
      setScreen(backTarget);
      return true;
    });
    return () => backPress.remove();
  }, [screen, backTarget]);

  return {
    screen, verificationEmail, profileType, otpToken, twoFactorToken,
    showLogin: () => replace('login'),
    showRegister: () => replace('register'),
    showVerification, showTwoFactor,
    showForgotPassword: () => replace('forgotPassword'),
    showAuthenticated,
    showOnboarding: () => replace('onboarding'),
    showDocuments,
    showDashboard: () => replace('dashboard'),
    showWorkspaceProfile: () => replace('workspaceProfile'),
    showSecurity: () => replace('security'),
    showSettings: () => replace('settings'),
    showLanding, goBack,
  };
}

