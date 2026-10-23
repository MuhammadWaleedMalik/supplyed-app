import { endpoints } from '../../../constants/endpoints';
import { ApiError, protectedRequest } from '../../../utils/api/request';
import {
  setCurrentSessionUser,
  getSessionVersion,
  assertSessionVersion,
} from '../../../utils/api/session';
import { User } from './authApi';
import { normalizeUkPhone } from '../../../utils/auth/ukPhone';

export type PhoneCodeReply = {
  phone: string;
  expiresInMinutes: number;
  resendAvailableInSeconds: number;
};

export async function sendPhoneCode(phone: string) {
  const version = getSessionVersion();
  const current = await protectedRequest<User>(endpoints.currentUser);
  assertSessionVersion(version);
  setCurrentSessionUser(current);
  if (current.phoneVerified)
    throw new ApiError(
      'This number is verified and cannot be edited.',
      409,
      'PHONE_VERIFIED_LOCKED',
    );
  return protectedRequest<PhoneCodeReply>(endpoints.phoneOtpSend, 'POST', {
    phone: normalizeUkPhone(phone),
  });
}

export async function verifyPhoneCode(otp: string) {
  const version = getSessionVersion();
  const current = await protectedRequest<User>(endpoints.currentUser);
  assertSessionVersion(version);
  if (current.phoneVerified)
    throw new ApiError(
      'This number is verified and cannot be edited. Refresh settings.',
      409,
      'PHONE_VERIFIED_LOCKED',
    );
  if (!/^\d{6}$/.test(otp)) throw new Error('Enter the six-digit code.');
  const user = await protectedRequest<User>(endpoints.phoneOtpVerify, 'POST', {
    otp,
  });
  if (!user.phoneVerified)
    throw new Error('Phone verification was not confirmed. Please retry.');
  setCurrentSessionUser(user);
  return user;
}
