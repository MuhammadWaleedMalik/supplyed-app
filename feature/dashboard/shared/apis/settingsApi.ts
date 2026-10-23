import { normalizeUkPhone } from '../../../../utils/auth/ukPhone';
import { readChoices, writeChoices } from '../../../../utils/ui/choices';
import { teachingPayload } from '../../../../utils/onboarding/teachingChoices';
import {
  checkDropdown,
  type DropdownName,
} from '../../../dropdowns/apis/dropdownsApi';
import { ApiError } from '../../../../utils/api/request';
import { endpoints } from '../../../../constants/endpoints';
import { protectedRequest } from '../../../../utils/api/request';
import {
  setCurrentSessionUser,
  getSessionVersion,
  assertSessionVersion,
} from '../../../../utils/api/session';
import { AccountType } from '../../../../utils/onboarding/onboardingData';
import { User } from '../../../auth/apis/authApi';
import {
  optionalNonNegativeNumber,
  optionalNonNegativeInteger,
} from '../../../../utils/ui/numberValidation';
import { isValidEmail } from '../../../../utils/auth/authValidation';

type ProfileRecord = Record<string, unknown>;
type SettingsUser = User & {
  phoneVerified?: boolean;
  lastLogin?: string | null;
  twoFactorEnabled?: boolean;
  createdAt?: string;
};

