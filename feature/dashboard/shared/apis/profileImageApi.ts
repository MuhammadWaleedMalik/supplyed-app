import { endpoints } from '../../../../constants/endpoints';
import { protectedRequest } from '../../../../utils/api/request';
import { getSessionVersion } from '../../../../utils/api/session';
import { uploadFile } from '../../../../utils/api/upload';

export type ProfileImage = {
  imageUrl?: string | null;
  url?: string | null;
  fileKey?: string | null;
};

export async function getProfileImage() {
  return protectedRequest<ProfileImage>(endpoints.profileImage);
}

export async function uploadProfileImage(file: Blob, contentType: string) {
  const version = getSessionVersion();
  const signed = await protectedRequest<{
    url: string;
    fileKey: string;
    requiredHeaders?: Record<string, string>;
  }>(endpoints.profileImageUploadUrl, 'POST', {
    contentType,
    sizeBytes: file.size,
  });
  if (!signed.url || !signed.fileKey)
    throw new Error('The backend did not return a profile image upload URL.');
  await uploadFile(signed.url, file, { 'Content-Type': contentType, ...signed.requiredHeaders }, version);
  return protectedRequest<ProfileImage>(endpoints.profileImageComplete, 'POST', {
    fileKey: signed.fileKey,
  });
}
