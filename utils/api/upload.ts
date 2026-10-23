import { getSessionVersion } from './session';

export function assertUploadSession(version: number) {
  if (getSessionVersion() !== version)
    throw new Error('Your session changed. Choose the file again.');
}

export async function uploadFile(
  url: string,
  file: Blob,
  headers: Record<string, string>,
  version: number,
  method = 'PUT',
) {
  assertUploadSession(version);
  const uploadMethod = method.toUpperCase();
  if (!['PUT', 'POST'].includes(uploadMethod))
    throw new Error(
      'This upload is unavailable. Please request a new upload link.',
    );
  if (!/^https:\/\//i.test(url) && !(__DEV__ && /^http:\/\//i.test(url)))
    throw new Error('The server returned an invalid upload address.');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);
  try {
    const response = await fetch(url, {
      method: uploadMethod,
      headers,
      body: file,
      signal: controller.signal,
    });
    assertUploadSession(version);
    if (!response.ok)
      throw new Error('The file upload failed. Please try again.');
  } catch (problem) {
    if (controller.signal.aborted)
      throw new Error('The file upload timed out. Please try again.');
    throw problem;
  } finally {
    clearTimeout(timeout);
  }
}
