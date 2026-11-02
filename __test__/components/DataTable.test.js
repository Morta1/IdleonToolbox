import { describe, expect, it } from 'vitest';
import { changeTone, nextSort, sortRows } from '@components/common/DataTable/layout';

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

const ROWS = [{ n: 'b', v: 2 }, { n: 'a', v: null }, { n: 'c', v: 9, locked: true }, { n: 'B10', v: 2 }];
const COLUMNS = [{ key: 'n', value: (row) => row.n }, { key: 'v', value: (row) => row.v }];
const names = (rows) => rows.map((row) => row.n);

describe('DataTable sortRows', () => {
  it.each([
    [null, ['b', 'a', 'c', 'B10']],
    [{ key: 'v', order: 'desc' }, ['b', 'B10', 'a', 'c']],
    [{ key: 'v', order: 'asc' }, ['b', 'B10', 'a', 'c']],
    [{ key: 'n', order: 'asc' }, ['a', 'b', 'B10', 'c']]
  ])('orders %o, missing last, ties as given, the locked row after the rest', (sort, expected) => {
    expect(names(sortRows(ROWS, COLUMNS, sort, (row) => row.locked))).toEqual(expected);
  });

  it.each([
    [{ change: 'higher' }, 5, 'good'], [{ change: 'higher' }, -5, 'bad'], [{ change: 'lower' }, -5, 'good'], [{ change: 'higher' }, 0, null]
  ])('tones a %o change of %d as %s', (column, value, expected) => {
    expect(changeTone(column, value)).toBe(expected);
  });
});
