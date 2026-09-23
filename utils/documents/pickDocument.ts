import {
  errorCodes,
  isErrorWithCode,
  pick,
} from '@react-native-documents/picker';
import { Requirement } from '../../feature/documents/apis/documentApi';
import { mimeFromName } from './fileUtils';

export function pickWasCancelled(error: unknown) {
  return isErrorWithCode(error) && error.code === errorCodes.OPERATION_CANCELED;
}

export async function pickDocument(requirement: Requirement) {
  const [picked] = await pick();
  if (picked.error) throw new Error(picked.error);
  const name = (picked.name || 'document').replace(/[\\/\r\n]/g, '').trim().slice(0, 255);
  let mime = picked.type || '';
  if (!mime || mime === 'application/octet-stream') mime = mimeFromName(name);
  if (!mime) throw new Error('The document type could not be identified.');
  const allowed = requirement.documentType.allowedMimes || [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  if (!allowed.includes(mime))
    throw new Error('This document type is not allowed.');
  const limit = requirement.documentType.maxSizeBytes || 10 * 1024 * 1024;
  if (picked.size !== null && (picked.size === 0 || picked.size > limit))
    throw new Error('The document is empty or too large.');
  const response = await fetch(picked.uri);
  if (!response.ok) throw new Error('Unable to read the selected document.');
  const file = await response.blob();
  if (file.size === 0 || file.size > limit)
    throw new Error('The document is empty or too large.');
  return { file, name, mime };
}
