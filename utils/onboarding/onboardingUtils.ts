import { AccountType, OnboardingData } from './onboardingData';

export function canContinue(
  type: AccountType | null,
  step: number,
  data: OnboardingData,
) {
  if (!type || !data.fullName.trim()) {
    return false;
  }
  if (type === 'school' && step === 2) {
    return Boolean(
      data.schoolName.trim() &&
        data.domain.trim() &&
        data.address.trim() &&
        data.country.trim() &&
        data.city.trim(),
    );
  }
  if (type === 'school' && step === 3) {
    return data.confirmed;
  }
  return true;
}

export function requiredError(value: string, attempted: boolean) {
  return attempted && !value.trim() ? 'This field is required.' : undefined;
}

export function getStepTitle(type: AccountType | null, step: number) {
  if (type === 'school') {
    if (step === 2) return 'Add school details';
    if (step === 3) return 'Complete compliance';
    if (step === 4) return 'Full review';
    return 'Choose account type';
  }
  if (step === 2) return 'Full review';
  if (type === 'teacher') return 'Complete your teacher profile';
  if (type === 'individual') return 'Complete profile basics';
  return 'Choose account type';
}
