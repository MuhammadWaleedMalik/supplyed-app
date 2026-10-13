import { useState } from 'react';
import { resendEmailCode, User, verifyEmailCode } from '../apis/authApi';
import { saveTokens } from '../../../utils/api/session';
import { useAuthAttempt } from '../../../utils/auth/useAuthAttempt';

export function useVerification(
  email: string,
  firstToken: string,
  onAuthenticated: (user: User) => Promise<void> | void,
) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [token, setToken] = useState(firstToken);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const attempt = useAuthAttempt();

  function changeDigit(index: number, value: string) {
    const numbers = value.replace(/\D/g, '');
    setDigits(current => {
      const next = [...current];
      if (numbers.length > 1) {
        numbers.slice(0, 6 - index).split('').forEach((digit, offset) => {
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
    if (code.length !== 6 || !token) {
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
      if (!reply.user)
        throw new Error('The server did not return your account.');
      saveTokens(reply);
      await onAuthenticated(reply.user);
    } catch (problem) {
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
