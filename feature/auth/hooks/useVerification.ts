import { useState } from 'react';
import { resendEmailCode, User, verifyEmailCode } from '../apis/authApi';

export function useVerification(
  email: string,
  firstToken: string,
  onAuthenticated: (user: User) => Promise<void> | void,
) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [token, setToken] = useState(firstToken);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    setLoading(true);
    setError('');
    try {
      const reply = await verifyEmailCode(code, token);
      if (!reply.user)
        throw new Error('The server did not return your account.');
      await onAuthenticated(reply.user);
    } catch (problem) {
      setError(
        problem instanceof Error ? problem.message : 'Unable to verify email.',
      );
    }
    setLoading(false);
  }

  async function resend() {
    setLoading(true);
    setError('');
    try {
      const reply = await resendEmailCode(email);
      if (!reply.otpToken) throw new Error('A new code was not returned.');
      setToken(reply.otpToken);
      setDigits(['', '', '', '', '', '']);
    } catch (problem) {
      setError(
        problem instanceof Error ? problem.message : 'Unable to resend code.',
      );
    }
    setLoading(false);
  }

  return { digits, changeDigit, error, loading, verify, resend };
}
