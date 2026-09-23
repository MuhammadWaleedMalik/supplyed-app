import { endpoints } from '../../../constants/endpoints';
import { apiRequest, protectedRequest } from '../../../utils/api/request';
import { saveTokens } from '../../../utils/api/session';

export type User = {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  role?: string;
  emailVerified?: boolean;
  accountStatus?: string;
};

export type AuthActions = {
  onVerification: (email: string, token: string) => void;
  onAuthenticated: (user: User) => Promise<void> | void;
  onTwoFactor: (email: string, token: string) => void;
  onForgotPassword: () => void;
};

export type AuthReply = {
  user?: User;
  accessToken?: string;
  refreshToken?: string;
  tokens?: { accessToken?: string; refreshToken?: string };
  otpToken?: string;
  twoFactorRequired?: boolean;
  twoFactorToken?: string;
};

export function registerAccount(email: string, password: string) {
  return apiRequest<AuthReply>(endpoints.register, 'POST', {
    email: email.trim().toLowerCase(),
    password,
  });
}

export function loginAccount(email: string, password: string) {
  return apiRequest<AuthReply>(endpoints.login, 'POST', {
    email: email.trim().toLowerCase(),
    password,
  });
}

export function resendEmailCode(email: string) {
  return apiRequest<AuthReply>(endpoints.resendCode, 'POST', {
    email: email.trim().toLowerCase(),
  });
}

export async function verifyEmailCode(code: string, otpToken: string) {
  const reply = await apiRequest<AuthReply>(
    endpoints.verifyEmail,
    'POST',
    { otp: code },
    otpToken,
  );
  saveTokens(reply);
  return reply;
}

export async function verifyTwoFactorCode(
  code: string,
  twoFactorToken: string,
) {
  const reply = await apiRequest<AuthReply>(
    endpoints.verifyTwoFactor,
    'POST',
    { code },
    twoFactorToken,
  );
  saveTokens(reply);
  return reply;
}

export function requestPasswordReset(email: string) {
  return apiRequest<{ otpToken: string }>(endpoints.forgotPassword, 'POST', {
    email: email.trim().toLowerCase(),
  });
}

export function resetPassword(
  code: string,
  password: string,
  otpToken: string,
) {
  return apiRequest(
    endpoints.resetPassword,
    'POST',
    { otp: code, password },
    otpToken,
  );
}

export function getCurrentUser() {
  return protectedRequest<User>(endpoints.currentUser);
}

export async function exchangeGoogleToken(credential: string) {
  const reply = await apiRequest<AuthReply>(endpoints.googleExchange, 'POST', {
    credential,
  });
  saveTokens(reply);
  return reply;
}


