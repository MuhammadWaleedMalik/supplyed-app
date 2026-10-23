export type PaginationMetadata = {
  page: number;
  total: number;
  hasNextPage: boolean;
};

export function validatePaginationPage(
  batch: unknown[],
  pagination: unknown,
  requestedPage: number,
  seenIds: Set<string>,
  loadedBefore: number,
  expectedTotal?: number,
) {
  for (const item of batch) {
    if (!item || typeof item !== 'object' || Array.isArray(item))
      throw new Error('The server omitted a stable list ID. Please reload.');
    const id = (item as Record<string, unknown>).id;
    if (typeof id !== 'string' || !id || seenIds.has(id))
      throw new Error(
        'The server repeated or omitted list entries. Please reload.',
      );
    seenIds.add(id);
  }

  if (!pagination || typeof pagination !== 'object')
    throw new Error('The server returned incomplete pagination. Please reload.');
  const value = pagination as Record<string, unknown>;
  if (
    value.page !== requestedPage ||
    typeof value.total !== 'number' ||
    !Number.isInteger(value.total) ||
    value.total < 0 ||
    typeof value.hasNextPage !== 'boolean'
  )
    throw new Error('The server returned incomplete pagination. Please reload.');
  if (expectedTotal !== undefined && expectedTotal !== value.total)
    throw new Error('The list changed while loading. Please refresh.');
  if (!value.hasNextPage && loadedBefore + batch.length !== value.total)
    throw new Error('The full list could not be loaded. Please refresh.');

  return {
    page: value.page,
    total: value.total,
    hasNextPage: value.hasNextPage,
  } as PaginationMetadata;
}
