import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { LISTED_KINDS, inListing } from '../../utility/wiki/kinds.mjs';
import { listingCells, listingColumns, listingEntries } from '../../utility/wiki/listing.mjs';
import { NO_MAX, nextSort, parseSort, sortColumn, sortEntries, sortQuery } from '../../utility/wiki/listing-sort.mjs';

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
  // text beside numbers. A cost amount is finite too, since JSON writes an overflow as null.
  it('gives every kind unique keys, one cell per column and sortable number cells', () => {
    const problems = LISTED_KINDS.flatMap((kind) => {
      const { columns, entries } = listingEntries(graph, kind);
      const keys = ['name', ...columns.map((column) => column.key)];
      const numeric = columns.flatMap((column, at) => (column.type === 'number' || column.type === 'max' ? [at] : []));
      const costs = columns.flatMap((column, at) => (column.type === 'cost' ? [at] : []));
      const costShape = (cell) => cell === null || (Array.isArray(cell) && cell.length > 0 && cell.every((cost) => Number.isFinite(cost.amount)
        && typeof cost.currency === 'string' && typeof cost.currencyKey === 'string'));
      return [
        ...(new Set(keys).size === keys.length ? [] : [`${kind}: duplicate keys ${keys.join(', ')}`]),
        ...entries.filter((entry) => entry.cells.length !== columns.length).map((entry) => `${entry.id}: ${entry.cells.length} cells`),
        ...entries.flatMap((entry) => numeric
          .filter((at) => !(entry.cells[at] === null || entry.cells[at] === NO_MAX || Number.isFinite(entry.cells[at])))
          .map((at) => `${entry.id}: ${columns[at].key} = ${entry.cells[at]}`)),
        ...entries.flatMap((entry) => costs
          .filter((at) => !costShape(entry.cells[at]))
          .map((at) => `${entry.id}: cost = ${JSON.stringify(entry.cells[at])}`))
      ];
    });
    expect(problems).toEqual([]);
  });
});

