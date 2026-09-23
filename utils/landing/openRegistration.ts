import { Linking } from 'react-native';
import { FOUNDING_SCHOOLS_URL } from '../../constants/links';

export async function openRegistration() {
  try {
    await Linking.openURL(FOUNDING_SCHOOLS_URL);
  } catch {
    return undefined;
  }
}

