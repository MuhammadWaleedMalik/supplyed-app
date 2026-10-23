import { Platform } from 'react-native';
import {
  GoogleSignin,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';
import {
  GOOGLE_WEB_CLIENT_ID,
  GOOGLE_IOS_CLIENT_ID,
} from '../../../constants/env';

export const googleSignInAvailable = Boolean(
  GOOGLE_WEB_CLIENT_ID && (Platform.OS !== 'ios' || GOOGLE_IOS_CLIENT_ID),
);
let configured = false;

export async function chooseGoogleAccount() {
  if (!googleSignInAvailable)
    throw new Error('Google sign-in is unavailable. Please use email.');
  if (!configured) {
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
    });
    configured = true;
  }
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  // Let the user choose an account again after signing out of SupplyEd.
  if (GoogleSignin.getCurrentUser()) await GoogleSignin.signOut();
  const result = await GoogleSignin.signIn();
  if (!isSuccessResponse(result)) return undefined;
  if (!result.data.idToken)
    throw new Error('Google did not return a sign-in token. Please try again.');
  return { credential: result.data.idToken, email: result.data.user.email };
}
