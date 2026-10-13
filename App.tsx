import React, { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { Linking, StatusBar } from 'react-native';
import {
  handleURLCallback,
  resetPaymentSheetCustomer,
} from '@stripe/stripe-react-native';
import { getSessionVersion, onSessionChanged } from './utils/api/session';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LandingPage from './feature/landing/screen/LandingPage';
import LoginScreen from './feature/auth/screen/LoginScreen';
import RegisterScreen from './feature/auth/screen/RegisterScreen';
import VerificationScreen from './feature/auth/screen/VerificationScreen';
import TwoFactorScreen from './feature/auth/screen/TwoFactorScreen';
import ForgotPasswordScreen from './feature/auth/screen/ForgotPasswordScreen';
import SessionScreen from './feature/auth/screen/SessionScreen';
import OnboardingScreen from './feature/onboarding/screen/OnboardingScreen';
import DocumentsScreen from './feature/documents/screen/DocumentsScreen';
import ReviewStatusScreen from './feature/reviewStatus/screen/ReviewStatusScreen';
import SchoolDashboard from './feature/dashboard/school/screens/SchoolDashboard';
import TeacherDashboard from './feature/dashboard/teacher/screens/TeacherDashboard';
import AdminPaymentsScreen from './feature/dashboard/admin/screens/AdminPaymentsScreen';
import ProfileScreen from './feature/dashboard/shared/screens/ProfileScreen';
import SecurityScreen from './feature/dashboard/shared/screens/SecurityScreen';
import SettingsScreen from './feature/dashboard/shared/screens/SettingsScreen';
import { useAppNavigation } from './utils/navigation/appNavigation';
import { store } from './store';
import SplashScreen from './components/SplashScreen';
import PublicThemeControls from './components/Ui/PublicThemeControls';
import { useConversationSocket } from './feature/dashboard/shared/hooks/useConversationSocket';

const SPLASH_DURATION_MS = 2500;

export default function App() {
  useConversationSocket();
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const {
    screen,
    restoreError,
    restoreSession,
    verificationEmail,
    otpToken,
    twoFactorToken,
    profileType,
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
  } = useAppNavigation();

  useEffect(() => {
    function handleLink(url: string | null | undefined) {
      if (url?.startsWith('supplyed://stripe-redirect'))
        handleURLCallback(url).catch(() => {
          console.warn(
            'Unable to process the payment redirect. Refresh the invoice to check payment status.',
          );
        });
    }
    Linking.getInitialURL()
      .then(handleLink)
      .catch(() => {
        console.warn('Unable to read the app launch link.');
      });
    const links = Linking.addEventListener('url', event =>
      handleLink(event.url),
    );
    let version = getSessionVersion();
    const unsubscribe = onSessionChanged(() => {
      if (getSessionVersion() !== version) {
        version = getSessionVersion();
        resetPaymentSheetCustomer().catch(() => {
          console.warn('Unable to clear the payment sheet customer cache.');
        });
      }
    });
    return () => {
      links.remove();
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSplashVisible(false);
    }, SPLASH_DURATION_MS);

    return () => clearTimeout(timer);
  }, []);

  const authActions = {
    onVerification: showVerification,
    onAuthenticated: showAuthenticated,
    onTwoFactor: showTwoFactor,
    onForgotPassword: showForgotPassword,
  };

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        {isSplashVisible ? (
          <SplashScreen />
        ) : (
          <>
            <StatusBar
              hidden={false}
              barStyle={
                [
                  'landing',
                  'onboarding',
                  'restoring',
                  'documents',
                  'reviewStatus',
                  'dashboard',
                  'adminPayments',
                  'workspaceProfile',
                  'security',
                  'settings',
                  'twoFactor',
                  'forgotPassword',
                ].includes(screen)
                  ? 'dark-content'
                  : 'light-content'
              }
            />
            {screen === 'landing' && (
              <LandingPage onLogin={showLogin} onRegister={showRegister} />
            )}
            {screen === 'restoring' && (
              <SessionScreen
                error={restoreError}
                onRetry={restoreSession}
                onExit={showLanding}
              />
            )}
            {screen === 'login' && (
              <LoginScreen
                onBack={goBack}
                onRegister={showRegister}
                actions={authActions}
              />
            )}
            {screen === 'register' && (
              <RegisterScreen
                onBack={goBack}
                onLogin={showLogin}
                actions={authActions}
              />
            )}
            {screen === 'verification' && (
              <VerificationScreen
                email={verificationEmail}
                token={otpToken}
                actions={authActions}
                onBack={goBack}
              />
            )}
            {screen === 'twoFactor' && (
              <TwoFactorScreen
                token={twoFactorToken}
                onBack={goBack}
                onAuthenticated={showAuthenticated}
              />
            )}
            {screen === 'forgotPassword' && (
              <ForgotPasswordScreen onBack={goBack} />
            )}
            {screen === 'onboarding' && (
              <OnboardingScreen
                email={verificationEmail}
                type={profileType}
                onExit={showLanding}
                onProfileCreated={showDocuments}
              />
            )}
            {screen === 'documents' && (
              <DocumentsScreen
                type={profileType}
                onReviewStatus={showReviewStatus}
                onExit={showLanding}
              />
            )}
            {screen === 'reviewStatus' && (
              <ReviewStatusScreen
                email={verificationEmail}
                type={profileType}
                onDashboard={showDashboard}
                onDocuments={() => showDocuments(profileType)}
                onExit={showLanding}
              />
            )}
            {screen === 'dashboard' && profileType === 'school' && (
              <SchoolDashboard
                email={verificationEmail}
                onExit={showLanding}
                onProfile={showWorkspaceProfile}
                onSecurity={showSecurity}
                onSettings={showSettings}
              />
            )}
            {screen === 'dashboard' && profileType === 'teacher' && (
              <TeacherDashboard
                email={verificationEmail}
                onExit={showLanding}
                onProfile={showWorkspaceProfile}
                onSecurity={showSecurity}
                onSettings={showSettings}
              />
            )}
            {screen === 'adminPayments' && (
              <AdminPaymentsScreen
                email={verificationEmail}
                onSecurity={showSecurity}
                onLogout={showLanding}
              />
            )}
            {screen === 'workspaceProfile' && (
              <ProfileScreen type={profileType} onBack={goBack} />
            )}
            {screen === 'security' && <SecurityScreen onBack={goBack} />}
            {screen === 'settings' && (
              <SettingsScreen type={profileType} onBack={goBack} />
            )}
            {[
              'landing',
              'login',
              'register',
              'verification',
              'twoFactor',
              'forgotPassword',
              'onboarding',
              'documents',
              'reviewStatus',
            ].includes(screen) && <PublicThemeControls />}
          </>
        )}
      </SafeAreaProvider>
    </Provider>
  );
}
