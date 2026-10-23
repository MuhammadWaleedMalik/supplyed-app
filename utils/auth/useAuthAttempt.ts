import { useEffect, useRef } from 'react';
import { getSessionVersion } from '../api/session';

// A disabled button alone does not prevent two presses in the same render.
// Discard public auth responses after leaving the form or changing accounts.
export function useAuthAttempt() {
  const mounted = useRef(true);
  const running = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  function begin() {
    if (running.current || !mounted.current) return undefined;
    running.current = true;
    const version = getSessionVersion();
    return () => mounted.current && getSessionVersion() === version;
  }

  function finish() {
    running.current = false;
  }

  return { begin, finish };
}
