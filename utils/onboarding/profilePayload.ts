import { AccountType, OnboardingData } from './onboardingData';

function countryCode(country: string) {
  if (country === 'Pakistan') return 'PK';
  if (country === 'Egypt') return 'EG';
  return 'GB';
}

function numberOrUndefined(value: string) {
  return value.trim() ? Number(value) : undefined;
}

export function profilePayload(type: AccountType, data: OnboardingData) {
  if (type === 'teacher') {
    return {
      fullName: data.fullName.trim(),
      bio: data.bio.trim(),
      city: data.city.trim(),
      countryCode: countryCode(data.country),
      postalCode: data.postcode.trim(),
      currency: data.currency,
      dailyRate: numberOrUndefined(data.dailyRate),
      hourlyRate: numberOrUndefined(data.hourlyRate),
      experience: numberOrUndefined(data.experience),
      keyStages: data.keyStages ? [data.keyStages] : [],
      subjects: data.subjects ? [data.subjects] : [],
      skills: data.skills ? [data.skills] : [],
      maxTravelDistance: numberOrUndefined(data.travelDistance),
    };
  }
  if (type === 'school') {
    return {
      name: data.schoolName.trim(),
      domain: data.domain
        .trim()
        .replace(/^https?:\/\//, '')
        .split('/')[0]
        .toLowerCase(),
      address: data.address.trim(),
      city: data.city.trim(),
      countryCode: countryCode(data.country),
      postalCode: data.postcode.trim(),
      registrationId: data.registrationId.trim(),
      userRole: data.schoolRole.trim(),
      complianceContact: data.complianceLead.trim(),
      complianceEmail: data.complianceEmail.trim(),
      coverTypes: data.staffingNeeds ? [data.staffingNeeds] : [],
      staffingNeeds: data.staffingNeeds,
      typicalPupilCount: numberOrUndefined(data.pupilCount),
      safeguardingConfirmed: data.confirmed,
    };
  }
  return {
    displayName: data.fullName.trim(),
    city: data.city.trim(),
    countryCode: countryCode(data.country),
    postalCode: data.postcode.trim(),
  };
}
