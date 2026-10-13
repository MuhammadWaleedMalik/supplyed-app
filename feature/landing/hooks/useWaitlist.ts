import { useEffect, useRef, useState } from 'react';
import {
  joinWaitlist,
  saveWaitlistDetails,
  WaitlistReply,
  WaitlistType,
} from '../apis/waitlistApi';
import {
  emptyWaitlistForm,
  validateWaitlist,
  waitlistPayload,
  WaitlistErrors,
  WaitlistFormData,
} from '../../../utils/landing/waitlistValidation';

export function useWaitlist(type: WaitlistType) {
  const [data, setData] = useState({ ...emptyWaitlistForm });
  const [errors, setErrors] = useState<WaitlistErrors>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<WaitlistReply>();
  const [details, setDetails] = useState({
    phases: [] as string[],
    mainSubject: '',
    postcode: '',
  });
  const [detailsSaved, setDetailsSaved] = useState(false);
  const submitting = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  function update<K extends keyof WaitlistFormData>(
    key: K,
    value: WaitlistFormData[K],
  ) {
    if (submitting.current) return;
    setData(previous => ({ ...previous, [key]: value }));
    setErrors(previous => ({ ...previous, [key]: undefined }));
    setError('');
  }

  async function submit() {
    if (submitting.current || result) return;
    const validation = validateWaitlist(type, data);
    setErrors(validation);
    if (Object.keys(validation).length) return;
    submitting.current = true;
    setBusy(true);
    setError('');
    try {
      const reply = await joinWaitlist(waitlistPayload(type, data));
      if (mounted.current) setResult(reply);
    } catch (problem) {
      if (mounted.current)
        setError(
          problem instanceof Error
            ? problem.message
            : 'Unable to join the waitlist. Please try again.',
        );
    } finally {
      submitting.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  async function saveDetails() {
    if (submitting.current || !result?.detailsToken || detailsSaved) return;
    if (
      details.postcode.trim() &&
      !/^[A-Z]{1,2}\d[A-Z\d]?(?:\s*\d[A-Z]{2})?$/i.test(details.postcode.trim())
    ) {
      setError('Enter a valid UK postcode or postcode area.');
      return;
    }
    submitting.current = true;
    setBusy(true);
    setError('');
    try {
      await saveWaitlistDetails(result.id, result.detailsToken, details);
      if (mounted.current) {
        setDetailsSaved(true);
        setResult(
          previous => previous && { ...previous, detailsToken: undefined },
        );
      }
    } catch (problem) {
      if (mounted.current)
        setError(
          problem instanceof Error
            ? problem.message
            : 'Unable to save your details. Please try again.',
        );
    } finally {
      submitting.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  return {
    data,
    update,
    errors,
    error,
    busy,
    result,
    submit,
    details,
    setDetails,
    detailsSaved,
    saveDetails,
  };
}