describe('listingColumns', () => {
  // The labels each kind's listing shows.
  it('derives the columns from the graph', () => {
    const kinds = ['item', 'monster', 'pet', 'bundle', 'world', 'talent', 'vault', 'sushiupgrade', 'tome', 'armorset', 'totem', 'summoningupgrade', 'rift', 'mineheadopponent', 'observation', 'advicefish'];
    expect(Object.fromEntries(kinds.map((kind) => [kind, listingEntries(graph, kind).columns.map((column) => column.label)]))).toEqual({
      item: ['Type', 'Level', 'Sell Price'],
      monster: ['Section', 'Health', 'Experience', 'Attack', 'Def for 0'],
      pet: ['Category', 'Power', 'Upgraded power', 'Pet Mart+ cost'],
      bundle: ['Category', 'Price', 'Gems'],
      world: [],
      talent: ['Category', 'Effect'],
      vault: ['Effect', 'Cost', 'Base max level'],
      sushiupgrade: ['Effect', 'Cost', 'Max level', 'Research level needed'],
      tome: ['Account level needed', 'Points at a full bar', 'Most points possible'],
      armorset: ['Description', 'Pieces to wear', 'Armor pieces', 'Tools', 'Weapon'],
      totem: ['Description', 'Worship level needed', 'Charge to summon', 'Worship efficiency for bonus souls', 'Worship EXP per wave (before multipliers)'],
      summoningupgrade: ['Effect', 'Cost', 'Max level', 'Essence'],
      rift: ['Description', 'Monster HP'],
      mineheadopponent: ['Description', 'HP'],
      observation: ['Effect', 'Research level needed', 'Research EXP per Magnifier'],
      advicefish: ['Effect', 'Cost', 'Account level needed']
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

describe('sortEntries', () => {
  const ids = ['a', 'b', 'c', 'd', 'e', 'f'];
  // Six rows in their default order, one cell each, per column type.
  const rows = (cells, labels = ids.map((id) => `Row ${id}`), disambigs = []) => ids.map((id, at) => ({
    id, label: labels[at], ...(disambigs[at] ? { disambig: disambigs[at] } : {}), cells: [cells[at]]
  }));
  const coins = (amount) => [{ amount, currency: 'Coins', currencyKey: 'Coins' }];
  const dust = (amount) => [{ amount, currency: 'Stardust', currencyKey: 'Stardust' }];
  const tables = {
    number: rows([3, null, 1, 2, 5, 4]),
    max: rows([3, NO_MAX, null, 1, NO_MAX, 2]),
    cost: rows([dust(5), coins(5), null, coins(10), dust(1), [{ amount: 1, currency: 'Coin', currencyKey: 'Coins' }, { amount: 3, currency: 'Stardust', currencyKey: 'Stardust' }]]),
    facet: rows(['Bosses', 'World 2', 'World 1', null, 'World 1', 'World 2']),
    text: rows(['Rank 10', 'Rank 5', null, 'rank 1', 'Alpha', 'Rank 5']),
    name: rows([], ['Brainhead', 'Amarok', 'Brainhead', 'Chizoar', 'Baby Boa', 'Bored Bean'], ['#22', null, '#21']),
    effect: rows(['+5 Damage', '+1 Damage', null, '+3 Damage', '+2 Damage', '+4 Damage'])
  };
  const ranks = { facetRank: { 'World 1': 0, 'World 2': 1, Bosses: 2 }, currencyRank: { Coins: 0, Stardust: 1 } };

  it.each([
    ['number', 'asc', 'cdafeb'],
    ['number', 'desc', 'efadcb'],
    ['max', 'asc', 'dfabec'],
    ['max', 'desc', 'beafdc'],
    ['cost', 'asc', 'fbdeac'],
    ['cost', 'desc', 'aedbfc'],
    ['facet', 'asc', 'cebfad'],
    ['facet', 'desc', 'abfced'],
    ['text', 'asc', 'edbfac'],
    ['text', 'desc', 'abfdec'],
    ['name', 'asc', 'befcad'],
    ['name', 'desc', 'dacfeb'],
    // Never sortable: the default order, whatever a caller asks.
    ['effect', 'asc', 'abcdef']
  ])('sorts a %s column %s', (type, order, expected) => {
    const column = type === 'name' ? { type } : { type, at: 0 };
    expect(sortEntries(tables[type], column, order, ranks).map((entry) => entry.id).join('')).toBe(expected);
  });

  // A first level costing exactly 1 prints the singular ("1 Meat Slice"); the sort still reads one currency as one
  // group, each in the order the default list meets it, its amounts rising.
  it.each(['bubbaupgrade', 'fountainupgrade'])('keeps every %s currency in one run', (kind) => {
    const { columns, entries } = listingEntries(graph, kind);
    const at = columns.findIndex((column) => column.type === 'cost');
    const keys = [...new Set(entries.map((entry) => entry.cells[at]?.[0]?.currencyKey).filter(Boolean))];
    const currencyRank = Object.fromEntries(keys.map((key, rank) => [key, rank]));
    const firsts = sortEntries(entries, { type: 'cost', at }, 'asc', { currencyRank }).map((entry) => entry.cells[at]?.[0]).filter(Boolean);
    expect({
      singularPrinted: new Set(firsts.map((cost) => cost.currency)).size > keys.length,
      runs: firsts.map((cost) => cost.currencyKey).filter((key, index, all) => key !== all[index - 1]),
      rising: firsts.every((cost, index) => index === 0 || cost.currencyKey !== firsts[index - 1].currencyKey || cost.amount >= firsts[index - 1].amount)
    }).toEqual({ singularPrinted: true, runs: keys, rising: true });
  });

  it('keeps tied rows in their default order both ways', () => {
    const tied = [2, 1, 2, 1].map((value, at) => ({ id: ids[at], label: ids[at], cells: [value] }));
    expect(['asc', 'desc'].map((order) => sortEntries(tied, { type: 'number', at: 0 }, order).map((entry) => entry.id).join('')))
      .toEqual(['bdac', 'acbd']);
  });
});

describe('sort URL', () => {
  const columns = [
    { key: 'cost', label: 'Cost', type: 'cost', sortable: true },
    { key: 'effect', label: 'Effect', type: 'effect', sortable: false }
  ];

  it.each([
    [{ sort: 'cost' }, { key: 'cost', order: 'asc' }],
    [{ sort: 'cost', order: 'desc' }, { key: 'cost', order: 'desc' }],
    // A kind with no sortable data column still sorts by name.
    [{ sort: 'name', order: 'desc' }, { key: 'name', order: 'desc' }],
    [{ sort: 'effect' }, null],
    [{ sort: 'nope' }, null],
    [{}, null]
  ])('reads %o as %o', (query, expected) => {
    expect(parseSort(query, columns)).toEqual(expected);
  });

  it('finds the sorted column with its cell position, and the name outside the columns', () => {
    expect(['effect', 'name', 'nope'].map((key) => sortColumn(columns, key))).toEqual([
      { ...columns[1], at: 1 },
      { key: 'name', label: 'Name', type: 'name', sortable: true },
      null
    ]);
  });

  // The pathname is listingHref(kind), which already carries the route params.
  it.each([
    [{ key: 'cost', order: 'desc' }, { demo: 'true', sort: 'cost', order: 'desc' }],
    [{ key: 'cost', order: 'asc' }, { demo: 'true', sort: 'cost' }],
    [null, { demo: 'true' }]
  ])('writes %o into the query', (sort, expected) => {
    expect(sortQuery({ kind: 'equinox', slug: 'upgrades', demo: 'true', sort: 'name' }, sort)).toEqual(expected);
  });

  it.each([
    [null, { key: 'cost', order: 'asc' }],
    [{ key: 'cost', order: 'asc' }, { key: 'cost', order: 'desc' }],
    [{ key: 'cost', order: 'desc' }, null],
    [{ key: 'name', order: 'desc' }, { key: 'cost', order: 'asc' }]
  ])('steps %o to %o on a Cost header click', (current, expected) => {
    expect(nextSort(current, 'cost')).toEqual(expected);
  });
});
