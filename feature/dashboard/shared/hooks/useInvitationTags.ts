import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { getInvitations, Invitation } from '../apis/invitationsApi';

export function useInvitationTags() {
  const [items, setItems] = useState<Invitation[]>();
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    let loading = false;
    async function refresh() {
      if (loading) return;
      loading = true;
      try {
        const result = await getInvitations();
        if (active) {
          setItems(result);
          setError('');
        }
      } catch {
        if (active) {
          setItems(undefined);
          setError(
            'Invitation tags are unavailable. Open Job invitations to retry.',
          );
        }
      } finally {
        loading = false;
      }
    }
    refresh();
    const timer = setInterval(() => {
      if (AppState.currentState === 'active') refresh();
    }, 30000);
    const listener = AppState.addEventListener('change', state => {
      if (state === 'active') refresh();
    });
    return () => {
      active = false;
      clearInterval(timer);
      listener.remove();
    };
  }, []);
  return { items, error };
}
