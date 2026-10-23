import { useState } from 'react';
import { loginAccount, resendEmailCode, User } from '../apis/authApi';
import { saveTokens, setSessionPersistence } from '../../../utils/api/session';
import { ApiError } from '../../../utils/api/request';
import {
  isValidEmail,
  isValidLoginPassword,
} from '../../../utils/auth/authValidation';
import { useAuthAttempt } from '../../../utils/auth/useAuthAttempt';

export function useLogin(
  onVerification: (email: string, token: string) => void,
  onAuthenticated: (user: User) => Promise<void> | void,
  onTwoFactor: (email: string, token: string) => void,
) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(true);
  const attempt = useAuthAttempt();

  async function submit() {
    if (!isValidEmail(email) || !isValidLoginPassword(password)) {
      setError('Enter your email and password.');
      return;
    }
    const active = attempt.begin();
    if (!active) return;
    setLoading(true);
    setError('');
    try {
      const reply = await loginAccount(email, password);
      if (!active()) return;
      setSessionPersistence(remember);
      if (reply.twoFactorRequired && !reply.twoFactorToken)
        throw new Error('The server did not return a two-factor challenge.');
      if (reply.twoFactorRequired && reply.twoFactorToken) {
        onTwoFactor(email, reply.twoFactorToken);
      } else if (reply.otpToken) {
        onVerification(email, reply.otpToken);
      } else if (reply.user?.emailVerified === false) {
        const challenge = await resendEmailCode(email);
        if (!active()) return;
        if (challenge.otpToken) onVerification(email, challenge.otpToken);
        else setError('A verification code was not returned.');
      } else if (reply.user) {
        await saveTokens(reply);
        await onAuthenticated(reply.user);
      } else {
        setError('The server did not return your account.');
      }
    } catch (problem) {
      if (!active()) return;
      if (
        problem instanceof ApiError &&
        problem.status === 403 &&
        (problem.code.includes('EMAIL') ||
          problem.message.toLowerCase().includes('verif'))
      ) {
        try {
          const challenge = await resendEmailCode(email);
          if (!active()) return;
          setSessionPersistence(remember);
          if (challenge.otpToken) onVerification(email, challenge.otpToken);
          else setError('A verification code was not returned.');
        } catch (resendError) {
          setError(
            resendError instanceof Error
              ? resendError.message
              : 'Unable to resend code.',
          );
        }
      } else {
        setError(
          problem instanceof Error ? problem.message : 'Unable to log in.',
        );
      }
    } finally {
      attempt.finish();
      setLoading(false);
    }
  }

  return {
    email,
    setEmail,
    password,
    setPassword,
    remember,
    setRemember,
    error,
    loading,
    submit,
  };
}
