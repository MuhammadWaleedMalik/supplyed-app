import { keepLocalCopy, pick } from '@react-native-documents/picker';
import { createChatAttachment } from '../../constants/conversationsApi';
import { mimeFromName } from './fileUtils';
import { getSessionVersion } from '../api/session';
import { uploadFile } from '../api/upload';

const allowedTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'text/plain',
];

export async function pickChatAttachment(conversationId: string) {
  const sessionVersion = getSessionVersion();
  const [picked] = await pick({ type: allowedTypes });
  if (picked.error) throw new Error(picked.error);
  const name = (picked.name || '').replace(/[\\/\r\n]/g, '').trim();
  const mime =
    picked.type && picked.type !== 'application/octet-stream'
      ? picked.type
      : mimeFromName(name);
  if (!name || name.length > 200)
    throw new Error('Choose a file with a name of 1 to 200 characters.');
  if (!allowedTypes.includes(mime))
    throw new Error('Choose a PDF, Word, JPEG, PNG or text file.');
  if (picked.size !== null && (picked.size < 1 || picked.size > 10485760))
    throw new Error('Files must be between 1 byte and 10 MB.');
  const [copy] = await keepLocalCopy({
    files: [{ uri: picked.uri, fileName: name }],
    destination: 'cachesDirectory',
  });
  if (copy.status !== 'success')
    throw new Error('Unable to read this file. Please choose it again.');
  const response = await fetch(copy.localUri);
  const bytes = await response.blob();
  if (getSessionVersion() !== sessionVersion)
    throw new Error('Your session changed. Choose the file again.');
  if (bytes.size < 1 || bytes.size > 10485760)
    throw new Error('Files must be between 1 byte and 10 MB.');
  const prepared = await createChatAttachment(
    conversationId,
    name,
    mime,
    bytes.size,
  );
  if (getSessionVersion() !== sessionVersion)
    throw new Error('Your session changed. Choose the file again.');
  // S3 needs raw bytes and the exact signed headers, never our API bearer token.
  await uploadFile(prepared.upload.url, bytes, prepared.upload.requiredHeaders, sessionVersion);
  return prepared.attachment;
}
