import { AccountType } from '../onboarding/onboardingData';

export const loginBenefits = [
  'DBS-verified teacher network',
  'AI-powered job matching',
  'Same-day placement capability',
];

type AuthAction = 'register' | 'reset' | 'social' | 'verify';

export function showAuthMessage(_action: AuthAction) {
  return undefined;
}

export function backendRole(type: AccountType) {
  return type === 'teacher' ? 'INSTRUCTOR' : 'INSTITUTION';
}

export function getAppRole(role?: string): AccountType | null {
  if (role === 'INSTRUCTOR') return 'teacher';
  if (role === 'INSTITUTION') return 'school';
  return null;
}
