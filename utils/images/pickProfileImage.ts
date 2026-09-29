import { errorCodes, isErrorWithCode, pick } from '@react-native-documents/picker';

export function imagePickWasCancelled(error: unknown) {
  return isErrorWithCode(error) && error.code === errorCodes.OPERATION_CANCELED;
}

export async function pickProfileImage() {
  const [picked] = await pick({ type: ['image/jpeg', 'image/png', 'image/webp'] });
  if (picked.error) throw new Error(picked.error);
  const name = (picked.name || 'profile-image').replace(/[\\/\r\n]/g, '').trim();
  const mime = picked.type || 'image/jpeg';
  if (!mime.startsWith('image/')) throw new Error('Choose an image file.');
  if (picked.size !== null && picked.size > 5 * 1024 * 1024)
    throw new Error('Choose an image under 5MB.');
  const response = await fetch(picked.uri);
  if (!response.ok) throw new Error('Unable to read the image.');
  const file = await response.blob();
  if (file.size === 0 || file.size > 5 * 1024 * 1024)
    throw new Error('Choose an image under 5MB.');
  return { file, name, mime };
}
