import { ApiError } from '../api/request';
import { AccountType } from '../onboarding/onboardingData';
import {
  getProfile,
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

  const requirements = await getRequirements();
  const documents = await getDocuments();
  const documentsReady = requiredDocumentsReady(requirements, documents);
  let trustReady = true;

  if (type === 'school' && profile.institutionType === 'MAT_SCHOOL') {
    const approval = await getSignatoryApproval();
    trustReady = approval?.status === 'APPROVED';
  }

  if (!documentsReady) return 'documents';
  if (profile.status !== 'ACTIVE' || !trustReady) return 'reviewStatus';
  return 'dashboard';
}
