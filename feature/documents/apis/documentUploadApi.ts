import { endpoints } from '../../../constants/endpoints';
import { protectedRequest } from '../../../utils/api/request';
import { findDocument } from '../../../utils/documents/documentUtils';
import { Document, getDocuments } from './documentApi';

export async function uploadDocument(
  requirementId: string,
  file: Blob,
  fileName: string,
  contentType: string,
) {
  const existing = await getDocuments();
  let row = findDocument(requirementId, existing);
  if (!row) {
    row = await protectedRequest<Document>(endpoints.documents, 'POST', {
      requirementId,
    });
  }
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
  const upload = await fetch(signed.url, {
    method: 'PUT',
    headers: { 'Content-Type': contentType, ...signed.requiredHeaders },
    body: file,
  });
  if (!upload.ok)
    throw new Error('The document upload failed. Please try again.');
  return protectedRequest<Document>(
    endpoints.documents + '/' + row.id + '/upload-complete',
    'POST',
    { fileKey: signed.fileKey, originalName: fileName },
  );
}
