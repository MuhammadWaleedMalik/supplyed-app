export type Page<T> = { items: T[]; page: number; hasMore: boolean; total?: number };
type Source<T> = (page: number) => Promise<Page<T>>;
type Stream<T> = { source: Source<T>; page: number; buffer: T[]; hasMore: boolean };

/** Merge independently paged, sorted endpoints without downloading their histories.
 * A failed page is transactional: retrying never skips items already consumed locally.
 * School applications need this because the API only exposes a per-job endpoint.
 */
export function createMergedPager<T extends { id: string }>(
  sources: Source<T>[],
  compare: (a: T, b: T) => number,
  matches: (item: T) => boolean = () => true,
  size = 20,
  scanLimit = 200,
) {
  let committed: Stream<T>[] = [];
  let seen = new Set<string>();
  let lastPage = 0;
  let generation = 0;
  return async (page: number): Promise<Page<T>> => {
    if (page === 1) {
      generation++;
      committed = sources.map(source => ({ source, page: 0, buffer: [], hasMore: true }));
      seen = new Set();
      lastPage = 0;
    }
    if (page !== lastPage + 1) throw new Error('Refresh the list before continuing.');
    const current = generation;
    const streams = committed.map(stream => ({ ...stream, buffer: [...stream.buffer] }));
    const visited = new Set(seen);
    async function fill(stream: Stream<T>) {
      if (stream.buffer.length || !stream.hasMore) return;
      const next = await stream.source(stream.page + 1);
      if (next.page !== stream.page + 1 || (next.hasMore && !next.items.length))
        throw new Error('The server returned an incomplete page. Please refresh.');
      stream.buffer = next.items;
      stream.page = next.page;
      stream.hasMore = next.hasMore;
    }
    // Cap fan-out to four requests even for schools with many jobs.
    let index = 0;
    await Promise.all(Array.from({ length: Math.min(4, streams.length) }, async () => {
      while (index < streams.length) await fill(streams[index++]);
    }));
    const items: T[] = [];
    for (let scanned = 0; items.length < size && scanned < scanLimit; scanned++) {
      const candidates = streams.filter(stream => stream.buffer.length);
      if (!candidates.length) break;
      candidates.sort((a, b) => compare(a.buffer[0], b.buffer[0]));
      const stream = candidates[0];
      const item = stream.buffer.shift()!;
      if (!visited.has(item.id)) {
        visited.add(item.id);
        if (matches(item)) items.push(item);
      }
      // Refill the consumed stream before selecting the next globally newest item.
      if (items.length < size && scanned + 1 < scanLimit) await fill(stream);
    }
    const hasMore = streams.some(stream => stream.buffer.length || stream.hasMore);
    if (current !== generation) throw new Error('The filters changed. Loading the latest results.');
    committed = streams;
    seen = visited;
    lastPage = page;
    return { items, page, hasMore };
  };
}

export function newestFirst(a: { createdAt?: string; id: string }, b: { createdAt?: string; id: string }) {
  return (b.createdAt || '').localeCompare(a.createdAt || '') || b.id.localeCompare(a.id);
}
