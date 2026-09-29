import { AccountType } from './onboardingData';

export function getIntroCopy(type: AccountType, step: number) {
  if (type === 'school') {
    if (step === 1) {
      return {
        heading: 'Create your school staffing workspace.',
        description:
          'Start with the person who manages this school or trust account.',
      };
    }
    return {
      heading: 'Create your school staffing workspace.',
      description:
        'Set up a workspace for posting cover, reviewing matches, and keeping compliance visible.',
    };
  }

  return {
    heading: 'Build your trusted teacher profile.',
    description:
      'Add teaching details for matching, bookings, and compliance checks.',
  };
}

export function getPathName(type: AccountType) {
  if (type === 'school') return 'School / MAT';
  return 'Supply teacher';
}

export function getReviewTitle(type: AccountType) {
  if (type === 'teacher') return 'Teacher profile';
  return 'Account';
}

export function getProgressPercent(step: number, total: number) {
  return Math.round((step / total) * 100);
}
