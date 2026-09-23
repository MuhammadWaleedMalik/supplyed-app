import { useState } from 'react';
import { requestPasswordReset, resetPassword } from '../apis/authApi';
import {
  getPasswordChecks,
  isValidEmail,
  passwordsMatch,
} from '../../../utils/auth/authValidation';

export function usePasswordReset() {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function requestCode() {
    if (!isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const reply = await requestPasswordReset(email);
      if (!reply.otpToken)
        throw new Error('The server did not return a reset challenge.');
      setToken(reply.otpToken);
    } catch (problem) {
      setError(
        problem instanceof Error
          ? problem.message
          : 'Unable to request a code.',
      );
    }
    setLoading(false);
  }

  async function submit() {
    if (
      !/^\d{6}$/.test(code) ||
      !getPasswordChecks(password).every(check => check.valid) ||
      !passwordsMatch(password, confirmation)
    ) {
      setError('Enter the six-digit code and matching strong passwords.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await resetPassword(code, password, token);
      setDone(true);
      setToken('');
      setPassword('');
      setConfirmation('');
    } catch (problem) {
      setError(
        problem instanceof Error
          ? problem.message
          : 'Unable to reset password.',
      );
    }
    setLoading(false);
  }

  return {
    email,
    setEmail,
    token,
    code,
    setCode,
    password,
    setPassword,
    confirmation,
    setConfirmation,
    done,
    error,
    loading,
    requestCode,
    submit,
  };
}
