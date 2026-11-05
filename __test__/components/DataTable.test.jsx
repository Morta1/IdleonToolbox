// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import DataTable from '@components/common/DataTable';
import { bandRows, changeTone, detailsUntil, nextSort, sortRows } from '@components/common/DataTable/layout';
import darkTheme from '../../styles/theme/darkTheme';

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

describe('DataTable bandRows', () => {
  it('groups rows under the band each names, in the order the bands first appear', () => {
    const [b1, a1, b2] = [{ r: 'b' }, { r: 'a' }, { r: 'b' }];
    expect(bandRows([b1, a1, b2], (row) => ({ key: row.r }))).toEqual([{ key: 'b', rows: [b1, b2] }, { key: 'a', rows: [a1] }]);
  });
});

describe('DataTable detailsUntil', () => {
  it.each([
    [[{}, {}], 0, 1, 'sm'],
    [[{}, {}, {}], 0, 1, 'md'],
    [[{}], -1, 0, 'sm'],
    [[{}, {}, { phone: true }], 0, 1, 'sm'],
    [[{}, {}, { from: 'sm' }, { from: 'sm' }], 0, 1, 'sm'],
    [[{}, {}, {}, { from: 1000 }], 0, 1, 1000],
    [[{ from: { room: 300 } }, { from: { room: 500 } }], 0, 1, { room: 500 }]
  ])('ends the chevron for %o (primary %i, secondary %i) at %s', (columns, primary, secondary, expected) => {
    expect(detailsUntil(columns, primary, secondary)).toEqual(expected);
  });
});

describe('DataTable mutedWord', () => {
  // One column a phone keeps (v) and one it hides (w), so the word's place and the row's chevron both show.
  const columns = [
    { key: 'n', label: 'Name', value: (row) => row.n },
    { key: 'v', label: 'V', kind: 'amount', value: (row) => row.v },
    { key: 'w', label: 'W', kind: 'amount', from: 'md', value: (row) => row.w }
  ];
  const rows = [{ n: 'live', v: 1, w: 2 }, { n: 'locked', v: 3, w: 4 }, { n: 'word', v: 5, w: 6 }];

  it('dims a row by muted or by a word, and only the word replaces its values and its way in', () => {
    const { container } = render(<ThemeProvider theme={darkTheme}>
      <DataTable columns={columns} rows={rows} rowKey={'n'} muted={(row) => row.n === 'locked'}
                 mutedWord={(row) => (row.n === 'word' ? 'Empty' : null)}/>
    </ThemeProvider>);
    expect([...container.querySelectorAll('tr.row')].map((row) => [
      row.className, [...row.querySelectorAll('td')].slice(0, 3).map((cell) => cell.textContent), Boolean(row.querySelector('.expand-button'))
    ])).toEqual([
      ['row', ['live', '1', '2'], true],
      ['row muted', ['locked', '3', '4'], true],
      ['row muted word', ['word', 'Empty', '-'], false]
    ]);
  });
});
