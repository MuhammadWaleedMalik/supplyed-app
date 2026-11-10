import { ApiError } from '../api/request';
import { AccountType } from '../onboarding/onboardingData';
import {
  getProfile,
  getComplianceApproval,
  getSignatoryApproval,
} from '../../feature/onboarding/apis/profileApi';
import {
  getDocuments,
  getRequirements,
} from '../../feature/documents/apis/documentApi';
import { requiredDocumentsReady } from '../documents/documentUtils';

export async function nextAccountScreen(type: AccountType) {
  let profile;
  try {
    profile = await getProfile(type);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404)
      return 'onboarding';
    throw error;
  }
  if (!profile?.id) return 'onboarding';
  // Suspension/deactivation takes priority over repairable onboarding fields.
  if (['SUSPENDED', 'DEACTIVATED'].includes(profile.status || '')) return 'reviewStatus';

  const [requirements, documents] = await Promise.all([getRequirements(), getDocuments()]);
  const documentsReady = requiredDocumentsReady(requirements, documents);
  let trustReady = true;

  if (type === 'school' && profile.institutionType === 'MAT_SCHOOL') {
    const approval = await getSignatoryApproval();
    trustReady = approval?.status === 'APPROVED';
  } else if (
    type === 'school' &&
    profile.complianceApprovalRequired !== false
  ) {
    const approval = await getComplianceApproval();
    trustReady = approval?.status === 'APPROVED';
  }

  if (!documentsReady) return 'documents';
  if (profile.status !== 'ACTIVE' || !trustReady) return 'reviewStatus';
  return 'dashboard';
}
