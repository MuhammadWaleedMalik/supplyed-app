import { useEffect, useRef, useState } from 'react';
import { getSessionVersion } from '../../../../utils/api/session';
import { assertUploadSession } from '../../../../utils/api/upload';
import { User } from '../../../auth/apis/authApi';
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
  const working = useRef(false);

  function applySettings(nextSettings: ProfileSnapshot) {
    setSettings(nextSettings);
    setFields(fieldsFromSettings(nextSettings));
  }

  function change(name: keyof ProfileFields, value: string | boolean) {
    setSaved('');
    setFields(current => ({ ...current, [name]: value }));
  }

  function updateUser(user: User) {
    setSettings(current => current ? { ...current, user } : current);
    setSaved(user.phoneVerified ? 'Phone verified successfully.' : '');
  }

  async function save() {
    if (!settings || working.current) {
      return;
    }

    const hasRequiredNames =
      fields.accountName.trim() && fields.profileName.trim();

    if (!hasRequiredNames) {
      setError('Account name and profile name are required.');
      return;
    }

    working.current = true;
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

    working.current = false;
    setLoading(false);
  }

  async function changeImage() {
    if (working.current) return;
    working.current = true;
    const version = getSessionVersion();
    setLoading(true);
    setError('');
    setSaved('');

    try {
      const image = await pickProfileImage();
      assertUploadSession(version);
      const uploaded = await uploadProfileImage(image.file, image.mime);
      setImageUrl(uploaded.imageUrl || uploaded.url || '');
      setSaved('Profile image updated.');
    } catch (problem) {
      if (!imagePickWasCancelled(problem)) {
        setError(errorMessage(problem, 'Unable to upload image.'));
      }
    }

    working.current = false;
    setLoading(false);
  }

  useEffect(() => {
    let active = true;
    async function loadSettings() {
      setLoading(true);
      setError('');

      try {
        const nextSettings = await getProfileSettings(type);
        if (!active) return;
        setSettings(nextSettings);
        setFields(fieldsFromSettings(nextSettings));
        const image = await getProfileImage();
        if (!active) return;
        setImageUrl(image.imageUrl || image.url || '');
      } catch (problem) {
        if (!active) return;
        setError(errorMessage(problem, 'Unable to load settings.'));
      }

      setLoading(false);
    }

    loadSettings();
    return () => { active = false; };
  }, [type]);

  return {
    settings,
    fields,
    imageUrl,
    error,
    saved,
    loading,
    change,
    updateUser,
    save,
    changeImage,
  };
}
