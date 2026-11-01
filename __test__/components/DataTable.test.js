import { describe, expect, it } from 'vitest';
import { nextSort } from '@components/common/DataTable/layout';

const COST = { key: 'cost', sortable: true, numeric: true };
const NAME = { key: 'name', sortable: true };

describe('DataTable sort', () => {
  it.each([
    [null, COST, { key: 'cost', order: 'desc' }],
    [{ key: 'cost', order: 'desc' }, COST, { key: 'cost', order: 'asc' }],
    [{ key: 'cost', order: 'asc' }, COST, null],
    [{ key: 'name', order: 'desc' }, COST, { key: 'cost', order: 'desc' }],
    [null, NAME, { key: 'name', order: 'asc' }]
  ])('steps %o on a %o header click to %o', (current, column, expected) => {
    expect(nextSort(current, column)).toEqual(expected);
  });
});
