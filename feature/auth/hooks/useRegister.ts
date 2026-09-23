import { useState } from 'react';
import { registerAccount, resendEmailCode } from '../apis/authApi';
import { ApiError } from '../../../utils/api/request';
import {
  canRegister,
  getPasswordChecks,
  isValidEmail,
  passwordsMatch,
} from '../../../utils/auth/authValidation';

export function useRegister(
  onVerification: (email: string, token: string) => void,
) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmationTouched, setConfirmationTouched] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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
    setEmailTouched(true);
    setPasswordTouched(true);
    setConfirmationTouched(true);
    if (!canRegister(email, password, confirmation)) return;
    if (!agreed) {
      setError('Agree to the terms before creating an account.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const reply = await registerAccount(email, password);
      if (!reply.otpToken)
        throw new Error('No verification code was returned.');
      onVerification(email.trim().toLowerCase(), reply.otpToken);
    } catch (problem) {
      if (problem instanceof ApiError && problem.status === 409) {
        try {
          const challenge = await resendEmailCode(email);
          if (challenge.otpToken)
            onVerification(email.trim().toLowerCase(), challenge.otpToken);
          else setError('This email is already registered. Log in instead.');
        } catch (resendError) {
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
    }
    setLoading(false);
  }

  return {
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
