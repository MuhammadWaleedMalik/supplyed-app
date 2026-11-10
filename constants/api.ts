import { Platform } from 'react-native';
import { ANDROID_API_URL, IOS_API_URL } from './env';

export const API_URL =
  Platform.OS === 'android' ? ANDROID_API_URL : IOS_API_URL;

export const SOCKET_ORIGIN = API_URL.replace(/\/api\/?$/, '').replace(
  /\/+$/,
  '',
);
export const SOCKET_PATH = '/api/socket.io';

// Temporary local-distribution setting: Android and iOS use the same LAN API.
// Set this back to false when the production HTTPS endpoint is available.
export const ALLOW_INSECURE_API = true;
