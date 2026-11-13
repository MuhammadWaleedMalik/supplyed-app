import type { KeyboardTypeOptions } from 'react-native';

/**
 * Phone fields render +44 as a fixed, non-editable prefix. Keep only the UK
 * national part in the editable field, including when a user pastes an E.164
 * or 0044 number. A foreign + prefix is reduced to digits and is rejected by
 * normalizeUkPhone during validation rather than being displayed beside +44.
 */
export function ukPhoneNationalValue(value = '') {
  let national = value.trimStart();
  if (national.startsWith('+44')) national = national.slice(3);
  else if (national.startsWith('0044')) national = national.slice(4);

  national = national.replace(/[^\d\s()-]/g, '').trimStart();
  const digits = national.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('44')) {
    national = digits.slice(2);
  }
  return national.replace(/^0/, '').trimStart();
}

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
