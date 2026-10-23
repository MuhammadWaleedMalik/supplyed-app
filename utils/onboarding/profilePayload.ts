import { readChoices } from '../ui/choices';
import { teachingPayload } from './teachingChoices';
import { checkDropdown } from '../../feature/dropdowns/apis/dropdownsApi';
import { AccountType, OnboardingData } from './onboardingData';
import {
  optionalNonNegativeNumber,
  optionalNonNegativeInteger,
} from '../ui/numberValidation';

function trustPayload(data: OnboardingData) {
  if (data.institutionType !== 'MAT_SCHOOL') return undefined;
  return {
    name: data.trustName.trim(),
    companyNumber: data.trustCompanyNumber.trim() || undefined,
  };
}

export async function profilePayload(type: AccountType, data: OnboardingData) {
  await checkDropdown('country', [data.country]);
  await checkDropdown('city', [data.city]);
  if (data.county) await checkDropdown('region', [data.county]);
  const teaching = await teachingPayload(
    type === 'teacher' ? data.subjects : data.staffingNeeds,
    type === 'teacher' ? data.skills : undefined,
  );
  if (type === 'teacher') {
    await checkDropdown('keyStage', readChoices(data.keyStages));
    await checkDropdown('currency', [data.currency]);
  } else {
    await checkDropdown('institutionType', [data.institutionType]);
    await checkDropdown('coverType', readChoices(data.coverTypes));
  }
  if (type === 'teacher') {
    return {
      fullName: data.fullName.trim(),
      bio: data.bio.trim(),
      city: data.city.trim(),
      countryCode: data.country,
      postalCode: data.postcode.trim(),
      currency: data.currency,
      dailyRate: optionalNonNegativeNumber(data.dailyRate, 'Daily rate'),
      hourlyRate: optionalNonNegativeNumber(data.hourlyRate, 'Hourly rate'),
      experience: optionalNonNegativeInteger(data.experience, 'Experience'),
      keyStages: readChoices(data.keyStages),
      ...teaching,
      maxTravelDistance: optionalNonNegativeNumber(
        data.travelDistance,
        'Travel distance',
      ),
    };
  }
  return {
    name: data.schoolName.trim(),
    domain: data.domain
      .trim()
      .replace(/^https?:\/\//, '')
      .split('/')[0]
      .toLowerCase(),
    address: data.address.trim(),
    city: data.city.trim(),
    countryCode: data.country,
    postalCode: data.postcode.trim(),
    registrationId: data.registrationId.trim(),
    userRole: data.schoolRole.trim(),
    institutionType: data.institutionType,
    trust: trustPayload(data),
    complianceContact: data.complianceLead.trim(),
    complianceEmail: data.complianceEmail.trim(),
    coverTypes: readChoices(data.coverTypes),
    staffingNeeds: teaching.subjects,
    otherSubjects: teaching.otherSubjects,
    county: data.county || undefined,
    typicalPupilCount: optionalNonNegativeInteger(
      data.pupilCount,
      'Pupil count',
    ),
    safeguardingConfirmed: data.confirmed,
  };
}
