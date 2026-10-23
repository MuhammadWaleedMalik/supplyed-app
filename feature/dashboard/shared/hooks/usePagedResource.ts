import { useCallback, useEffect, useRef, useState } from 'react';
import { getSessionVersion } from '../../../../utils/api/session';

export type ResourcePage<T> = {
  items: T[];
  page: number;
  hasMore: boolean;
  total?: number;
};

// The loader must be memoized by its caller. Stale requests never replace a new list.
export function usePagedResource<T extends { id: string }>(
  loader: (page: number) => Promise<ResourcePage<T>>,
  enabled = true,
  revision = '',
) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState<number>();
  const page = useRef(0);
  const request = useRef(0);
  const busy = useRef(false);
  const load = useCallback(
    async (reset = false, preservePages = false) => {
      if (!enabled || (!reset && busy.current)) return;
      const attempt = ++request.current;
      const version = getSessionVersion();
      busy.current = true;
      setLoading(true);
      setError('');
      try {
        const loadedPages = Math.max(1, page.current);
        let result = await loader(reset ? 1 : page.current + 1);
        if (reset && preservePages) {
          const refreshed = [...result.items];
          for (let next = 2; next <= loadedPages && result.hasMore; next++) {
            if (attempt !== request.current || version !== getSessionVersion())
              return;
            result = await loader(next);
            refreshed.push(...result.items);
          }
          result = {
            ...result,
            items: Array.from(
              new Map(refreshed.map(item => [item.id, item])).values(),
            ),
          };
        }
        if (attempt !== request.current || version !== getSessionVersion())
          return;
        setItems(current =>
          reset
            ? result.items
            : [
                ...current,
                ...result.items.filter(
                  item => !current.some(old => old.id === item.id),
                ),
              ],
        );
        page.current = result.page;
        setHasMore(result.hasMore);
        setTotal(result.total);
      } catch (problem) {
        if (attempt === request.current && version === getSessionVersion())
          setError(
            problem instanceof Error
              ? problem.message
              : 'Unable to load. Please retry.',
          );
      } finally {
        if (attempt === request.current) {
          busy.current = false;
          setLoading(false);
        }
      }
    },
    [enabled, loader],
  );
  useEffect(() => {
    setItems([]);
    setHasMore(false);
    setTotal(undefined);
    setError('');
    setLoading(false);
    page.current = 0;
    load(true);
    return () => {
      request.current += 1;
      busy.current = false;
    };
  }, [load, revision]);
  return {
    items,
    loading,
    error,
    hasMore,
    total,
    refresh: () => load(true),
    refreshLoaded: () => load(true, true),
    loadMore: () => load(false),
  };
}
