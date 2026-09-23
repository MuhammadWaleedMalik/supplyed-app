import { endpoints } from '../../../constants/endpoints';
import { protectedRequest } from '../../../utils/api/request';

export type TwoFactorStatus = {
  enabled: boolean;
  recoveryCodesRemaining: number;
  setupPending: boolean;
};

export type TwoFactorSetup = {
  secret: string;
  otpAuthUri?: string;
  qrCodeDataUrl?: string;
};

export function getTwoFactorStatus() {
  return protectedRequest<TwoFactorStatus>(endpoints.twoFactorStatus);
}

export function startTwoFactorSetup() {
  return protectedRequest<TwoFactorSetup>(endpoints.twoFactorSetup, 'POST');
}

export function enableTwoFactor(code: string) {
  return protectedRequest<{ recoveryCodes: string[] }>(
    endpoints.twoFactorEnable,
    'POST',
    { code: code.trim() },
  );
}

export function regenerateRecoveryCodes(code: string) {
  return protectedRequest<{ recoveryCodes: string[] }>(
    endpoints.twoFactorRecoveryCodes,
    'POST',
    { code: code.trim() },
  );
}

export function disableTwoFactor(code: string) {
  return protectedRequest<TwoFactorStatus>(
    endpoints.twoFactorDisable,
    'POST',
    { code: code.trim() },
  );
}
