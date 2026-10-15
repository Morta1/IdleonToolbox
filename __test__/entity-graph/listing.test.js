import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { LISTED_KINDS, inListing } from '../../utility/wiki/kinds.mjs';
import { NO_MAX, listingCells, listingColumns, listingEntries } from '../../utility/wiki/listing.mjs';

const graph = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'entity-graph.json'), 'utf-8'));

describe('listingEntries', () => {
  // The hub counts every kind with inListing; a listing that filtered its rows any other way would show a
  // count its own page does not have.
  it('lists exactly the rows inListing counts, per listed kind', () => {
    const byKind = (idsOf) => Object.fromEntries(LISTED_KINDS.map((kind) => [kind, idsOf(kind)]));
    expect(byKind((kind) => listingEntries(graph, kind).entries.map((entry) => entry.id).sort()))
      .toEqual(byKind((kind) => Object.entries(graph.nodes)
        .filter(([, node]) => node.kind === kind && inListing(node))
        .map(([id]) => id)
        .sort()));
  });

  // Every value cell a header can sort is a plain number, the no-max marker or nothing: a string there would sort as
  // text beside numbers.
  it('gives every kind unique keys, one cell per column and sortable number cells', () => {
    const problems = LISTED_KINDS.flatMap((kind) => {
      const { columns, entries } = listingEntries(graph, kind);
      const keys = ['name', ...columns.map((column) => column.key)];
      const numeric = columns.flatMap((column, at) => (column.type === 'number' || column.type === 'max' ? [at] : []));
      return [
        ...(new Set(keys).size === keys.length ? [] : [`${kind}: duplicate keys ${keys.join(', ')}`]),
        ...entries.filter((entry) => entry.cells.length !== columns.length).map((entry) => `${entry.id}: ${entry.cells.length} cells`),
        ...entries.flatMap((entry) => numeric
          .filter((at) => !(entry.cells[at] === null || entry.cells[at] === NO_MAX || Number.isFinite(entry.cells[at])))
          .map((at) => `${entry.id}: ${columns[at].key} = ${entry.cells[at]}`))
      ];
    });
    expect(problems).toEqual([]);
  });
});

describe('listingColumns', () => {
  // The labels each kind's listing shows. The four kinds whose registry rows started writing numbers (rift,
  // mineheadopponent, observation, advicefish) join once the graph is rebuilt with them.
  it('derives the columns from the graph', () => {
    const kinds = ['item', 'monster', 'pet', 'bundle', 'world', 'talent', 'vault', 'sushiupgrade', 'tome', 'armorset', 'totem', 'summoningupgrade'];
    expect(Object.fromEntries(kinds.map((kind) => [kind, listingEntries(graph, kind).columns.map((column) => column.label)]))).toEqual({
      item: ['Type', 'Level', 'Sell Price'],
      monster: ['Section', 'Health', 'Experience', 'Attack', 'Def for 0'],
      pet: ['Category', 'Power', 'Upgraded power', 'Pet Mart+ cost'],
      bundle: ['Category', 'Price', 'Gems'],
      world: [],
      talent: ['Category', 'Effect'],
      vault: ['Description'],
      sushiupgrade: ['Effect', 'Cost', 'Max level', 'Research level needed'],
      tome: ['Account level needed', 'Points at a full bar', 'Most points possible'],
      armorset: ['Description', 'Pieces to wear', 'Armor pieces', 'Tools', 'Weapon'],
      totem: ['Description', 'Worship level needed', 'Charge to summon', 'Worship efficiency for bonus souls', 'Worship EXP per wave (before multipliers)'],
      summoningupgrade: ['Effect', 'Cost', 'Max level', 'Essence']
    });
  });

  const row = (fields) => ({ kind: 'synthetic', fields });
  const field = (value, extra = {}) => [{ label: 'Field', value, ...extra }];
  const long = 'x'.repeat(40);

  // One field over four rows, against the field step of the rule.
  it.each([
    ['a number on 3 of 4 rows is a number column', [field(1), field(2), field(3), []], [{ key: 'field', label: 'Field', type: 'number', sortable: true }]],
    ['a number on 1 of 4 rows is no column', [field(1), [], [], []], []],
    ['a single value is no column', [field(5), field(5), field(5), field(5)], []],
    ['a string with links is no column', [field('Map A', { links: ['map:1'] }), field('Map B', { links: ['map:2'] }), field('Map A', { links: ['map:1'] }), []], []],
    ['a 40-character string is no column', [field(long), field(`${long}y`), field(long), []], []],
    ['three short repeated strings are a text column', [field('Red'), field('Blue'), field('Red'), []], [{ key: 'field', label: 'Field', type: 'text', sortable: true }]],
    ['all values distinct is no column', [field('A'), field('B'), field('C'), field('D')], []]
  ])('%s', (title, fieldsPerRow, expected) => {
    expect(listingColumns('synthetic', fieldsPerRow.map(row))).toEqual(expected);
  });

  it('gives an override kind its own columns whatever the rows carry', () => {
    const bundles = [
      { kind: 'bundle', category: 'Gem Shop', description: 'A pack', price: 4.99, gems: 100, fields: [{ label: 'Field', value: 1 }] },
      { kind: 'bundle', category: 'Pet Mart', description: 'A pet', price: 9.99, gems: 0, fields: [{ label: 'Field', value: 2 }] }
    ];
    const columns = listingColumns('bundle', bundles);
    expect({
      keys: columns.map((column) => column.key),
      cells: bundles.map((node) => listingCells(columns, node))
    }).toEqual({
      keys: ['category', 'price', 'gems'],
      cells: [['Gem Shop', 4.99, 100], ['Pet Mart', 9.99, null]]
    });
  });

  const cost = (base) => ({ currency: 'Coins', formula: 'pow', args: { base, rate: 2 } });
  const upgrade = (at) => ({
    kind: 'synthetic',
    category: at % 2 ? 'Odd' : 'Even',
    description: 'Gives +{ power',
    effect: { cap: 10 + at, terms: [{ token: '{', formula: 'linear', args: { perLevel: at + 1 } }] },
    cost: cost(10 * (at + 1)),
    fields: [{ label: 'One', value: at }, { label: 'Two', value: at + 1 }, { label: 'Three', value: at + 2 }]
  });

  it('keeps the first five columns in step order', () => {
    expect(listingColumns('synthetic', [0, 1, 2, 3].map(upgrade)).map((column) => column.label))
      .toEqual(['Category', 'Effect', 'Cost', 'Max level', 'One']);
  });

  it('drops a Cost column whose first level costs every row the same', () => {
    const rows = [0, 1, 2, 3].map((at) => ({ ...upgrade(at), cost: cost(50) }));
    expect(listingColumns('synthetic', rows).map((column) => column.key)).toEqual(['category', 'effect', 'max-level', 'one', 'two']);
  });

  it('reads a row with no max level as above every cap', () => {
    const rows = [0, 1, 2, 3].map((at) => ({ kind: 'synthetic', effect: at < 2 ? { cap: 5 * (at + 1), terms: [] } : { cap: null, noMax: true, terms: [] } }));
    const columns = listingColumns('synthetic', rows);
    expect({ columns, cells: rows.map((node) => listingCells(columns, node)) }).toEqual({
      columns: [{ key: 'max-level', label: 'Max level', type: 'max', sortable: true }],
      cells: [[5], [10], [NO_MAX], [NO_MAX]]
    });
  });
});
