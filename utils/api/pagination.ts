import { protectedRequest } from './request';
import { getSessionVersion } from './session';

export async function getAllPages<T>(path: string, key: string): Promise<T[]> {
  const items: T[] = [];
  const version = getSessionVersion();
  for (let page = 1; page <= 100; page++) {
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
    items.push(...batch);
    const pagination = !Array.isArray(result) ? result.pagination : undefined;
    const hasNext =
      pagination &&
      typeof pagination === 'object' &&
      'hasNextPage' in pagination &&
      pagination.hasNextPage === true;
    if (!hasNext) return items;
    if (!batch.length)
      throw new Error(
        'The server returned incomplete pagination. Please reload.',
      );
  }
  throw new Error('The list is too large to load. Please narrow your filters.');
}
