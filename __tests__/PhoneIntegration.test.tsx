import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { endpoints } from '../constants/endpoints';
import { User } from '../feature/auth/apis/authApi';
import { usePhoneVerification } from '../feature/auth/hooks/usePhoneVerification';
import {
  fieldsFromSettings,
  saveProfileSettings,
} from '../feature/dashboard/shared/apis/settingsApi';
import { saveOnboardingAccount } from '../feature/onboarding/apis/profileApi';
import { useOnboarding } from '../feature/onboarding/hooks/useOnboarding';
import { ApiError, protectedRequest } from '../utils/api/request';
import {
  clearTokens,
  getCurrentSessionUser,
  setCurrentSessionUser,
} from '../utils/api/session';
import { initialData } from '../utils/onboarding/onboardingData';

jest.mock('../utils/api/request', () => ({
  ...jest.requireActual('../utils/api/request'),
  protectedRequest: jest.fn(),
}));

const request = protectedRequest as jest.MockedFunction<
  typeof protectedRequest
>;
const user: User = {
  id: 'user-1',
  email: 'teacher@example.com',
  name: 'Sam Teacher',
  phone: '+447911123456',
  phoneVerified: false,
  role: 'INSTRUCTOR',
};
const sent = {
  phone: '+447911123456',
  expiresInMinutes: 10,
  resendAvailableInSeconds: 60,
};

let renderer: ReactTestRenderer | undefined;
let phone: ReturnType<typeof usePhoneVerification>;
let onboarding: ReturnType<typeof useOnboarding>;

function PhoneHarness({
  account,
  onVerified,
}: {
  account: User;
  onVerified: (verified: User) => void;
}) {
  phone = usePhoneVerification(account, onVerified);
  return null;
}

function OnboardingHarness({ onContinue }: { onContinue: () => void }) {
  onboarding = useOnboarding('school', jest.fn(), onContinue);
  return null;
}

beforeEach(() => {
  request.mockReset();
  clearTokens();
  jest.useFakeTimers({ now: new Date('2026-10-05T12:00:00Z') });
});

afterEach(async () => {
  if (renderer) await act(async () => renderer?.unmount());
  renderer = undefined;
  jest.useRealTimers();
});

async function mountPhone(account = user, onVerified = jest.fn()) {
  await act(async () => {
    renderer = create(
      <PhoneHarness account={account} onVerified={onVerified} />,
    );
  });
  return onVerified;
}

