import React from 'react';
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
import HirerDashboardScreen from './feature/dashboard/screen/HirerDashboardScreen';
import TeacherDashboardScreen from './feature/dashboard/screen/TeacherDashboardScreen';
import ProfileScreen from './feature/dashboard/screen/ProfileScreen';
import SecurityScreen from './feature/dashboard/screen/SecurityScreen';
import SettingsScreen from './feature/dashboard/screen/SettingsScreen';
import { useAppNavigation } from './utils/navigation/appNavigation';

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
    <SafeAreaProvider>
      <StatusBar barStyle={['onboarding', 'documents', 'dashboard',
        'workspaceProfile', 'security', 'settings', 'twoFactor',
        'forgotPassword'].includes(screen) ? 'dark-content' : 'light-content'} />
      {screen === 'landing' && <LandingPage onLogin={showLogin} onRegister={showRegister} />}
      {screen === 'login' && <LoginScreen onBack={goBack} onRegister={showRegister} actions={authActions} />}
      {screen === 'register' && <RegisterScreen onBack={goBack} onLogin={showLogin} actions={authActions} />}
      {screen === 'verification' && <VerificationScreen email={verificationEmail} token={otpToken} actions={authActions} onBack={goBack} />}
      {screen === 'twoFactor' && <TwoFactorScreen token={twoFactorToken} onBack={goBack} onAuthenticated={showAuthenticated} />}
      {screen === 'forgotPassword' && <ForgotPasswordScreen onBack={goBack} />}
      {screen === 'onboarding' && <OnboardingScreen email={verificationEmail} onExit={goBack} onProfileCreated={showDocuments} />}
      {screen === 'documents' && <DocumentsScreen type={profileType} onSubmit={showDashboard} onExit={showLanding} />}
      {screen === 'dashboard' && profileType !== 'teacher' && (
        <HirerDashboardScreen email={verificationEmail} onExit={showLanding}
          onProfile={showWorkspaceProfile} onSecurity={showSecurity} onSettings={showSettings} />
      )}
      {screen === 'dashboard' && profileType === 'teacher' && (
        <TeacherDashboardScreen email={verificationEmail} onExit={showLanding}
          onProfile={showWorkspaceProfile} onSecurity={showSecurity} onSettings={showSettings} />
      )}
      {screen === 'workspaceProfile' && <ProfileScreen type={profileType} onBack={goBack} />}
      {screen === 'security' && <SecurityScreen onBack={goBack} />}
      {screen === 'settings' && <SettingsScreen type={profileType} onBack={goBack} />}
    </SafeAreaProvider>
  );
}
