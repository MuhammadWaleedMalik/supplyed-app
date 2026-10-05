import { useEffect, useRef, useState } from 'react';
import { getCurrentUser, User } from '../apis/authApi';
import { ApiError } from '../../../utils/api/request';
import { sendPhoneCode, verifyPhoneCode } from '../apis/phoneApi';

export function usePhoneVerification(
  user: User | undefined,
  onVerified: (user: User) => void,
) {
  const savedPhone = user?.phone || '';
  const savedVerified = user?.phoneVerified === true;
  const userId = user?.id;
  const [phone, setPhone] = useState(savedPhone);
  const [code, setCode] = useState('');
  const [sentPhone, setSentPhone] = useState('');
  const [resendAt, setResendAt] = useState(0);
  const [expiresAt, setExpiresAt] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const requestRunning = useRef(false);

  const verified = savedVerified && phone.trim() === savedPhone;
  const resendSeconds = Math.max(0, Math.ceil((resendAt - now) / 1000));
  const expirySeconds = Math.max(0, Math.ceil((expiresAt - now) / 1000));
  const canVerify = Boolean(
    user &&
      !loading &&
      sentPhone === phone &&
      code.length === 6 &&
      expirySeconds > 0,
  );

  useEffect(() => {
    setPhone(savedPhone);
    setCode('');
    setSentPhone('');
    setResendAt(0);
    setExpiresAt(0);
    setError('');
  }, [savedPhone, savedVerified, userId]);

  useEffect(() => {
    if (!resendAt && !expiresAt) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [resendAt, expiresAt]);

  function changePhone(value: string) {
    setPhone(value);
    setCode('');
    setSentPhone('');
    setExpiresAt(0);
    setError('');
    // Keep the resend cooldown when the number changes.
  }

  function changeCode(value: string) {
    setCode(value.replace(/\D/g, '').slice(0, 6));
    setError('');
  }

  function applyUser(nextUser: User) {
    setPhone(nextUser.phone || '');
    setCode('');
    setSentPhone('');
    setResendAt(0);
    setExpiresAt(0);
    onVerified(nextUser);
  }

  async function send() {
    if (!user || requestRunning.current || verified || Date.now() < resendAt)
      return;
    if (!phone.trim()) {
      setError('Enter your phone number including its country code.');
      return;
    }

    requestRunning.current = true;
    setLoading(true);
    setError('');
    setCode('');
    setSentPhone('');
    setExpiresAt(0);
    try {
      const reply = await sendPhoneCode(phone);
      const sentAt = Date.now();
      setPhone(reply.phone);
      setSentPhone(reply.phone);
      setNow(sentAt);
      setResendAt(sentAt + reply.resendAvailableInSeconds * 1000);
      setExpiresAt(sentAt + reply.expiresInMinutes * 60 * 1000);
    } catch (problem) {
      if (problem instanceof ApiError && problem.status === 409) {
        try {
          const currentUser = await getCurrentUser();
          applyUser(currentUser);
          if (!currentUser.phoneVerified) setError(problem.message);
        } catch (refreshProblem) {
          setError(
            refreshProblem instanceof Error
              ? refreshProblem.message
              : 'Unable to refresh your phone verification status.',
          );
        }
      } else {
        setError(
          problem instanceof Error
            ? problem.message
            : 'Unable to send a phone code.',
        );
      }
    }
    requestRunning.current = false;
    setLoading(false);
  }

  async function verify() {
    if (!canVerify || requestRunning.current || Date.now() >= expiresAt) return;
    requestRunning.current = true;
    setLoading(true);
    setError('');
    try {
      const verifiedUser = await verifyPhoneCode(code);
      applyUser(verifiedUser);
    } catch (problem) {
      setError(
        problem instanceof Error
          ? problem.message
          : 'Unable to verify your phone.',
      );
    }
    requestRunning.current = false;
    setLoading(false);
  }

  return {
    phone,
    savedPhone,
    savedVerified,
    code,
    sentPhone,
    verified,
    loading,
    error,
    resendSeconds,
    expirySeconds,
    canVerify,
    changePhone,
    changeCode,
    send,
    verify,
  };
}
