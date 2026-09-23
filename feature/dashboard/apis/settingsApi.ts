import { endpoints } from '../../../constants/endpoints';
import { protectedRequest } from '../../../utils/api/request';
import { AccountType } from '../../../utils/onboarding/onboardingData';
import { User } from '../../auth/apis/authApi';

type ProfileValue = string | number | boolean | string[] | null | undefined;
type ProfileRecord = Record<string, ProfileValue>;

export type ProfileFields = {
  name: string;
  phone: string;
  city: string;
  postalCode: string;
};

export type ProfileSnapshot = {
  user: User;
  profile: ProfileRecord;
};

function text(value: ProfileValue) {
  return typeof value === 'string' ? value : '';
}

function profilePath(type: AccountType) {
  if (type === 'teacher') return endpoints.teacherMe;
  if (type === 'school') return endpoints.schoolMe;
  return endpoints.individualMe;
}

function patchPath(type: AccountType, profile: ProfileRecord) {
  if (type === 'teacher') return endpoints.teacherProfile + '/' + profile.id;
  if (type === 'school') return endpoints.schoolProfile + '/' + profile.id;
  return endpoints.individualMe;
}

export async function getProfileSettings(type: AccountType) {
  const user = await protectedRequest<User>(endpoints.currentUser);
  const profile = await protectedRequest<ProfileRecord>(profilePath(type));
  return { user, profile };
}

export async function saveProfileSettings(
  type: AccountType,
  current: ProfileSnapshot,
  fields: ProfileFields,
) {
  await protectedRequest(endpoints.userBasics, 'PATCH', {
    name: fields.name.trim(),
    phone: fields.phone.trim(),
  });
  const profileName = type === 'individual' ? 'displayName' : 'name';
  const teacherName = type === 'teacher' ? 'fullName' : profileName;
  await protectedRequest(patchPath(type, current.profile), 'PATCH', {
    [teacherName]: fields.name.trim(),
    city: fields.city.trim(),
    postalCode: fields.postalCode.trim().toUpperCase(),
  });
  return getProfileSettings(type);
}

export function fieldsFromSettings(settings?: ProfileSnapshot): ProfileFields {
  const profile = settings?.profile || {};
  return {
    name: settings?.user.name || text(profile.name) || text(profile.fullName) || text(profile.displayName),
    phone: settings?.user.phone || '',
    city: text(profile.city),
    postalCode: text(profile.postalCode),
  };
}
