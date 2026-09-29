import { endpoints } from '../../../constants/endpoints';
import { protectedRequest } from '../../../utils/api/request';
import {
  AccountType,
  OnboardingData,
} from '../../../utils/onboarding/onboardingData';
import { profilePayload } from '../../../utils/onboarding/profilePayload';

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
  return protectedRequest<Profile>(
    profilePath(type),
    'POST',
    profilePayload(type, data),
  );
}

export function getProfile(type: AccountType) {
  return protectedRequest<Profile>(profileMePath(type));
}

export async function submitProfileForReview(type: AccountType) {
  const profile = await getProfile(type);
  if (profile.status !== 'INCOMPLETE') return profile;
  return protectedRequest<Profile>(profileStatusPath(type), 'PATCH');
}

export function getSignatoryApproval() {
  return protectedRequest<SignatoryApproval | null>(
    endpoints.schoolSignatoryApproval,
  );
}

export function requestSignatoryApproval(fields: SignatoryFields) {
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
