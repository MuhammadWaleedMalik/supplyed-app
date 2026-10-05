import { endpoints } from '../../../constants/endpoints';
import { protectedRequest } from '../../../utils/api/request';
import { setCurrentSessionUser } from '../../../utils/api/session';
import { User } from './authApi';

export type PhoneCodeReply = {
  phone: string;
  expiresInMinutes: number;
  resendAvailableInSeconds: number;
};

export function sendPhoneCode(phone: string) {
  return protectedRequest<PhoneCodeReply>(endpoints.phoneOtpSend, 'POST', {
    phone,
  });
}

export async function verifyPhoneCode(otp: string) {
  const user = await protectedRequest<User>(endpoints.phoneOtpVerify, 'POST', {
    otp,
  });
  setCurrentSessionUser(user);
  return user;
}