describe('phone SMS verification', () => {
  it('refreshes the current user when sending reports an already verified phone', async () => {
    const onVerified = await mountPhone();
    const verified = { ...user, phoneVerified: true };
    request
      .mockRejectedValueOnce(
        new ApiError('This phone number is already verified', 409),
      )
      .mockResolvedValueOnce(verified);
    await act(async () => phone.send());
    expect(request).toHaveBeenLastCalledWith(endpoints.currentUser);
    expect(getCurrentSessionUser()).toEqual(verified);
    expect(onVerified).toHaveBeenCalledWith(verified);
    expect(phone.sentPhone).toBe('');
    expect(phone.error).toBe('');
  });

  it('uses the backend normalized number, cooldown, and returned verified user', async () => {
    const onVerified = await mountPhone({ ...user, phone: '+44 7911 123456' });
    request.mockResolvedValueOnce(sent);
    await act(async () => phone.send());

    expect(request).toHaveBeenCalledWith(endpoints.phoneOtpSend, 'POST', {
      phone: '+44 7911 123456',
    });
    expect(phone.phone).toBe(sent.phone);
    expect(phone.resendSeconds).toBe(60);
    expect(phone.expirySeconds).toBe(600);
    await act(async () => phone.send());
    expect(request).toHaveBeenCalledTimes(1);

    await act(async () => phone.changeCode('12a345678'));
    expect(phone.code).toBe('123456');
    expect(phone.canVerify).toBe(true);
    const verified = { ...user, phoneVerified: true };
    request.mockResolvedValueOnce(verified);
    await act(async () => phone.verify());

    expect(request).toHaveBeenLastCalledWith(endpoints.phoneOtpVerify, 'POST', {
      otp: '123456',
    });
    expect(getCurrentSessionUser()).toEqual(verified);
    expect(onVerified).toHaveBeenCalledWith(verified);
    await act(async () => {
      renderer?.update(
        <PhoneHarness account={verified} onVerified={onVerified} />,
      );
    });
    expect(phone.verified).toBe(true);
  });

  it('requires six digits before verification', async () => {
    await mountPhone();
    request.mockResolvedValueOnce(sent);
    await act(async () => phone.send());
    await act(async () => phone.changeCode('12345'));
    await act(async () => phone.verify());
    expect(phone.canVerify).toBe(false);
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('invalidates the code after phone editing and keeps the resend cooldown', async () => {
    await mountPhone();
    request.mockResolvedValueOnce(sent);
    await act(async () => phone.send());
    await act(async () => phone.changeCode('123456'));
    await act(async () => phone.changePhone('+447911111111'));
    expect(phone.code).toBe('');
    expect(phone.sentPhone).toBe('');
    expect(phone.canVerify).toBe(false);
    expect(phone.resendSeconds).toBe(60);
    await act(async () => phone.verify());
    await act(async () => phone.send());
    expect(request).toHaveBeenCalledTimes(1);

    await act(async () => jest.advanceTimersByTime(60000));
    request.mockResolvedValueOnce({ ...sent, phone: '+447911111111' });
    await act(async () => phone.send());
    expect(request).toHaveBeenLastCalledWith(endpoints.phoneOtpSend, 'POST', {
      phone: '+447911111111',
    });
    expect(phone.sentPhone).toBe('+447911111111');
  });

  it('blocks expired codes and allows sending a new code', async () => {
    await mountPhone();
    request.mockResolvedValueOnce(sent);
    await act(async () => phone.send());
    await act(async () => phone.changeCode('123456'));
    await act(async () => jest.advanceTimersByTime(600000));
    expect(phone.expirySeconds).toBe(0);
    expect(phone.canVerify).toBe(false);
    await act(async () => phone.verify());
    expect(request).toHaveBeenCalledTimes(1);
    request.mockResolvedValueOnce(sent);
    await act(async () => phone.send());
    expect(phone.expirySeconds).toBe(600);
    expect(phone.code).toBe('');
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('shows wrong-code errors without changing the current user', async () => {
    setCurrentSessionUser(user);
    const onVerified = await mountPhone();
    request.mockResolvedValueOnce(sent);
    await act(async () => phone.send());
    await act(async () => phone.changeCode('111111'));
    request.mockRejectedValueOnce(
      new Error('Invalid or expired verification code.'),
    );
    await act(async () => phone.verify());
    expect(phone.error).toBe('Invalid or expired verification code.');
    expect(getCurrentSessionUser()).toEqual(user);
    expect(onVerified).not.toHaveBeenCalled();
  });

  it('prevents duplicate requests before a pending send finishes', async () => {
    await mountPhone();
    request.mockResolvedValueOnce(sent);
    await act(async () => {
      await Promise.all([phone.send(), phone.send()]);
    });
    expect(request).toHaveBeenCalledTimes(1);
  });
});

describe('phone saving boundaries', () => {
  it('never saves phone through general settings, even if extra fields are supplied', async () => {
    const snapshot = {
      user,
      profile: { id: 'profile-1', fullName: 'Sam Teacher' },
    };
    const fields = { ...fieldsFromSettings(snapshot), phone: '+447911111111' };
    request
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(user)
      .mockResolvedValueOnce(snapshot.profile);
    await saveProfileSettings('teacher', snapshot, fields);
    expect(request).toHaveBeenCalledWith(endpoints.userBasics, 'PATCH', {
      name: 'Sam Teacher',
    });
    const accountPatch = request.mock.calls.find(
      ([path, method]) => path === endpoints.userBasics && method === 'PATCH',
    );
    expect(accountPatch?.[2]).not.toHaveProperty('phone');
  });

  it('keeps an existing verified phone when onboarding entered another number', async () => {
    const verified = { ...user, phoneVerified: true };
    request
      .mockResolvedValueOnce(verified)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(verified);
    const result = await saveOnboardingAccount({
      ...initialData,
      fullName: 'Sam Teacher',
      phone: '+447911111111',
    });
    expect(request).toHaveBeenCalledWith(endpoints.userBasics, 'PATCH', {
      name: 'Sam Teacher',
    });
    expect(result.phone).toBe(verified.phone);
    expect(result.phoneVerified).toBe(true);
  });

  it('saves the first unverified onboarding phone for the created-profile card', async () => {
    request
      .mockResolvedValueOnce(user)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(user);
    await saveOnboardingAccount({
      ...initialData,
      fullName: 'Sam Teacher',
      phone: user.phone || '',
    });
    expect(request).toHaveBeenCalledWith(endpoints.userBasics, 'PATCH', {
      name: 'Sam Teacher',
      phone: user.phone,
    });
  });
});

describe('created-profile onboarding', () => {
  it('retries signatory email without creating another profile or continuing early', async () => {
    setCurrentSessionUser(user);
    const onContinue = jest.fn();
    let signatoryAttempts = 0;
    request.mockImplementation(async (path, method) => {
      if (path === endpoints.currentUser) return user;
      if (path === endpoints.schoolProfile && method === 'POST')
        return { id: 'school-1' };
      if (path === endpoints.schoolSignatoryApproval) {
        signatoryAttempts += 1;
        if (signatoryAttempts === 1)
          throw new Error('Email service unavailable.');
        return { id: 'approval-1' };
      }
      return undefined;
    });
    await act(async () => {
      renderer = create(<OnboardingHarness onContinue={onContinue} />);
    });
    await act(async () => onboarding.update('institutionType', 'MAT school'));
    await act(async () => onboarding.createProfile());
    expect(onboarding.profileCreated).toBe(true);
    expect(onboarding.signatoryError).toBe('Email service unavailable.');
    expect(onContinue).not.toHaveBeenCalled();
    await act(async () => onboarding.continueToDocuments());
    expect(onContinue).not.toHaveBeenCalled();
    await act(async () => onboarding.createProfile());
    await act(async () => onboarding.sendSignatoryEmail());
    await act(async () => onboarding.continueToDocuments());
    expect(onContinue).toHaveBeenCalledWith('school');
    expect(
      request.mock.calls.filter(
        ([path, method]) =>
          path === endpoints.schoolProfile && method === 'POST',
      ),
    ).toHaveLength(1);
    expect(
      request.mock.calls.some(([path]) => path === endpoints.schoolStatus),
    ).toBe(false);
  });

  it('reconciles an uncertain creation before retrying the request', async () => {
    setCurrentSessionUser(user);
    const onContinue = jest.fn();
    request.mockImplementation(async (path, method) => {
      if (path === endpoints.currentUser) return user;
      if (path === endpoints.schoolProfile && method === 'POST') {
        throw new Error('Connection interrupted.');
      }
      if (path === endpoints.schoolMe) return { id: 'school-1' };
      return undefined;
    });
    await act(async () => {
      renderer = create(<OnboardingHarness onContinue={onContinue} />);
    });
    await act(async () => onboarding.createProfile());
    expect(onboarding.profileCreated).toBe(false);
    await act(async () => onboarding.createProfile());
    expect(onboarding.profileCreated).toBe(true);
    expect(request).toHaveBeenCalledWith(endpoints.schoolMe);
    expect(
      request.mock.calls.filter(
        ([path, method]) =>
          path === endpoints.schoolProfile && method === 'POST',
      ),
    ).toHaveLength(1);
    expect(onContinue).not.toHaveBeenCalled();
  });
});
