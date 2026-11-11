import { useEffect, useRef, useState } from 'react';
import { Linking } from 'react-native';
import { getCurrentUser, User } from '../../auth/apis/authApi';
import { useForegroundRefresh } from '../../dashboard/shared/hooks/useForegroundRefresh';
import { getSessionVersion } from '../../../utils/api/session';
import {
  getMyIdentityVerification,
  startIdentityVerification,
  getMyDbsCheck,
  MyIdentityVerification,
  TeacherDbsCheck,
} from '../apis/identityVerificationApi';

export function useIdentityVerification(setup = false, showDbs = false) {
  const [identity, setIdentity] = useState<MyIdentityVerification>();
  const [user, setUser] = useState<User>();
  const [dbs, setDbs] = useState<TeacherDbsCheck | null>(null);
  const [dbsLoaded, setDbsLoaded] = useState(false);
  const [error, setError] = useState('');
  const [dbsError, setDbsError] = useState('');
  const [userError, setUserError] = useState('');
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [opening, setOpening] = useState(false);
  const mounted = useRef(false);
  const working = useRef(false);
  const openingRef = useRef(false);
  const version = useRef(getSessionVersion());
  const active = () =>
    mounted.current && version.current === getSessionVersion();

  async function refresh() {
    if (working.current || !active()) return;
    working.current = true;
    setLoading(true);
    // Each read keeps its own error so a DBS outage cannot hide the identity check.
    const results = await Promise.allSettled([
      getMyIdentityVerification(),
      setup ? getCurrentUser() : Promise.resolve(undefined),
      showDbs ? getMyDbsCheck() : Promise.resolve(null),
    ]);
    working.current = false;
    if (!active()) return;
    const [identityReply, userReply, dbsReply] = results;
    if (identityReply.status === 'fulfilled') {
      setIdentity(identityReply.value);
      setError('');
    } else
      setError(
        message(
          identityReply.reason,
          'Your identity check could not be loaded.',
        ),
      );
    if (userReply.status === 'fulfilled') {
      if (userReply.value) setUser(userReply.value);
      setUserError('');
    } else
      setUserError(
        message(userReply.reason, 'Your phone status could not be loaded.'),
      );
    if (dbsReply.status === 'fulfilled') {
      setDbs(dbsReply.value);
      setDbsLoaded(showDbs);
      setDbsError('');
    } else
      setDbsError(
        message(dbsReply.reason, 'Your DBS check could not be loaded.'),
      );
    setLoading(false);
  }

  useEffect(() => {
    mounted.current = true;
    refresh();
    return () => {
      mounted.current = false;
    };
    // This hook belongs to one mounted screen and one authenticated session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Like the web: poll only while TrustID is working. Focus, socket notifications
  // and manual refresh still reload checks awaiting the SupplyEd team.
  const pending =
    identity?.state === 'LINK_SENT' || identity?.state === 'PROCESSING';
  useForegroundRefresh(refresh, true, pending ? 30000 : 0);

  async function start(consent: boolean) {
    if (working.current || !active()) return;
    if (
      !consent ||
      !user?.phoneVerified ||
      !identity?.canStart ||
      identity.state !== 'NOT_STARTED'
    )
      return;
    working.current = true;
    setStarting(true);
    setError('');
    let startError = '';
    try {
      try {
        const verification = await startIdentityVerification(consent);
        if (!active()) return;
        setIdentity(current =>
          current
            ? {
                ...current,
                canStart: false,
                state: current.state === 'VERIFIED' ? 'VERIFIED' : 'LINK_SENT',
                verification,
              }
            : current,
        );
      } catch (problem) {
        startError = message(
          problem,
          'Your identity check could not be started. Please try again.',
        );
      }
      if (!active()) return;
      // Refresh after success, conflicts and uncertain network failures, like the web.
      try {
        const latest = await getMyIdentityVerification();
        if (active()) setIdentity(latest);
      } catch (problem) {
        if (!startError)
          startError = message(
            problem,
            'Your link is ready, but the latest status could not be loaded. Refresh to check it.',
          );
      }
      if (active()) setError(startError);
    } finally {
      working.current = false;
      if (active()) setStarting(false);
    }
  }

  async function openTrustId() {
    const url = identity?.verification?.guestLinkUrl;
    if (
      !active() ||
      openingRef.current ||
      !url ||
      identity?.verification?.status !== 'LINK_SENT'
    )
      return;
    openingRef.current = true;
    setOpening(true);
    setError('');
    try {
      // Use the exact backend URL in the phone browser, without SupplyEd tokens.
      await Linking.openURL(url);
    } catch {
      if (active())
        setError(
          'Unable to open TrustID. Try again or use the link we emailed and texted to you.',
        );
    } finally {
      openingRef.current = false;
      if (active()) setOpening(false);
    }
  }

  return {
    identity,
    user,
    updateUser: setUser,
    dbs,
    dbsLoaded,
    error,
    dbsError,
    userError,
    loading,
    starting,
    opening,
    refresh,
    start,
    openTrustId,
  };
}

function message(problem: unknown, fallback: string) {
  return problem instanceof Error ? problem.message : fallback;
}