export type ProfileFields = {
  accountName: string;
  phone: string;
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
export type SettingsSection = 'account' | 'profile' | 'all';

function text(value: unknown) {
  return typeof value === 'string' ? value : '';
}
function numberText(value: unknown) {
  return typeof value === 'number' ? String(value) : '';
}
function listText(value: unknown) {
  if (Array.isArray(value)) return writeChoices(value);
  return typeof value === 'string' && value ? writeChoices([value]) : '';
}
function list(value: string) {
  return readChoices(value);
}
function number(value: string) {
  return optionalNonNegativeNumber(
    value,
    'Rates, experience, travel distance and pupil count',
  );
}
function trust(profile: ProfileRecord) {
  return profile.trust && typeof profile.trust === 'object'
    ? (profile.trust as ProfileRecord)
    : {};
}
function settingSchoolType(value: unknown) {
  return text(value);
}
function backendSchoolType(value: string) {
  return value;
}
function trustPayload(fields: ProfileFields) {
  if (fields.institutionType !== 'MAT_SCHOOL') return undefined;
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
  const version = getSessionVersion();
  const user = await protectedRequest<SettingsUser>(endpoints.currentUser);
  assertSessionVersion(version);
  setCurrentSessionUser(user);
  const profile = await protectedRequest<ProfileRecord>(profilePath(type));
  assertSessionVersion(version);
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
      experience: optionalNonNegativeInteger(fields.experience, 'Experience'),
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
    staffingNeeds: list(fields.staffingNeeds),
    coverTypes: list(fields.coverTypes),
    typicalPupilCount: optionalNonNegativeInteger(
      fields.typicalPupilCount,
      'Pupil count',
    ),
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
  section: SettingsSection = 'all',
) {
  const version = getSessionVersion();
  const before = fieldsFromSettings(current);
  if (section === 'account') {
    fields = {
      ...before,
      accountName: fields.accountName,
      phone: fields.phone,
    };
  } else if (section === 'profile') {
    fields = {
      ...fields,
      accountName: before.accountName,
      phone: before.phone,
    };
  }
  if (
    section !== 'account' &&
    fields.complianceEmail.trim() &&
    !isValidEmail(fields.complianceEmail)
  )
    throw new Error('Enter a valid compliance email address.');
  const oldPayload = section === 'account' ? {} : rolePayload(type, before);
  const fullPayload = section === 'account' ? {} : rolePayload(type, fields);
  const payload: Record<string, unknown> = {};
  for (const key of Object.keys(fullPayload) as (keyof typeof fullPayload)[]) {
    if (JSON.stringify(fullPayload[key]) !== JSON.stringify(oldPayload[key])) {
      // Undefined disappears from JSON. Null explicitly clears nullable fields.
      if (key === 'trust' && fullPayload[key] === undefined) continue;
      payload[key] = fullPayload[key] ?? null;
    }
  }
  const teachingChanged =
    type === 'teacher'
      ? fields.subjects !== before.subjects || fields.skills !== before.skills
      : fields.staffingNeeds !== before.staffingNeeds;
  if (teachingChanged) {
    const teaching = await teachingPayload(
      type === 'teacher' ? fields.subjects : fields.staffingNeeds,
      type === 'teacher' ? fields.skills : undefined,
    );
    if (type === 'teacher') Object.assign(payload, teaching);
    else
      Object.assign(payload, {
        staffingNeeds: teaching.subjects,
        otherSubjects: teaching.otherSubjects,
      });
  }
  const dropdowns: Record<string, DropdownName> = {
    countryCode: 'country',
    city: 'city',
    county: 'region',
    currency: 'currency',
    keyStages: 'keyStage',
    coverTypes: 'coverType',
    institutionType: 'institutionType',
  };
  for (const key of Object.keys(dropdowns)) {
    if (key in payload)
      await checkDropdown(
        dropdowns[key],
        Array.isArray(payload[key])
          ? (payload[key] as string[])
          : payload[key]
          ? [String(payload[key])]
          : [],
      );
  }
  const account: Record<string, string> = {};
  assertSessionVersion(version);
  if (fields.accountName !== before.accountName)
    account.name = fields.accountName.trim();
  if (fields.phone !== before.phone) {
    const fresh = await protectedRequest<SettingsUser>(endpoints.currentUser);
    assertSessionVersion(version);
    setCurrentSessionUser(fresh);
    const nextPhone = fields.phone.trim() ? normalizeUkPhone(fields.phone) : '';
    const savedPhone = fresh.phone ? normalizeUkPhone(fresh.phone) : '';
    if (nextPhone !== savedPhone) {
      if (fresh.phoneVerified)
        throw new ApiError(
          'This number is verified and cannot be edited.',
          409,
          'PHONE_VERIFIED_LOCKED',
        );
      if (!nextPhone) throw new Error('Enter a valid UK phone number.');
      account.phone = nextPhone;
    }
  }
  let accountSaved = false;
  if (Object.keys(account).length) {
    assertSessionVersion(version);
    await protectedRequest(endpoints.userBasics, 'PATCH', account);
    accountSaved = true;
  }
  try {
    assertSessionVersion(version);
    if (Object.keys(payload).length)
      await protectedRequest(
        patchPath(type, current.profile),
        'PATCH',
        payload,
      );
  } catch (error) {
    if (!accountSaved) throw error;
    const message =
      'Your account changes were saved, but your profile was not. ' +
      (error instanceof Error ? error.message : 'Please retry.');
    // The original error is already sanitized. Preserve partial-success copy.
    throw Object.assign(
      new Error(message),
      error instanceof ApiError
        ? {
            status: error.status,
            code: error.code,
            requestId: error.requestId,
          }
        : {},
    );
  }
  assertSessionVersion(version);
  return getProfileSettings(type);
}

export function fieldsFromSettings(settings?: ProfileSnapshot): ProfileFields {
  const profile = settings?.profile || {};
  const trustRecord = trust(profile);
  return {
    accountName: settings?.user.name || '',
    phone: settings?.user.phone || '',
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
    staffingNeeds: listText(profile.staffingNeeds),
    coverTypes: listText(profile.coverTypes),
    typicalPupilCount: numberText(profile.typicalPupilCount),
    complianceContact: text(profile.complianceContact),
    complianceEmail: text(profile.complianceEmail),
    userRole: text(profile.userRole),
    safeguardingConfirmed: profile.safeguardingConfirmed === true,
  };
}
