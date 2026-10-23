import { useAppDispatch } from '../../../../store/hooks';
import { refreshMarketplace } from '../store/navigationSlice';
import { normalizeUkPhone } from '../../../../utils/auth/ukPhone';
import { useEffect, useRef, useState } from 'react';
import { ApiError } from '../../../../utils/api/request';
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
  SettingsSection,
  saveProfileSettings,
} from '../apis/settingsApi';

function errorMessage(problem: unknown, fallback: string) {
  return problem instanceof Error ? problem.message : fallback;
}

export function useProfileSettings(type: AccountType) {
  const dispatch = useAppDispatch();
  const [settings, setSettings] = useState<ProfileSnapshot>();
  const [fields, setFields] = useState<ProfileFields>(fieldsFromSettings());
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof ProfileFields, string>>
  >({});
  const [loading, setLoading] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const working = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  function applySettings(nextSettings: ProfileSnapshot) {
    setSettings(nextSettings);
    setFields(fieldsFromSettings(nextSettings));
  }

  function change(name: keyof ProfileFields, value: string | boolean) {
    if (working.current) return;
    setSaved('');
    setFieldErrors(current => ({ ...current, [name]: undefined }));
    setFields(current => ({ ...current, [name]: value }));
  }

  function updateUser(user: User) {
    setSettings(current => (current ? { ...current, user } : current));
    setFields(current => ({ ...current, phone: user.phone || '' }));
    setSaved(user.phoneVerified ? 'Phone verified successfully.' : '');
  }

  async function save(section: SettingsSection = 'all') {
    if (!settings || working.current) {
      return;
    }

    const errors: Partial<Record<keyof ProfileFields, string>> = {};
    if (section !== 'profile' && !fields.accountName.trim())
      errors.accountName = 'Enter your account name.';
    if (section !== 'account' && !fields.profileName.trim())
      errors.profileName = 'Enter your profile name.';
    if (section !== 'profile' && fields.phone !== (settings.user.phone || '')) {
      try {
        normalizeUkPhone(fields.phone);
      } catch {
        errors.phone = 'Enter a valid UK phone number.';
      }
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      setError('Please correct the highlighted fields before saving.');
      return;
    }

    working.current = true;
    const version = getSessionVersion();
    const active = () => mounted.current && version === getSessionVersion();
    setLoading(true);
    setError('');
    setSaved('');

    try {
      const nextSettings = await saveProfileSettings(
        type,
        settings,
        fields,
        section,
      );
      if (!active()) return;
      if (section === 'all') {
        applySettings(nextSettings);
      } else {
        setSettings(nextSettings);
        const savedFields = fieldsFromSettings(nextSettings);
        setFields(current =>
          section === 'account'
            ? {
                ...current,
                accountName: savedFields.accountName,
                phone: savedFields.phone,
              }
            : {
                ...savedFields,
                accountName: current.accountName,
                phone: current.phone,
              },
        );
      }
      dispatch(refreshMarketplace());
      setSaved('Settings saved successfully.');
    } catch (problem) {
      if (!active()) return;
      const message = errorMessage(problem, 'Unable to save settings.');
      setError(message);
      if (/phone|number is verified/i.test(message))
        setFieldErrors({ phone: message });
      if (
        problem instanceof ApiError &&
        problem.code === 'PHONE_VERIFIED_LOCKED'
      ) {
        try {
          const fresh = await getProfileSettings(type);
          if (!active()) return;
          setSettings(fresh);
          setFields(current => ({ ...current, phone: fresh.user.phone || '' }));
        } catch {
          /* Retain the original save error. */
        }
      }
    } finally {
      working.current = false;
      if (active()) setLoading(false);
    }
  }

  async function changeImage() {
    if (working.current) return;
    working.current = true;
    const version = getSessionVersion();
    const active = () => mounted.current && version === getSessionVersion();
    setLoading(true);
    setError('');
    setSaved('');

    try {
      const image = await pickProfileImage();
      if (!active()) return;
      assertUploadSession(version);
      const uploaded = await uploadProfileImage(image.file, image.mime);
      if (!active()) return;
      setImageUrl(uploaded.imageUrl || uploaded.url || '');
      setSaved('Profile image updated.');
    } catch (problem) {
      if (active() && !imagePickWasCancelled(problem)) {
        setError(errorMessage(problem, 'Unable to upload image.'));
      }
    } finally {
      working.current = false;
      if (active()) setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    const version = getSessionVersion();
    async function loadSettings() {
      setLoading(true);
      setError('');

      try {
        const nextSettings = await getProfileSettings(type);
        if (!active || version !== getSessionVersion()) return;
        setSettings(nextSettings);
        setFields(fieldsFromSettings(nextSettings));
        const image = await getProfileImage();
        if (!active || version !== getSessionVersion()) return;
        setImageUrl(image.imageUrl || image.url || '');
      } catch (problem) {
        if (!active || version !== getSessionVersion()) return;
        setError(errorMessage(problem, 'Unable to load settings.'));
      }

      setLoading(false);
    }

    loadSettings();
    return () => {
      active = false;
    };
  }, [type, loadAttempt]);

  return {
    settings,
    fields,
    fieldErrors,
    imageUrl,
    error,
    saved,
    loading,
    change,
    updateUser,
    save,
    changeImage,
    retry: () => setLoadAttempt(value => value + 1),
  };
}
