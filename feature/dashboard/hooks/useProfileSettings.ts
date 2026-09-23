import { useEffect, useState } from 'react';
import { AccountType } from '../../../utils/onboarding/onboardingData';
import {
  fieldsFromSettings,
  getProfileSettings,
  ProfileFields,
  ProfileSnapshot,
  saveProfileSettings,
} from '../apis/settingsApi';

export function useProfileSettings(type: AccountType) {
  const [settings, setSettings] = useState<ProfileSnapshot>();
  const [fields, setFields] = useState<ProfileFields>(fieldsFromSettings());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      const next = await getProfileSettings(type);
      setSettings(next);
      setFields(fieldsFromSettings(next));
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Unable to load settings.');
    }
  }

  function change(name: keyof ProfileFields, value: string) {
    setFields(current => ({ ...current, [name]: value }));
  }

  async function save() {
    if (!settings) return;
    setLoading(true);
    setError('');
    try {
      const next = await saveProfileSettings(type, settings, fields);
      setSettings(next);
      setFields(fieldsFromSettings(next));
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Unable to save settings.');
    }
    setLoading(false);
  }

  useEffect(() => {
    async function firstLoad() {
      try {
        const next = await getProfileSettings(type);
        setSettings(next);
        setFields(fieldsFromSettings(next));
      } catch (problem) {
        setError(problem instanceof Error ? problem.message : 'Unable to load settings.');
      }
    }
    firstLoad();
  }, [type]);

  return { settings, fields, error, loading, change, save, load };
}

