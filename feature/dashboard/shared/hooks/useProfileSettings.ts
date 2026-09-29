import { useEffect, useState } from 'react';
import {
  imagePickWasCancelled,
  pickProfileImage,
} from '../../../../utils/images/pickProfileImage';
import { AccountType } from '../../../../utils/onboarding/onboardingData';
import { getProfileImage, uploadProfileImage } from '../apis/profileImageApi';
import {
  fieldsFromSettings,
  getProfileSettings,
  ProfileFields,
  ProfileSnapshot,
  saveProfileSettings,
} from '../apis/settingsApi';

function errorMessage(problem: unknown, fallback: string) {
  return problem instanceof Error ? problem.message : fallback;
}

export function useProfileSettings(type: AccountType) {
  const [settings, setSettings] = useState<ProfileSnapshot>();
  const [fields, setFields] = useState<ProfileFields>(fieldsFromSettings());
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [loading, setLoading] = useState(false);

  function applySettings(nextSettings: ProfileSnapshot) {
    setSettings(nextSettings);
    setFields(fieldsFromSettings(nextSettings));
  }

  function change(name: keyof ProfileFields, value: string | boolean) {
    setSaved('');
    setFields(current => ({ ...current, [name]: value }));
  }

  async function save() {
    if (!settings) {
      return;
    }

    const hasRequiredNames =
      fields.accountName.trim() && fields.profileName.trim();

    if (!hasRequiredNames) {
      setError('Account name and profile name are required.');
      return;
    }

    setLoading(true);
    setError('');
    setSaved('');

    try {
      const nextSettings = await saveProfileSettings(type, settings, fields);
      applySettings(nextSettings);
      setSaved('Settings saved successfully.');
    } catch (problem) {
      setError(errorMessage(problem, 'Unable to save settings.'));
    }

    setLoading(false);
  }

  async function changeImage() {
    setLoading(true);
    setError('');
    setSaved('');

    try {
      const image = await pickProfileImage();
      const uploaded = await uploadProfileImage(image.file, image.mime);
      setImageUrl(uploaded.imageUrl || uploaded.url || '');
      setSaved('Profile image updated.');
    } catch (problem) {
      if (!imagePickWasCancelled(problem)) {
        setError(errorMessage(problem, 'Unable to upload image.'));
      }
    }

    setLoading(false);
  }

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      setError('');

      try {
        const nextSettings = await getProfileSettings(type);
        const image = await getProfileImage();

        setSettings(nextSettings);
        setFields(fieldsFromSettings(nextSettings));
        setImageUrl(image.imageUrl || image.url || '');
      } catch (problem) {
        setError(errorMessage(problem, 'Unable to load settings.'));
      }

      setLoading(false);
    }

    loadSettings();
  }, [type]);

  return {
    settings,
    fields,
    imageUrl,
    error,
    saved,
    loading,
    change,
    save,
    changeImage,
  };
}
