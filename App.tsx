import React from 'react';
import { Provider } from 'react-redux';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LandingPage from './feature/landing/screen/LandingPage';
import LoginScreen from './feature/auth/screen/LoginScreen';
import RegisterScreen from './feature/auth/screen/RegisterScreen';
import VerificationScreen from './feature/auth/screen/VerificationScreen';
import TwoFactorScreen from './feature/auth/screen/TwoFactorScreen';
import ForgotPasswordScreen from './feature/auth/screen/ForgotPasswordScreen';
import OnboardingScreen from './feature/onboarding/screen/OnboardingScreen';
import DocumentsScreen from './feature/documents/screen/DocumentsScreen';
import ReviewStatusScreen from './feature/reviewStatus/screen/ReviewStatusScreen';
import SchoolDashboard from './feature/dashboard/school/screens/SchoolDashboard';
import TeacherDashboard from './feature/dashboard/teacher/screens/TeacherDashboard';
import ProfileScreen from './feature/dashboard/shared/screens/ProfileScreen';
import SecurityScreen from './feature/dashboard/shared/screens/SecurityScreen';
import SettingsScreen from './feature/dashboard/shared/screens/SettingsScreen';
import { useAppNavigation } from './utils/navigation/appNavigation';
import { store } from './store';

export default function App() {
  const {
    screen,
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

  const authActions = {
    onVerification: showVerification,
    onAuthenticated: showAuthenticated,
    onTwoFactor: showTwoFactor,
    onForgotPassword: showForgotPassword,
  };

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar
          barStyle={
            [
              'onboarding',
              'documents',
              'reviewStatus',
              'dashboard',
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
        {screen === 'workspaceProfile' && (
          <ProfileScreen type={profileType} onBack={goBack} />
        )}
        {screen === 'security' && <SecurityScreen onBack={goBack} />}
        {screen === 'settings' && (
          <SettingsScreen type={profileType} onBack={goBack} />
        )}
      </SafeAreaProvider>
    </Provider>
  );
}
