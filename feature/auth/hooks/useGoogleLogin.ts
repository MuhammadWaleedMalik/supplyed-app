import { useState } from 'react';
import { chooseGoogleAccount } from '../apis/googleApi';
import {
  AuthActions,
  exchangeGoogleToken,
  resendEmailCode,
} from '../apis/authApi';
import { AccountType } from '../../../utils/onboarding/onboardingData';
import { saveTokens, setSessionPersistence } from '../../../utils/api/session';
import { useAuthAttempt } from '../../../utils/auth/useAuthAttempt';

export function useGoogleLogin(
  actions: AuthActions,
  role?: AccountType | null,
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const attempt = useAuthAttempt();

  async function signIn() {
    const active = attempt.begin();
    if (!active) return;
    setLoading(true);
    setError('');
    try {
      const account = await chooseGoogleAccount();
      if (!account || !active()) return;
      const reply = await exchangeGoogleToken(
        account.credential,
        role || undefined,
      );
      if (!active()) return;
      setSessionPersistence(true);
      if (reply.twoFactorRequired) {
        if (!reply.twoFactorToken)
          throw new Error('The server did not return a two-factor challenge.');
        actions.onTwoFactor(account.email, reply.twoFactorToken);
      } else if (reply.otpToken) {
        actions.onVerification(account.email, reply.otpToken);
      } else if (reply.user?.emailVerified === false) {
        const challenge = await resendEmailCode(account.email);
        if (!active()) return;
        if (!challenge.otpToken)
          throw new Error('A verification code was not returned.');
        actions.onVerification(account.email, challenge.otpToken);
      } else {
        if (!reply.user)
          throw new Error('The server did not return your account.');
        await saveTokens(reply);
        await actions.onAuthenticated(reply.user);
      }
    } catch (problem) {
      if (active())
        setError(
          problem instanceof Error
            ? problem.message
            : 'Unable to sign in with Google.',
        );
    } finally {
      attempt.finish();
      setLoading(false);
    }
  }
  return { signIn, loading, error };
}
