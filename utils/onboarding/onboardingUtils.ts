import { AccountType, OnboardingData } from './onboardingData';
import { isValidEmail } from '../auth/authValidation';
import { normalizeUkPhone } from '../auth/ukPhone';
import { readChoices } from '../ui/choices';

export function onboardingErrors(
  type: AccountType,
  step: number,
  data: OnboardingData,
  email = '',
) {
  const errors: string[] = [];
  if (!data.fullName.trim() || data.fullName.trim().length > 120)
    errors.push('Enter your full name, up to 120 characters.');
  try {
    normalizeUkPhone(data.phone);
  } catch {
    errors.push('Enter a valid UK phone number.');
  }

  const needsLocation = type === 'teacher' || step >= 2;
  if (needsLocation) {
    if (data.country !== 'GB')
      errors.push('Choose United Kingdom as the country.');
    if (!data.city.trim()) errors.push('Choose a city or town.');
    const postcode = data.postcode.toUpperCase().replace(/\s+/g, '');
    const pattern =
      /^(?:GIR0AA|(?:[A-PR-UWYZ]\d\d?|[A-PR-UWYZ][A-HK-Y]\d\d?|[A-PR-UWYZ]\d[A-HJKPSTUW]|[A-PR-UWYZ][A-HK-Y]\d[ABEHMNPRVWXY])\d[ABD-HJLNP-UW-Z]{2})$/;
    if (!pattern.test(postcode) || /^(?:GY|JE|IM)/.test(postcode))
      errors.push('Enter a valid UK postcode, for example SW1A 1AA.');
  }

  function number(
    value: string,
    label: string,
    integer = false,
    required = false,
  ) {
    const text = value.trim();
    if (
      (!text && required) ||
      (text &&
        (!(integer ? /^\d+$/ : /^(?:\d+(?:\.\d*)?|\.\d+)$/).test(text) ||
          !Number.isFinite(Number(text))))
    )
      errors.push(
        `Enter ${label.toLowerCase()} as a ${
          integer ? 'whole ' : ''
        }number, zero or more.`,
      );
  }

  if (type === 'teacher') {
    if (!readChoices(data.keyStages).length)
      errors.push('Choose at least one key stage.');
    number(data.experience, 'Years of experience', true, true);
    number(data.dailyRate, 'Daily rate');
    number(data.hourlyRate, 'Hourly rate');
    number(data.travelDistance, 'Travel distance');
    if (data.currency !== 'GBP') errors.push('Choose GBP for your rates.');
    if (data.bio.trim().length < 40 || data.bio.trim().length > 10000)
      errors.push(
        'Write between 40 and 10,000 characters about your teaching style.',
      );
  }

  if (type === 'school' && step >= 2) {
    if (!data.schoolName.trim() || data.schoolName.trim().length > 200)
      errors.push('Enter the school name, up to 200 characters.');
    if (!data.schoolRole.trim() || data.schoolRole.trim().length > 100)
      errors.push('Enter your role at the school, up to 100 characters.');
    const domain = data.domain
      .trim()
      .replace(/^https?:\/\//i, '')
      .replace(/\/$/, '');
    if (
      domain.length > 253 ||
      !/^(?:[a-z\d](?:[a-z\d-]*[a-z\d])?\.)+[a-z]{2,63}$/i.test(domain)
    )
      errors.push('Enter a school domain such as school.org.uk.');
    if (!data.address.trim() || data.address.trim().length > 250)
      errors.push('Enter the school address, up to 250 characters.');
    if (!['SINGLE_SCHOOL', 'MAT_SCHOOL'].includes(data.institutionType))
      errors.push('Choose the school type.');
    if (!readChoices(data.coverTypes).length)
      errors.push('Choose at least one cover type.');
    number(data.pupilCount, 'Pupil count', true);
    if (data.institutionType === 'MAT_SCHOOL') {
      if (!data.trustName.trim() || data.trustName.trim().length > 200)
        errors.push('Enter the trust name, up to 200 characters.');
      const company = data.trustCompanyNumber.replace(/\s+/g, '');
      if (company && !/^(?:\d{1,8}|[A-Z]{2}\d{6})$/i.test(company))
        errors.push(
          'Use up to 8 digits, or 2 letters and 6 digits, for the trust company number.',
        );
    }
  }

  if (type === 'school' && step >= 3) {
    if (!data.complianceLead.trim() || data.complianceLead.trim().length > 200)
      errors.push(
        'Enter the safeguarding or compliance lead, up to 200 characters.',
      );
    if (!isValidEmail(data.complianceEmail))
      errors.push('Enter a valid compliance email address.');
    if (!data.confirmed)
      errors.push('Confirm safeguarding responsibility before continuing.');
    if (data.institutionType === 'MAT_SCHOOL') {
      if (!data.signatoryName.trim() || data.signatoryName.trim().length > 200)
        errors.push('Enter the trust signatory name, up to 200 characters.');
      if (!isValidEmail(data.signatoryEmail))
        errors.push('Enter a valid signatory email address.');
      else if (
        email &&
        data.signatoryEmail.trim().toLowerCase() === email.trim().toLowerCase()
      )
        errors.push('The trust signatory must be someone other than you.');
      if (
        !data.signatoryJobTitle.trim() ||
        data.signatoryJobTitle.trim().length > 150
      )
        errors.push('Enter the signatory job title, up to 150 characters.');
    }
  }
  return errors;
}

export function canContinue(
  type: AccountType,
  step: number,
  data: OnboardingData,
) {
  return onboardingErrors(type, step, data).length === 0;
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
