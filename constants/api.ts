import { Platform } from 'react-native';
import { ANDROID_API_URL, IOS_API_URL } from './env';

export const API_URL =
  Platform.OS === 'android' ? ANDROID_API_URL : IOS_API_URL;
