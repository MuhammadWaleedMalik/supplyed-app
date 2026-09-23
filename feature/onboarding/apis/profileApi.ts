import { endpoints } from '../../../constants/endpoints';
import { protectedRequest } from '../../../utils/api/request';
import {
  AccountType,
  OnboardingData,
} from '../../../utils/onboarding/onboardingData';
import { profilePayload } from '../../../utils/onboarding/profilePayload';

type Profile = { id: string; status?: string };

export function profilePath(type: AccountType) {
  if (type === 'teacher') return endpoints.teacherProfile;
  if (type === 'school') return endpoints.schoolProfile;
  return endpoints.individualProfile;
}

export function profileMePath(type: AccountType) {
  if (type === 'teacher') return endpoints.teacherMe;
  if (type === 'school') return endpoints.schoolMe;
  return endpoints.individualMe;
}

export async function createProfile(type: AccountType, data: OnboardingData) {
  const basics: { name: string; phone?: string } = {
    name: data.fullName.trim(),
  };
  if (data.phone.trim()) basics.phone = data.phone.trim();
  await protectedRequest(endpoints.userBasics, 'PATCH', basics);
  return protectedRequest<Profile>(
    profilePath(type),
    'POST',
    profilePayload(type, data),
  );
}

export function getProfile(type: AccountType) {
  return protectedRequest<Profile>(profileMePath(type));
}
