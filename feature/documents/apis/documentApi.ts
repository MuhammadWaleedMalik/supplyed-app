import { endpoints } from '../../../constants/endpoints';
import { protectedRequest } from '../../../utils/api/request';

export type Requirement = {
  id: string;
  isRequired: boolean;
  requiresReview?: boolean;
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

export async function getRequirements() {
  const items = await protectedRequest<Requirement[]>(endpoints.requirements);
  if (!Array.isArray(items))
    throw new Error('Document requirements are unavailable.');
  for (const item of items) {
    if (!item.id || !item.documentType?.id)
      throw new Error('Document requirements are incomplete.');
    if (
      item.context &&
      item.context !== 'INSTRUCTOR_PROFILE' &&
      item.context !== 'INSTITUTION_PROFILE'
    )
      throw new Error('Unexpected document requirement.');
  }
  return items.filter(
    item => item.isActive !== false && item.documentType.isActive !== false,
  );
}

export async function getDocuments() {
  const documents: Document[] = [];
  for (let page = 1; page <= 20; page++) {
    const result = await protectedRequest<
      | {
          documents: Document[];
          pagination?: { hasNextPage?: boolean };
        }
      | Document[]
    >(endpoints.documents + '?limit=100&page=' + page);
    const items = Array.isArray(result) ? result : result.documents;
    if (!Array.isArray(items))
      throw new Error('Documents could not be loaded.');
    documents.push(
      ...items.filter(item => !item.deletedAt && !item.applicationId),
    );
    if (Array.isArray(result) || !result.pagination?.hasNextPage)
      return documents;
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
