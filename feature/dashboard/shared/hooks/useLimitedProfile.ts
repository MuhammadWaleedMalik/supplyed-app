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
    return () => { requestId.current += 1; };
  }, []);

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
    };
  }, [initialId, initialType]);

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
