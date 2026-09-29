import { endpoints } from '../../../../constants/endpoints';
import { protectedRequest } from '../../../../utils/api/request';

export type ProfileImage = {
  imageUrl?: string | null;
  url?: string | null;
  fileKey?: string | null;
};

export async function getProfileImage() {
  return protectedRequest<ProfileImage>(endpoints.profileImage);
}

export async function uploadProfileImage(file: Blob, contentType: string) {
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
  const upload = await fetch(signed.url, {
    method: 'PUT',
    headers: { 'Content-Type': contentType, ...signed.requiredHeaders },
    body: file,
  });
  if (!upload.ok) throw new Error('Profile image upload failed.');
  return protectedRequest<ProfileImage>(endpoints.profileImageComplete, 'POST', {
    fileKey: signed.fileKey,
  });
}
