import { endpoints } from '../../../../constants/endpoints';
import { protectedRequest } from '../../../../utils/api/request';
import { setCurrentSessionUser } from '../../../../utils/api/session';
import { AccountType } from '../../../../utils/onboarding/onboardingData';
import { User } from '../../../auth/apis/authApi';

type ProfileRecord = Record<string, unknown>;
type SettingsUser = User & {
  phoneVerified?: boolean;
  lastLogin?: string | null;
  twoFactorEnabled?: boolean;
  createdAt?: string;
};

export type ProfileFields = {
  accountName: string;
  profileName: string;
  bio: string;
  address: string;
  city: string;
  county: string;
  postalCode: string;
  countryCode: string;
  subjects: string;
  skills: string;
  keyStages: string;
  hourlyRate: string;
  dailyRate: string;
  experience: string;
  currency: string;
  maxTravelDistance: string;
  registrationId: string;
  domain: string;
  institutionType: string;
  trustName: string;
  trustCompanyNumber: string;
  staffingNeeds: string;
  coverTypes: string;
  typicalPupilCount: string;
  complianceContact: string;
  complianceEmail: string;
  userRole: string;
  safeguardingConfirmed: boolean;
};

export type ProfileSnapshot = { user: SettingsUser; profile: ProfileRecord };

function text(value: unknown) {
  return typeof value === 'string' ? value : '';
}
function numberText(value: unknown) {
  return typeof value === 'number' ? String(value) : '';
}
function listText(value: unknown) {
  return Array.isArray(value) ? value.join(', ') : '';
}
function list(value: string) {
  return Array.from(
    new Set(
      value
        .split(',')
        .map(item => item.trim())
        .filter(Boolean),
    ),
  );
}
function number(value: string) {
  const parsed = Number(value);
  return value.trim() && Number.isFinite(parsed) ? parsed : undefined;
}
function trust(profile: ProfileRecord) {
  return profile.trust && typeof profile.trust === 'object'
    ? (profile.trust as ProfileRecord)
    : {};
}
function settingSchoolType(value: unknown) {
  return value === 'MAT_SCHOOL' ? 'MAT school' : 'Single school';
}
function backendSchoolType(value: string) {
  return value === 'MAT school' ? 'MAT_SCHOOL' : 'SINGLE_SCHOOL';
}
function trustPayload(fields: ProfileFields) {
  if (fields.institutionType !== 'MAT school') return undefined;
  return {
    name: fields.trustName.trim(),
    companyNumber: fields.trustCompanyNumber.trim() || undefined,
  };
}

function profilePath(type: AccountType) {
  return type === 'teacher' ? endpoints.teacherMe : endpoints.schoolMe;
}

function patchPath(type: AccountType, profile: ProfileRecord) {
  if (type === 'teacher') return endpoints.teacherProfile + '/' + profile.id;
  return endpoints.schoolProfile + '/' + profile.id;
}

export async function getProfileSettings(type: AccountType) {
  const user = await protectedRequest<SettingsUser>(endpoints.currentUser);
  setCurrentSessionUser(user);
  const profile = await protectedRequest<ProfileRecord>(profilePath(type));
  return { user, profile };
}

function commonPayload(fields: ProfileFields) {
  return {
    bio: fields.bio.trim() || undefined,
    address: fields.address.trim() || undefined,
    city: fields.city.trim() || undefined,
    county: fields.county.trim() || undefined,
    postalCode: fields.postalCode.trim().toUpperCase() || undefined,
    countryCode: fields.countryCode || 'GB',
  };
}

function rolePayload(type: AccountType, fields: ProfileFields) {
  if (type === 'teacher')
    return {
      ...commonPayload(fields),
      fullName: fields.profileName.trim(),
      subjects: list(fields.subjects),
      skills: list(fields.skills),
      keyStages: list(fields.keyStages),
      hourlyRate: number(fields.hourlyRate),
      dailyRate: number(fields.dailyRate),
      experience: number(fields.experience),
      currency: fields.currency || 'GBP',
      maxTravelDistance: number(fields.maxTravelDistance),
    };
  return {
    name: fields.profileName.trim(),
    registrationId: fields.registrationId.trim() || undefined,
    domain: fields.domain
      .trim()
      .replace(/^https?:\/\//, '')
      .split('/')[0]
      .toLowerCase(),
    address: fields.address.trim(),
    city: fields.city.trim(),
    county: fields.county.trim() || undefined,
    postalCode: fields.postalCode.trim().toUpperCase() || undefined,
    countryCode: fields.countryCode || 'GB',
    institutionType: backendSchoolType(fields.institutionType),
    trust: trustPayload(fields),
    staffingNeeds: fields.staffingNeeds.trim() || undefined,
    coverTypes: list(fields.coverTypes),
    typicalPupilCount: number(fields.typicalPupilCount),
    complianceContact: fields.complianceContact.trim() || undefined,
    complianceEmail: fields.complianceEmail.trim() || undefined,
    userRole: fields.userRole.trim() || undefined,
    safeguardingConfirmed: fields.safeguardingConfirmed,
  };
}

export async function saveProfileSettings(
  type: AccountType,
  current: ProfileSnapshot,
  fields: ProfileFields,
) {
  await protectedRequest(endpoints.userBasics, 'PATCH', {
    name: fields.accountName.trim(),
  });
  await protectedRequest(
    patchPath(type, current.profile),
    'PATCH',
    rolePayload(type, fields),
  );
  return getProfileSettings(type);
}

export function fieldsFromSettings(settings?: ProfileSnapshot): ProfileFields {
  const profile = settings?.profile || {};
  const trustRecord = trust(profile);
  return {
    accountName: settings?.user.name || '',
    profileName:
      text(profile.fullName) || text(profile.name) || text(profile.displayName),
    bio: text(profile.bio),
    address: text(profile.address),
    city: text(profile.city),
    county: text(profile.county),
    postalCode: text(profile.postalCode),
    countryCode: text(profile.countryCode) || 'GB',
    subjects: listText(profile.subjects),
    skills: listText(profile.skills),
    keyStages: listText(profile.keyStages),
    hourlyRate: numberText(profile.hourlyRate),
    dailyRate: numberText(profile.dailyRate),
    experience: numberText(profile.experience),
    currency: text(profile.currency) || 'GBP',
    maxTravelDistance: numberText(profile.maxTravelDistance),
    registrationId: text(profile.registrationId),
    domain: text(profile.domain),
    institutionType: settingSchoolType(profile.institutionType),
    trustName: text(trustRecord.name),
    trustCompanyNumber: text(trustRecord.companyNumber),
    staffingNeeds: text(profile.staffingNeeds),
    coverTypes: listText(profile.coverTypes),
    typicalPupilCount: numberText(profile.typicalPupilCount),
    complianceContact: text(profile.complianceContact),
    complianceEmail: text(profile.complianceEmail),
    userRole: text(profile.userRole),
    safeguardingConfirmed: profile.safeguardingConfirmed === true,
  };
}
