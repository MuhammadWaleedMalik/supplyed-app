import { useState } from 'react';
import { User, verifyTwoFactorCode } from '../apis/authApi';
import { saveTokens } from '../../../utils/api/session';
import { useAuthAttempt } from '../../../utils/auth/useAuthAttempt';

export function useTwoFactor(
  token: string,
  onAuthenticated: (user: User) => Promise<void> | void,
) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const attempt = useAuthAttempt();

  async function verify() {
    const value = code.trim().toUpperCase();
    if (
      !/^\d{6}$/.test(value) &&
      !/^[A-HJ-NP-Z2-9]{4}(-[A-HJ-NP-Z2-9]{4}){3}$/.test(value)
    ) {
      setError('Enter a six-digit code or a recovery code.');
      return;
    }
    if (!token) {
      setError('Please sign in again to request a new challenge.');
      return;
    }
    const active = attempt.begin();
    if (!active) return;
    setLoading(true);
    setError('');
    try {
      const reply = await verifyTwoFactorCode(value, token);
      if (!active()) return;
      if (!reply.user)
        throw new Error('The server did not return your account.');
      await saveTokens(reply);
      await onAuthenticated(reply.user);
    } catch (problem) {
      setError(
        problem instanceof Error ? problem.message : 'Unable to verify code.',
      );
    } finally {
      attempt.finish();
      setLoading(false);
    }
  }

  return { code, setCode, error, loading, verify };
}
