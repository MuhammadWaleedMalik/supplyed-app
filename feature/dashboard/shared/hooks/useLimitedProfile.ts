import { useForegroundRefresh } from './useForegroundRefresh';
import { useEffect, useRef, useState } from 'react';
import {
  getApplicationSchoolProfile,
  getInstitutionProfile,
  getInstructorProfile,
  LimitedProfile,
} from '../apis/publicProfileApi';
import { ApiError } from '../../../../utils/api/request';

type ProfileType = 'teacher' | 'school';

function profileError(problem: unknown) {
  if (
    problem instanceof ApiError &&
    (problem.status === 403 || problem.status === 404)
  )
    return 'This marketplace profile is unavailable.';
  return problem instanceof Error ? problem.message : 'Unable to load profile.';
}

export function useLimitedProfile(initialType?: ProfileType, initialId = '') {
  const [profile, setProfile] = useState<LimitedProfile>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const requestId = useRef(0);

  async function loadProfile(type: ProfileType, id: string) {
    const currentRequest = ++requestId.current;
    setProfile(undefined);
    setError('');
    setLoading(true);

    try {
      const request =
        type === 'teacher'
          ? getInstructorProfile(id)
          : getInstitutionProfile(id);

      const result = await request;
      if (currentRequest === requestId.current) setProfile(result);
    } catch (problem) {
      if (currentRequest === requestId.current) setError(profileError(problem));
    }

    if (currentRequest === requestId.current) setLoading(false);
  }

  async function openApplicationSchool(applicationId: string) {
    const currentRequest = ++requestId.current;
    setProfile(undefined);
    setError('');
    setLoading(true);
    try {
      const result = await getApplicationSchoolProfile(applicationId);
      if (currentRequest === requestId.current) setProfile(result);
    } catch (problem) {
      if (currentRequest === requestId.current) setError(profileError(problem));
    }
    if (currentRequest === requestId.current) setLoading(false);
  }

  function openSchool(id: string) {
    loadProfile('school', id);
  }

  function openInstructor(id: string) {
    loadProfile('teacher', id);
  }

  function closeProfile() {
    requestId.current += 1;
    setProfile(undefined);
    setError('');
    setLoading(false);
  }

  useEffect(() => {
    return () => {
      requestId.current += 1;
    };
  }, []);

  useEffect(() => {
    if (!initialType || !initialId) {
      return;
    }

    let active = true;
    requestId.current += 1;

    async function loadInitialProfile() {
      setProfile(undefined);
      setError('');
      setLoading(true);

      try {
        const request =
          initialType === 'teacher'
            ? getInstructorProfile(initialId)
            : getInstitutionProfile(initialId);
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
      requestId.current += 1;
    };
  }, [initialId, initialType]);

  const refreshing = useRef(false);
  useForegroundRefresh(async () => {
    if (!profile || profile.reviewType !== 'instructor' || refreshing.current)
      return;
    const request = requestId.current;
    refreshing.current = true;
    try {
      const next = await getInstructorProfile(profile.id);
      if (request === requestId.current) setProfile(next);
    } catch {
      if (request === requestId.current)
        setProfile(current =>
          current ? { ...current, bookings: null } : current,
        );
    } finally {
      refreshing.current = false;
    }
  }, profile?.reviewType === 'instructor');

  return {
    profile,
    error,
    loading,
    openSchool,
    openApplicationSchool,
    openInstructor,
    closeProfile,
  };
}
