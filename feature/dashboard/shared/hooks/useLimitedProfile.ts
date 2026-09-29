import { useEffect, useState } from 'react';
import {
  getInstructorProfile,
  getPosterProfile,
  LimitedProfile,
} from '../apis/publicProfileApi';

type ProfileType = 'teacher' | 'poster';

function profileError(problem: unknown) {
  return problem instanceof Error
    ? problem.message
    : 'Unable to load profile.';
}

export function useLimitedProfile(
  initialType?: ProfileType,
  initialId = '',
) {
  const [profile, setProfile] = useState<LimitedProfile>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadProfile(type: ProfileType, id: string) {
    setProfile(undefined);
    setError('');
    setLoading(true);

    try {
      const request =
        type === 'teacher'
          ? getInstructorProfile(id)
          : getPosterProfile(id);

      setProfile(await request);
    } catch (problem) {
      setError(profileError(problem));
    }

    setLoading(false);
  }

  function openPoster(userId: string) {
    loadProfile('poster', userId);
  }

  function openInstructor(id: string) {
    loadProfile('teacher', id);
  }

  function closeProfile() {
    setProfile(undefined);
    setError('');
    setLoading(false);
  }

  useEffect(() => {
    if (!initialType || !initialId) {
      return;
    }

    let active = true;

    async function loadInitialProfile() {
      setProfile(undefined);
      setError('');
      setLoading(true);

      try {
        const request =
          initialType === 'teacher'
            ? getInstructorProfile(initialId)
            : getPosterProfile(initialId);
        const result = await request;

        if (active) {
          setProfile(result);
        }
      } catch (problem) {
        if (active) {
          setError(profileError(problem));
        }
      }

      if (active) {
        setLoading(false);
      }
    }

    loadInitialProfile();

    return () => {
      active = false;
    };
  }, [initialId, initialType]);

  return {
    profile,
    error,
    loading,
    openPoster,
    openInstructor,
    closeProfile,
  };
}
