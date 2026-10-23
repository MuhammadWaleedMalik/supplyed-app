import { endpoints } from '../../../constants/endpoints';
import { protectedRequest } from '../../../utils/api/request';
import {
  setCurrentSessionUser,
  getSessionVersion,
  assertSessionVersion,
  getCurrentSessionUser,
} from '../../../utils/api/session';
import {
  AccountType,
  OnboardingData,
} from '../../../utils/onboarding/onboardingData';
import { profilePayload } from '../../../utils/onboarding/profilePayload';
import { getCurrentUser } from '../../auth/apis/authApi';
import { normalizeUkPhone } from '../../../utils/auth/ukPhone';
import { isValidEmail } from '../../../utils/auth/authValidation';

export type Profile = {
  id: string;
  status?: string;
  institutionType?: string;
  trust?: { id: string; name: string; companyNumber?: string | null } | null;
};

export type SignatoryApproval = {
  id: string;
  status: string;
  signatoryName: string;
  signatoryEmail: string;
  signatoryJobTitle: string;
  expiresAt?: string;
  decidedAt?: string | null;
  declineReason?: string | null;
  approvedByAdmin?: boolean;
  trust?: { name?: string; companyNumber?: string | null };
};

export type SignatoryFields = {
  signatoryName: string;
  signatoryEmail: string;
  signatoryJobTitle: string;
};

export function profilePath(type: AccountType) {
  return type === 'teacher'
    ? endpoints.teacherProfile
    : endpoints.schoolProfile;
}

export function profileMePath(type: AccountType) {
  return type === 'teacher' ? endpoints.teacherMe : endpoints.schoolMe;
}

function profileStatusPath(type: AccountType) {
  return type === 'teacher' ? endpoints.teacherStatus : endpoints.schoolStatus;
}

export async function createProfile(type: AccountType, data: OnboardingData) {
  const version = getSessionVersion();
  const payload = await profilePayload(type, data);
  assertSessionVersion(version);
  return protectedRequest<Profile>(profilePath(type), 'POST', payload);
}

export async function saveOnboardingAccount(data: OnboardingData) {
  const version = getSessionVersion();
  const user = await getCurrentUser();
  assertSessionVersion(version);
  // Preserve an existing verified number.
  const account = user.phoneVerified
    ? { name: data.fullName.trim() }
    : { name: data.fullName.trim(), phone: normalizeUkPhone(data.phone) };

  await protectedRequest(endpoints.userBasics, 'PATCH', account);
  assertSessionVersion(version);
  const savedUser = await getCurrentUser();
  setCurrentSessionUser(savedUser);
  return savedUser;
}

export function getProfile(type: AccountType) {
  return protectedRequest<Profile>(profileMePath(type));
}

export async function submitProfileForReview(type: AccountType) {
  const version = getSessionVersion();
  const profile = await getProfile(type);
  assertSessionVersion(version);
  if (['PENDING', 'ACTIVE'].includes(profile.status || '')) return profile;
  if (!['INCOMPLETE', 'REJECTED', 'DEACTIVATED'].includes(profile.status || ''))
    throw new Error(
      'This profile cannot be submitted for review. Contact support.',
    );
  return protectedRequest<Profile>(profileStatusPath(type), 'PATCH');
}

export function getSignatoryApproval() {
  return protectedRequest<SignatoryApproval | null>(
    endpoints.schoolSignatoryApproval,
  );
}

export function requestSignatoryApproval(fields: SignatoryFields) {
  if (!fields.signatoryName.trim() || fields.signatoryName.trim().length > 200)
    throw new Error('Enter a signatory name with up to 200 characters.');
  if (!isValidEmail(fields.signatoryEmail))
    throw new Error('Enter a valid signatory email address.');
  if (
    fields.signatoryEmail.trim().toLowerCase() ===
    getCurrentSessionUser()?.email.toLowerCase()
  )
    throw new Error('The trust signatory must be someone other than you.');
  if (
    !fields.signatoryJobTitle.trim() ||
    fields.signatoryJobTitle.trim().length > 150
  )
    throw new Error('Enter a signatory job title with up to 150 characters.');
  return protectedRequest<SignatoryApproval>(
    endpoints.schoolSignatoryApproval,
    'POST',
    {
      signatoryName: fields.signatoryName.trim(),
      signatoryEmail: fields.signatoryEmail.trim().toLowerCase(),
      signatoryJobTitle: fields.signatoryJobTitle.trim(),
    },
  );
}
