import { AccountType } from '../onboarding/onboardingData';
import { Alert } from 'react-native';

export const loginBenefits = [
  'DBS-verified teacher network',
  'AI-powered job matching',
  'Same-day placement capability',
];

type AuthAction = 'register' | 'reset' | 'social' | 'verify';

export function showAuthMessage(_action: AuthAction) {
  Alert.alert('Sign-in option unavailable', 'Please use your email and password to continue.');
}

export function backendRole(type: AccountType) {
  return type === 'teacher' ? 'INSTRUCTOR' : 'INSTITUTION';
}

export function getAppRole(role?: string): AccountType | null {
  if (role === 'INSTRUCTOR') return 'teacher';
  if (role === 'INSTITUTION') return 'school';
  return null;
}
