import { ApiError } from '../api/request';
import { AccountType } from '../onboarding/onboardingData';
import { getProfile } from '../../feature/onboarding/apis/profileApi';
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

  const requirements = await getRequirements(type);
  const documents = await getDocuments();
  if (!requiredDocumentsReady(requirements, documents))
    return 'documents';
  return 'dashboard';
}
