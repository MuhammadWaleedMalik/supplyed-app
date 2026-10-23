import { useState } from 'react';
import { resendEmailCode, User, verifyEmailCode } from '../apis/authApi';
import { saveTokens } from '../../../utils/api/session';
import { useAuthAttempt } from '../../../utils/auth/useAuthAttempt';

export function useVerification(
  email: string,
  firstToken: string,
  onAuthenticated: (user: User) => Promise<void> | void,
  onTwoFactor: (email: string, token: string) => void,
) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [token, setToken] = useState(firstToken);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const attempt = useAuthAttempt();

  function changeDigit(index: number, value: string) {
    if (!/^\d*$/.test(value) || value.length > 6 - index) {
      setDigits(['', '', '', '', '', '']);
      setError('Enter exactly six digits. The pasted code was not accepted.');
      return;
    }
    setError('');
    const numbers = value;
    setDigits(current => {
      const next = [...current];
      if (numbers.length > 1) {
        numbers.split('').forEach((digit, offset) => {
          next[index + offset] = digit;
        });
        return next;
      }
      next[index] = numbers;
      return next;
    });
  }

  async function verify() {
    const code = digits.join('');
    if (!/^\d{6}$/.test(code) || !token) {
      setError('Enter the six-digit code from your email.');
      return;
    }
    const active = attempt.begin();
    if (!active) return;
    setLoading(true);
    setError('');
    try {
      const reply = await verifyEmailCode(code, token);
      if (!active()) return;
      if (reply.twoFactorRequired) {
        if (!reply.twoFactorToken)
          throw new Error('The server did not return a two-factor challenge.');
        onTwoFactor(email, reply.twoFactorToken);
        return;
      }
      if (!reply.user)
        throw new Error('The server did not return your account.');
      await saveTokens(reply);
      await onAuthenticated(reply.user);
    } catch (problem) {
      if (!active()) return;
      setError(
        problem instanceof Error ? problem.message : 'Unable to verify email.',
      );
    } finally {
      attempt.finish();
      setLoading(false);
    }
  }

  async function resend() {
    const active = attempt.begin();
    if (!active) return;
    setLoading(true);
    setError('');
    try {
      const reply = await resendEmailCode(email);
      if (!active()) return;
      if (reply.emailVerified) {
        setToken('');
        setDigits(['', '', '', '', '', '']);
        setError('Your email is already verified. Return to login to sign in.');
        return;
      }
      if (!reply.otpToken) throw new Error('A new code was not returned.');
      setToken(reply.otpToken);
      setDigits(['', '', '', '', '', '']);
    } catch (problem) {
      if (!active()) return;
      setError(
        problem instanceof Error ? problem.message : 'Unable to resend code.',
      );
    } finally {
      attempt.finish();
      setLoading(false);
    }
  }

  return { digits, changeDigit, error, loading, verify, resend };
}
