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

export function getAppRole(role?: string): AccountType | null {
  if (role === 'INSTRUCTOR' || role === 'TEACHER') return 'teacher';
  if (role === 'INSTITUTION' || role === 'SCHOOL') return 'school';
  if (role === 'RECRUITER' || role === 'INDIVIDUAL') return 'individual';
  return null;
}

