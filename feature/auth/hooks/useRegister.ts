import { useState } from 'react';
import { registerAccount, resendEmailCode } from '../apis/authApi';
import { ApiError } from '../../../utils/api/request';
import { AccountType } from '../../../utils/onboarding/onboardingData';
import { useAuthAttempt } from '../../../utils/auth/useAuthAttempt';
import { setSessionPersistence } from '../../../utils/api/session';
import {
  canRegister,
  getPasswordChecks,
  isValidEmail,
  passwordsMatch,
} from '../../../utils/auth/authValidation';

export function useRegister(
  onVerification: (email: string, token: string) => void,
) {
  const [type, setType] = useState<AccountType | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmationTouched, setConfirmationTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const attempt = useAuthAttempt();
  const [agreed, setAgreed] = useState(false);
  const checks = getPasswordChecks(password);
  const emailError =
    emailTouched && !isValidEmail(email)
      ? 'Enter a valid email address.'
      : undefined;
  const confirmationError =
    confirmationTouched && !passwordsMatch(password, confirmation)
      ? 'Passwords do not match.'
      : undefined;

  async function submit() {
    setSubmitted(true);
    setEmailTouched(true);
    setPasswordTouched(true);
    setConfirmationTouched(true);
    if (!type) {
      setError('Choose whether you are a teacher or a school.');
      return;
    }
    if (!canRegister(email, password, confirmation)) return;
    if (!agreed) {
      setError('Agree to the terms before creating an account.');
      return;
    }
    const active = attempt.begin();
    if (!active) return;
    setLoading(true);
    setError('');
    try {
      const reply = await registerAccount(email, password, type);
      if (!active()) return;
      if (!reply.otpToken)
        throw new Error('No verification code was returned.');
      setSessionPersistence(true);
      onVerification(email.trim().toLowerCase(), reply.otpToken);
    } catch (problem) {
      if (!active()) return;
      if (problem instanceof ApiError && problem.status === 409) {
        try {
          const challenge = await resendEmailCode(email);
          if (!active()) return;
          if (challenge.otpToken) {
            setSessionPersistence(true);
            onVerification(email.trim().toLowerCase(), challenge.otpToken);
          } else setError('This email is already registered. Log in instead.');
        } catch (resendError) {
          if (!active()) return;
          setError(
            resendError instanceof Error
              ? resendError.message
              : 'Unable to resend code.',
          );
        }
      } else {
        setError(
          problem instanceof Error ? problem.message : 'Unable to register.',
        );
      }
    } finally {
      attempt.finish();
      setLoading(false);
    }
  }

  return {
    type,
    setType,
    email,
    setEmail,
    password,
    setPassword,
    confirmation,
    setConfirmation,
    emailTouched,
    setEmailTouched,
    passwordTouched,
    setPasswordTouched,
    confirmationTouched,
    setConfirmationTouched,
    submitted,
    emailError,
    confirmationError,
    checks,
    error,
    loading,
    agreed,
    setAgreed,
    submit,
  };
}
