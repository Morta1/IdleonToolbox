import { describe, expect, it } from 'vitest';
import { nextSort } from '@components/common/DataTable/layout';

describe('DataTable sort', () => {
  it.each([
    [null, { key: 'cost', order: 'asc' }],
    [{ key: 'cost', order: 'asc' }, { key: 'cost', order: 'desc' }],
    [{ key: 'cost', order: 'desc' }, null],
    [{ key: 'name', order: 'desc' }, { key: 'cost', order: 'asc' }]
  ])('steps %o to %o on a Cost header click', (current, expected) => {
    expect(nextSort(current, { key: 'cost', sortable: true, firstOrder: 'asc' })).toEqual(expected);
  });
});
