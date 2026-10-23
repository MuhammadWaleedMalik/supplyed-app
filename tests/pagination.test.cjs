require('./register.cjs');
const test = require('node:test');
const assert = require('node:assert/strict');
const { validatePaginationPage } = require('../utils/api/paginationGuard');

test('accepts stable multi-page metadata', () => {
  const seen = new Set();
  const first = validatePaginationPage(
    [{ id: 'a' }, { id: 'b' }],
    { page: 1, total: 3, hasNextPage: true },
    1,
    seen,
    0,
  );
  const second = validatePaginationPage(
    [{ id: 'c' }],
    { page: 2, total: 3, hasNextPage: false },
    2,
    seen,
    2,
    first.total,
  );
  assert.equal(second.total, 3);
  assert.deepEqual([...seen], ['a', 'b', 'c']);
});

test('rejects duplicate IDs, changing totals and incomplete final pages', () => {
  assert.throws(() =>
    validatePaginationPage(
      [{ id: 'a' }, { id: 'a' }],
      { page: 1, total: 2, hasNextPage: false },
      1,
      new Set(),
      0,
    ),
  );
  assert.throws(() =>
    validatePaginationPage(
      [{ id: 'b' }],
      { page: 2, total: 4, hasNextPage: false },
      2,
      new Set(['a']),
      1,
      3,
    ),
  );
  assert.throws(() =>
    validatePaginationPage(
      [{ id: 'a' }],
      { page: 1, total: 2, hasNextPage: false },
      1,
      new Set(),
      0,
    ),
  );
});
