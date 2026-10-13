import { endpoints } from '../../../constants/endpoints';
import { protectedRequest } from '../../../utils/api/request';
import { findDocument } from '../../../utils/documents/documentUtils';
import { Document, getDocuments } from './documentApi';
import { getSessionVersion } from '../../../utils/api/session';
import { assertUploadSession, uploadFile } from '../../../utils/api/upload';

export async function uploadDocument(
  requirementId: string,
  file: Blob,
  fileName: string,
  contentType: string,
) {
  const version = getSessionVersion();
  const existing = await getDocuments();
  assertUploadSession(version);
  let row = findDocument(requirementId, existing);
  if (!row) {
    row = await protectedRequest<Document>(endpoints.documents, 'POST', {
      requirementId,
    });
  }
  assertUploadSession(version);
  const signed = await protectedRequest<{
    url: string;
    fileKey: string;
    requiredHeaders?: Record<string, string>;
  }>(endpoints.documents + '/' + row.id + '/upload-url', 'POST', {
    contentType,
    sizeBytes: file.size,
  });
  if (!signed.url || !signed.fileKey)
    throw new Error('The backend did not return a signed upload URL.');
  await uploadFile(signed.url, file, { 'Content-Type': contentType, ...signed.requiredHeaders }, version);
  return protectedRequest<Document>(
    endpoints.documents + '/' + row.id + '/upload-complete',
    'POST',
    { fileKey: signed.fileKey, originalName: fileName },
  );
}
