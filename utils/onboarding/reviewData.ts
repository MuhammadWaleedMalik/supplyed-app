import { AccountType, OnboardingData } from './onboardingData';

function shown(value: string) {
  return value.trim() || 'Not provided';
}

export function accountReview(
  type: AccountType,
  email: string,
  data: OnboardingData,
) {
  const label = type === 'school' ? 'School / MAT' : 'Supply teacher';
  const items = [
    ['PROFILE TYPE', label],
    ['NAME', shown(data.fullName)],
    ['EMAIL', shown(email)],
    ['PHONE', shown(data.phone)],
    ['POSTAL CODE', shown(data.postcode)],
  ];
  if (type === 'teacher') {
    items.push(['COUNTRY', shown(data.country)], ['CITY', shown(data.city)]);
  }
  return items;
}

export function schoolReview(data: OnboardingData) {
  const items = [
    ['SCHOOL', shown(data.schoolName)],
    ['YOUR ROLE', shown(data.schoolRole)],
    ['DOMAIN', shown(data.domain)],
    ['REGISTRATION ID', shown(data.registrationId)],
    ['SCHOOL TYPE', data.institutionType],
  ];

  if (data.institutionType === 'MAT school') {
    items.push(
      ['TRUST NAME', shown(data.trustName)],
      ['TRUST COMPANY NUMBER', shown(data.trustCompanyNumber)],
    );
  }

  items.push(
    ['ADDRESS', shown(data.address)],
    ['COUNTRY', shown(data.country)],
    ['CITY', shown(data.city)],
    ['PUPIL COUNT', shown(data.pupilCount)],
    ['NEEDS', shown(data.staffingNeeds)],
  );

  return items;
}

export function complianceReview(data: OnboardingData) {
  const items = [
    ['COMPLIANCE LEAD', shown(data.complianceLead)],
    ['COMPLIANCE EMAIL', shown(data.complianceEmail)],
    ['SAFEGUARDING', data.confirmed ? 'Confirmed' : 'Not confirmed'],
  ];

  if (data.institutionType === 'MAT school') {
    items.push(
      ['SIGNATORY NAME', shown(data.signatoryName)],
      ['SIGNATORY EMAIL', shown(data.signatoryEmail)],
      ['SIGNATORY JOB TITLE', shown(data.signatoryJobTitle)],
    );
  }

  return items;
}

export function teacherReview(data: OnboardingData) {
  return [
    ['SUBJECTS', shown(data.subjects)],
    ['KEY STAGES', shown(data.keyStages)],
    ['SKILLS', shown(data.skills)],
    ['EXPERIENCE', shown(data.experience)],
    ['DAILY RATE', shown(data.dailyRate)],
    ['HOURLY RATE', shown(data.hourlyRate)],
    ['CURRENCY', shown(data.currency)],
    ['TRAVEL DISTANCE', shown(data.travelDistance)],
    ['TRN', shown(data.trn)],
    ['BIO', shown(data.bio)],
  ];
}
