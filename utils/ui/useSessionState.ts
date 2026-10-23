import { useCallback, useState, type SetStateAction } from 'react';
import { getSessionVersion, onSessionChanged } from '../api/session';

const values = new Map<string, unknown>();
let version = getSessionVersion();
onSessionChanged(() => {
  const next = getSessionVersion();
  if (next !== version) {
    values.clear();
    version = next;
  }
});

// In-memory UI preferences only; cleared at logout/account change and app restart.
export function useSessionState<T>(key: string, initial: T) {
  const ownVersion = getSessionVersion();
  const [value, setValue] = useState<T>(() =>
    values.has(key) ? (values.get(key) as T) : initial,
  );
  const set = useCallback(
    (next: SetStateAction<T>) => {
      if (ownVersion !== getSessionVersion()) return;
      setValue(previous => {
        if (ownVersion !== getSessionVersion()) return previous;
        const result =
          typeof next === 'function'
            ? (next as (current: T) => T)(previous)
            : next;
        values.set(key, result);
        return result;
      });
    },
    [key, ownVersion],
  );
  return [value, set] as const;
}
