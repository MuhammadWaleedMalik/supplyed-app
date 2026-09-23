import { AccountType } from './onboardingData';

export function getIntroCopy(type: AccountType | null, step: number) {
  let heading = 'Choose your SupplyED path.';
  let description =
    'Choose how you want to use SupplyED and add your contact details.';
  if (type === 'school' && step > 1) {
    heading = 'Create your school staffing workspace.';
    description =
      'Set up a workspace for posting cover, reviewing matches, and keeping compliance visible.';
  }
  if (type === 'teacher') {
    heading = 'Build your trusted teacher profile.';
    description =
      'Add teaching details for matching, bookings, and compliance checks.';
  }
  if (type === 'individual') {
    heading = 'Find trusted support for a learner.';
    description =
      'Create a safe hiring profile and keep conversations in one place.';
  }
  return { heading, description };
}

export function getPathName(type: AccountType | null) {
  if (type === 'school') return 'School / MAT';
  if (type === 'teacher') return 'Supply teacher';
  if (type === 'individual') return 'Individual hirer';
  return 'Role selection';
}

export function getReviewTitle(type: AccountType) {
  if (type === 'individual') return 'Individual profile';
  if (type === 'teacher') return 'Teacher profile';
  return 'Account';
}

export function getProgressPercent(step: number, total: number) {
  return Math.round((step / total) * 100);
}
