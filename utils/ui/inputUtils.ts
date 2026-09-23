import { KeyboardTypeOptions } from 'react-native';

export function getKeyboardType(
  email?: boolean,
  phone?: boolean,
  number?: boolean,
  url?: boolean,
): KeyboardTypeOptions {
  if (email) return 'email-address';
  if (phone) return 'phone-pad';
  if (number) return 'number-pad';
  if (url) return 'url';
  return 'default';
}
