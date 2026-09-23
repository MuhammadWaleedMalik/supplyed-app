import { endpoints } from '../../../constants/endpoints';
import { protectedRequest } from '../../../utils/api/request';
import { AccountType } from '../../../utils/onboarding/onboardingData';

export type Requirement = {
  id: string;
  isRequired: boolean;
  context?: string;
  isActive?: boolean;
  documentType: {
    id: string;
    name: string;
    code: string;
    description?: string;
    isActive?: boolean;
    allowedMimes?: string[];
    maxSizeBytes?: number;
  };
};

export type Document = {
  id: string;
  requirementId: string;
  applicationId?: string | null;
  deletedAt?: string | null;
  fileKey?: string;
  originalName?: string;
  uploadedAt?: string;
  status?: string;
  rejectionComment?: string | null;
};

function backendRole(type: AccountType) {
  if (type === 'teacher') return 'INSTRUCTOR';
  if (type === 'school') return 'INSTITUTION';
  return 'RECRUITER';
}

export async function getRequirements(type: AccountType) {
  const path = endpoints.requirements + '?role=' + backendRole(type);
  const items = await protectedRequest<Requirement[]>(path);
  if (!Array.isArray(items)) throw new Error('Document requirements are unavailable.');
  const context = backendRole(type) + '_PROFILE';
  for (const item of items) {
    if (!item.id || !item.documentType?.id)
      throw new Error('Document requirements are incomplete.');
    if (item.context && item.context !== context && item.context !== 'APPLICATION')
      throw new Error('Unexpected document requirement.');
  }
  return items.filter(item =>
    (!item.context || item.context === context) &&
    item.isActive !== false && item.documentType.isActive !== false,
  );
}

export async function getDocuments() {
  const documents: Document[] = [];
  for (let page = 1; page <= 20; page++) {
    const result = await protectedRequest<{
      documents: Document[];
      pagination?: { hasNextPage?: boolean };
    } | Document[]>(endpoints.documents + '?limit=100&page=' + page);
    const items = Array.isArray(result) ? result : result.documents;
    if (!Array.isArray(items)) throw new Error('Documents could not be loaded.');
    documents.push(...items.filter(item => !item.applicationId && !item.deletedAt));
    if (Array.isArray(result) || !result.pagination?.hasNextPage) return documents;
  }
  throw new Error('Too many documents to load. Please try again.');
}

export async function getDocumentDownloadUrl(id: string) {
  const result = await protectedRequest<{ downloadUrl?: string; url?: string }>(
    endpoints.documents + '/' + id + '/download-url',
  );
  const url = result.downloadUrl || result.url;
  if (!url || (!url.startsWith('https://') && !url.startsWith('http://')))
    throw new Error('Document preview is unavailable.');
  return url;
}
