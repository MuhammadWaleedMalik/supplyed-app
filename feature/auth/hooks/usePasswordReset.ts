import { useState } from 'react';
import { requestPasswordReset, resetPassword } from '../apis/authApi';
import { useAuthAttempt } from '../../../utils/auth/useAuthAttempt';
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
  const attempt = useAuthAttempt();

  async function requestCode() {
    if (!isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }
    const active = attempt.begin();
    if (!active) return;
    setLoading(true);
    setError('');
    try {
      const reply = await requestPasswordReset(email);
      if (!active()) return;
      if (!reply.otpToken)
        throw new Error('The server did not return a reset challenge.');
      setToken(reply.otpToken);
      setCode('');
    } catch (problem) {
      setError(
        problem instanceof Error
          ? problem.message
          : 'Unable to request a code.',
      );
    } finally {
      attempt.finish();
      setLoading(false);
    }
  }

  function changeCode(index: number, value: string) {
    if (!/^\d*$/.test(value) || value.length > 6 - index) {
      setCode('');
      setError('Enter exactly six digits. The pasted code was not accepted.');
      return;
    }
    setError('');
    const numbers = value;
    setCode(current => {
      const digits = current.padEnd(6, ' ').split('');
      for (let offset = 0; offset < numbers.length; offset++) {
        if (index + offset < 6) digits[index + offset] = numbers[offset];
      }
      if (!numbers) digits[index] = ' ';
      return digits.join('');
    });
  }

  async function submit() {
    if (
      !token ||
      !/^\d{6}$/.test(code) ||
      !getPasswordChecks(password).every(check => check.valid) ||
      !passwordsMatch(password, confirmation)
    ) {
      setError('Enter the six-digit code and matching strong passwords.');
      return;
    }
    const active = attempt.begin();
    if (!active) return;
    setLoading(true);
    setError('');
    try {
      await resetPassword(code, password, token);
      if (!active()) return;
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
    } finally {
      attempt.finish();
      setLoading(false);
    }
  }

  return {
    email,
    setEmail,
    token,
    code,
    digits: code
      .padEnd(6, ' ')
      .split('')
      .map(item => (item === ' ' ? '' : item)),
    changeCode,
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
