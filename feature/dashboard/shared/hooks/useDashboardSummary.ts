import { useEffect, useState } from 'react';
import { getMyApplications, Application } from '../apis/applicationsApi';
import { getMyBookings, Booking } from '../apis/bookingsApi';
import { getInvitations, Invitation } from '../apis/invitationsApi';
import { getProfileSettings, ProfileSnapshot } from '../apis/settingsApi';
import { getMyJobs, Job } from '../apis/jobsApi';
import { useForegroundRefresh } from './useForegroundRefresh';

export function useDashboardSummary(role: 'teacher' | 'school') {
  const [profile, setProfile] = useState<ProfileSnapshot>();
  const [applications, setApplications] = useState<Application[]>();
  const [jobs, setJobs] = useState<Job[]>();
  const [bookings, setBookings] = useState<Booking[]>();
  const [invitations, setInvitations] = useState<Invitation[]>();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const refresh = () => setAttempt(value => value + 1);
  useForegroundRefresh(() => {
    if (!loading) refresh();
  });

  useEffect(() => {
    let active = true;
    setLoading(true);
    setErrors({});
    function failed(section: string, error: unknown) {
      if (active)
        setErrors(current => ({
          ...current,
          [section]:
            error instanceof Error ? error.message : 'Please try again.',
        }));
    }
    const tasks = [
      getProfileSettings(role)
        .then(value => {
          if (active) setProfile(value);
        })
        .catch(error => failed('Profile', error)),
      getMyBookings('CONFIRMED')
        .then(value => {
          if (active) setBookings(value);
        })
        .catch(error => failed('Bookings', error)),
      getInvitations()
        .then(value => {
          if (active) setInvitations(value);
        })
        .catch(error => failed('Invitations', error)),
    ];
    if (role === 'teacher') {
      tasks.push(
        getMyApplications()
          .then(value => {
            if (active) setApplications(value);
          })
          .catch(error => failed('Applications', error)),
      );
    } else {
      tasks.push(
        getMyJobs()
          .then(value => {
            if (active) setJobs(value);
          })
          .catch(error => failed('Jobs', error)),
      );
    }
    Promise.all(tasks).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [role, attempt]);

  return {
    profile,
    applications,
    jobs,
    bookings,
    invitations,
    errors,
    loading,
    refresh,
  };
}
