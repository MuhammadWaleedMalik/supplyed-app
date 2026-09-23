import { useState } from 'react';
import { User, verifyTwoFactorCode } from '../apis/authApi';

export function useTwoFactor(
  token: string,
  onAuthenticated: (user: User) => Promise<void> | void,
) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function verify() {
    const value = code.trim().toUpperCase();
    if (
      !/^\d{6}$/.test(value) &&
      !/^[A-HJ-NP-Z2-9]{4}(-[A-HJ-NP-Z2-9]{4}){3}$/.test(value)
    ) {
      setError('Enter a six-digit code or a recovery code.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const reply = await verifyTwoFactorCode(value, token);
      if (!reply.user)
        throw new Error('The server did not return your account.');
      await onAuthenticated(reply.user);
    } catch (problem) {
      setError(
        problem instanceof Error ? problem.message : 'Unable to verify code.',
      );
    }
    setLoading(false);
  }

  return { code, setCode, error, loading, verify };
}

