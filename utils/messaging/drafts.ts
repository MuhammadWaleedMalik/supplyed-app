import { useSyncExternalStore } from 'react';
import type { MessageAttachment } from '../../constants/conversationsApi';
import { getSessionVersion, onSessionChanged } from '../api/session';

type Draft = {
  body: string;
  files: MessageAttachment[];
  sending: boolean;
  uploading: boolean;
  uncertain: boolean;
  error: string;
};
const empty: Draft = {
  body: '',
  files: [],
  sending: false,
  uploading: false,
  uncertain: false,
  error: '',
};
const drafts = new Map<string, Draft>();
const listeners = new Set<() => void>();
let version = getSessionVersion();
onSessionChanged(() => {
  if (version === getSessionVersion()) return;
  version = getSessionVersion();
  drafts.clear();
  listeners.forEach(listener => listener());
});
export function getDraft(id: string) {
  return drafts.get(id) || empty;
}
export function updateDraft(
  id: string,
  update: Partial<Draft> | ((value: Draft) => Partial<Draft>),
  session = getSessionVersion(),
) {
  if (session !== getSessionVersion()) return;
  const current = getDraft(id);
  drafts.set(id, {
    ...current,
    ...(typeof update === 'function' ? update(current) : update),
  });
  listeners.forEach(listener => listener());
}
export function useDraft(id: string) {
  return useSyncExternalStore(
    listener => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    () => getDraft(id),
  );
}
