import { AccountType, OnboardingData } from './onboardingData';

export function canContinue(
  type: AccountType,
  step: number,
  data: OnboardingData,
) {
  if (!data.fullName.trim() || !data.phone.trim()) {
    return false;
  }
  if (type === 'school' && step === 2) {
    const trustReady =
      data.institutionType === 'Single school' || data.trustName.trim();
    return Boolean(
      data.schoolName.trim() &&
        data.domain.trim() &&
        data.address.trim() &&
        data.country.trim() &&
        data.city.trim() &&
        trustReady,
    );
  }
  if (type === 'school' && step === 3) {
    const signatoryReady =
      data.institutionType === 'Single school' ||
      Boolean(
        data.signatoryName.trim() &&
          data.signatoryEmail.trim() &&
          data.signatoryJobTitle.trim(),
      );
    return data.confirmed && signatoryReady;
  }
  return true;
}

export function requiredError(value: string, attempted: boolean) {
  return attempted && !value.trim() ? 'This field is required.' : undefined;
}

export function getStepTitle(type: AccountType, step: number) {
  if (type === 'school') {
    if (step === 2) return 'Add school details';
    if (step === 3) return 'Complete compliance and signatory';
    if (step === 4) return 'Full review';
    return 'Add account owner details';
  }
  if (step === 2) return 'Full review';
  return 'Complete your teacher profile';
}
