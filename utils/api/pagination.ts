import { protectedRequest } from './request';
import { getSessionVersion } from './session';
import { validatePaginationPage } from './paginationGuard';

export async function getAllPages<T>(path: string, key: string): Promise<T[]> {
  const items: T[] = [];
  const ids = new Set<string>();
  let expectedTotal: number | undefined;
  const started = Date.now();
  const version = getSessionVersion();
  for (let page = 1; page <= 100; page++) {
    if (Date.now() - started > 120000)
      throw new Error('Loading the full list timed out. Please retry.');
    if (getSessionVersion() !== version)
      throw new Error('Your session changed. Please reload.');
    const result = await protectedRequest<T[] | { [key: string]: unknown }>(
      path + (path.includes('?') ? '&' : '?') + 'page=' + page + '&limit=100',
    );
    if (getSessionVersion() !== version)
      throw new Error('Your session changed. Please reload.');
    if (!result || typeof result !== 'object')
      throw new Error('The server returned an invalid list.');
    const batch = Array.isArray(result) ? result : result[key];
    if (!Array.isArray(batch))
      throw new Error('The server returned an invalid list.');
    const pagination = !Array.isArray(result) ? result.pagination : undefined;
    if (Array.isArray(result)) {
      validatePaginationPage(
        batch,
        { page, total: batch.length, hasNextPage: false },
        page,
        ids,
        items.length,
      );
      items.push(...batch);
      return items;
    }
    const checked = validatePaginationPage(
      batch,
      pagination,
      page,
      ids,
      items.length,
      expectedTotal,
    );
    items.push(...batch);
    expectedTotal = checked.total;
    const hasNext = checked.hasNextPage;
    if (!hasNext) {
      return items;
    }
    if (!batch.length)
      throw new Error(
        'The server returned incomplete pagination. Please reload.',
      );
  }
  throw new Error('The list is too large to load. Please narrow your filters.');
}
