import { endpoints } from '../../../../constants/endpoints';
import { protectedRequest } from '../../../../utils/api/request';
import { getSessionVersion } from '../../../../utils/api/session';
import { uploadFile } from '../../../../utils/api/upload';

export type ProfileDocument = {
  id: string;
  kind: 'CERTIFICATE' | 'ACHIEVEMENT';
  title: string;
  description: string | null;
  issueDate: string | null;
  originalName: string | null;
  contentType: string | null;
  sizeBytes: number | null;
  fileUrl: string | null;
  fileUrlExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export function getProfileDocuments() {
  return protectedRequest<ProfileDocument[]>(endpoints.profileDocuments);
}

export function createProfileDocument(data: {
  title: string;
  description?: string;
  issueDate?: string;
}) {
  return protectedRequest<ProfileDocument>(
    endpoints.profileDocuments,
    'POST',
    data,
  );
}

export function deleteProfileDocument(id: string) {
  return protectedRequest<{ id: string }>(
    endpoints.profileDocuments + '/' + encodeURIComponent(id),
    'DELETE',
  );
}

export function updateProfileDocument(
  id: string,
  data: { title: string; description?: string; issueDate?: string },
) {
  return protectedRequest<ProfileDocument>(
    endpoints.profileDocuments + '/' + encodeURIComponent(id),
    'PATCH',
    data,
  );
}

export async function uploadProfileDocument(
  id: string,
  file: Blob,
  originalName: string,
  contentType: string,
) {
  const version = getSessionVersion();
  const signed = await protectedRequest<{
    url: string;
    fileKey: string;
    method?: string;
    requiredHeaders?: Record<string, string>;
  }>(
    endpoints.profileDocuments + '/' + encodeURIComponent(id) + '/upload-url',
    'POST',
    { contentType, sizeBytes: file.size },
  );
  if (!signed.url || !signed.fileKey)
    throw new Error('The backend did not return a signed upload URL.');
  await uploadFile(
    signed.url,
    file,
    { 'Content-Type': contentType, ...signed.requiredHeaders },
    version,
    signed.method,
  );
  return protectedRequest<ProfileDocument>(
    endpoints.profileDocuments +
      '/' +
      encodeURIComponent(id) +
      '/upload-complete',
    'POST',
    { fileKey: signed.fileKey, originalName },
  );
}
