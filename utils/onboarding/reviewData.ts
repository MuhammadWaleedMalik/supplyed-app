import { AccountType, OnboardingData } from './onboardingData';

function shown(value: string) {
  return value.trim() || 'Not provided';
}

export function accountReview(
  type: AccountType,
  email: string,
  data: OnboardingData,
) {
  let label = 'Individual hirer';
  if (type === 'school') label = 'School / MAT';
  if (type === 'teacher') label = 'Supply teacher';
  const items = [
    ['ACCOUNT TYPE', label],
    ['NAME', shown(data.fullName)],
    ['EMAIL', shown(email)],
    ['PHONE', shown(data.phone)],
    ['POSTAL CODE', shown(data.postcode)],
  ];
  if (type !== 'school') {
    items.push(['COUNTRY', shown(data.country)], ['CITY', shown(data.city)]);
  }
  return items;
}

export function schoolReview(data: OnboardingData) {
  return [
    ['SCHOOL / MAT', shown(data.schoolName)],
    ['YOUR ROLE', shown(data.schoolRole)],
    ['DOMAIN', shown(data.domain)],
    ['REGISTRATION ID', shown(data.registrationId)],
    ['ADDRESS', shown(data.address)],
    ['COUNTRY', shown(data.country)],
    ['CITY', shown(data.city)],
    ['PUPIL COUNT', shown(data.pupilCount)],
    ['NEEDS', shown(data.staffingNeeds)],
  ];
}

export function complianceReview(data: OnboardingData) {
  return [
    ['COMPLIANCE LEAD', shown(data.complianceLead)],
    ['COMPLIANCE EMAIL', shown(data.complianceEmail)],
    ['SAFEGUARDING', data.confirmed ? 'Confirmed' : 'Not confirmed'],
  ];
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
