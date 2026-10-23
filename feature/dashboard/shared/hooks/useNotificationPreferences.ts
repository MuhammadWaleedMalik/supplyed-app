import { useEffect, useRef, useState } from 'react';
import {
  getSessionVersion,
  onSessionChanged,
} from '../../../../utils/api/session';
import {
  getNotificationPreferences,
  NotificationPreferences,
  updateNotificationPreferences,
} from '../apis/notificationsApi';

export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const mounted = useRef(false);
  const working = useRef(false);
  const session = useRef(getSessionVersion());

  useEffect(() => {
    let active = true;
    mounted.current = true;

    async function load() {
      if (session.current !== getSessionVersion()) return;
      setLoading(true);
      setError('');
      try {
        const result = await getNotificationPreferences();
        if (active && session.current === getSessionVersion())
          setPreferences(result);
      } catch (problem) {
        if (active && session.current === getSessionVersion()) {
          setError(
            problem instanceof Error
              ? problem.message
              : 'Unable to load email preferences.',
          );
        }
      }
      if (active && session.current === getSessionVersion()) setLoading(false);
    }

    const unsubscribe = onSessionChanged(() => {
      if (session.current === getSessionVersion()) return;
      active = false;
      mounted.current = false;
      setPreferences(undefined);
      setLoading(false);
      setSaving(false);
      setError('');
    });

    load();
    return () => {
      active = false;
      mounted.current = false;
      unsubscribe();
    };
  }, [retryCount]);

  async function change(key: keyof NotificationPreferences, value: boolean) {
    if (
      !preferences ||
      loading ||
      working.current ||
      !mounted.current ||
      session.current !== getSessionVersion()
    )
      return;

    const previous = preferences;
    working.current = true;
    setSaving(true);
    setError('');
    setPreferences({ ...previous, [key]: value });

    try {
      const result = await updateNotificationPreferences(key, value);
      if (mounted.current && session.current === getSessionVersion())
        setPreferences(result);
    } catch (problem) {
      if (mounted.current && session.current === getSessionVersion()) {
        setPreferences(previous);
        setError(
          problem instanceof Error
            ? problem.message
            : 'Unable to save email preferences.',
        );
      }
    }

    working.current = false;
    if (mounted.current && session.current === getSessionVersion())
      setSaving(false);
  }

  return {
    preferences,
    loading,
    saving,
    error,
    change,
    retry: () => setRetryCount(count => count + 1),
  };
}
