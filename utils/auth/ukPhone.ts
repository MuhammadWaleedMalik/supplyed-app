import { parsePhoneNumberFromString } from 'libphonenumber-js/max';

export function normalizeUkPhone(value: string) {
  if (!/^[+()\d\s-]+$/.test(value.trim()))
    throw new Error('Enter a valid UK phone number.');
  const text = value.trim().startsWith('0044')
    ? '+44' + value.trim().slice(4)
    : value.trim();
  const phone = parsePhoneNumberFromString(text, 'GB');
  if (!phone || phone.country !== 'GB' || !phone.isValid())
    throw new Error(
      'Enter a valid UK phone number. Foreign numbers are not supported.',
    );
  return phone.number;
}
