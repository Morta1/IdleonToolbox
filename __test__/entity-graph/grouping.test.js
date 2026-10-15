import { describe, it, expect } from 'vitest';
import { chooseGrouping, facetReader, groupEntries } from '../../utility/wiki/grouping';

const repeat = (value, times) => Array.from({ length: times }, () => value);

describe('chooseGrouping', () => {
  // Talents come in 27 class tabs of about fifteen, which is how a player already thinks of them.
  const classes = Array.from({ length: 27 }, (_, tab) => `Class ${tab}`)
    .flatMap((name) => Array.from({ length: 14 }, () => name));

  it.each([
    // The ceiling is about noise, not about the number itself. A caller raises it where the facet is
    // the game's own structure, and a flat A-Z of 376 names is the unreadable option.
    ['refuses a facet past the default ceiling', classes, undefined, 'none'],
    ['takes that facet when the caller raises the ceiling', classes, { facetMax: 40 }, 'facet'],
    // Raising the ceiling does not switch the other guards off: a facet that does not divide the set
    // is still refused however many values it has.
    ['still refuses a facet one value dominates, whatever the ceiling',
      [...Array(200).fill('Monster'), 'Ore', 'Fish', 'Log'], { facetMax: 40 }, 'none'],
    // All 162 maps carry a world, spread 41/24/21/17/17/17/25. This is the case the facet was for.
    ['uses the facet when it divides the set evenly enough', [
      ...repeat('World 1', 41), ...repeat('World 2', 24), ...repeat('World 3', 21),
      ...repeat('World 4', 17), ...repeat('World 5', 17), ...repeat('World 6', 17),
      ...repeat('World 7', 25)
    ], undefined, 'facet'],
    // 324 of 398 monsters are the category "Monster". Banding by it gives one band and four slivers.
    ['gives up on the facet when one value swallows the set', [
      ...repeat('Monster', 324), ...repeat('Ore', 22), ...repeat('Fish', 19),
      ...repeat('Tree', 18), ...repeat('Bug', 15)
    ], undefined, 'none'],
    // Items have 112 distinct categories: past a dozen the bands are the noise.
    ['gives up when there are too many values',
      Array.from({ length: 200 }, (unused, i) => `Type${i % 112}`), undefined, 'none'],
    ['gives up when there is no category at all', repeat(null, 348), undefined, 'none'],
    ['gives up on an empty list', [], undefined, 'none'],
    // A partly-populated facet would put every entity missing one into a single Other band, which is
    // the exact shape the dominance rule exists to avoid.
    ['gives up when only some entities carry a category',
      [...repeat('World 1', 30), ...repeat('World 2', 30), ...repeat(null, 40)], undefined, 'none'],
    ['needs more than one value to be worth banding', repeat('Shop', 9), undefined, 'none']
  ])('%s', (title, categories, options, expected) => {
    expect(chooseGrouping(categories, options)).toBe(expected);
  });
});

describe('groupEntries', () => {
  const entries = [
    { id: 'a', label: 'Amarok' },
    { id: 'b', label: 'Bored Bean' },
    { id: 'c', label: '12 Hr Time Candy' },
    { id: 'd', label: 'Baby Boa' }
  ];

  // There is no letter banding any more: a kind with no facet reads as one list.
  it('returns the whole list as one band when there is no facet', () => {
    const bands = groupEntries(entries, 'none');
    expect(bands).toHaveLength(1);
    expect(bands[0].label).toBe('');
    expect(bands[0].entries).toHaveLength(entries.length);
  });

  it('bands by the facet when asked', () => {
    const withCategory = [
      { id: 'a', label: 'Blunder Hills', category: 'World 1' },
      { id: 'b', label: 'Spore Meadows', category: 'World 1' },
      { id: 'c', label: 'YumYum Grotto', category: 'World 2' }
    ];
    const bands = groupEntries(withCategory, 'facet', (entry) => entry.category);
    expect(bands.map((band) => [band.key, band.entries.length])).toEqual([['World 1', 2], ['World 2', 1]]);
  });
});

describe('facetReader', () => {
  const monster = { kind: 'monster', category: 'Monster', section: 'Bosses', world: 2 };
  const npc = { kind: 'npc', category: 'NPC', world: 3 };
  const soul = { kind: 'npc', category: 'NPC' };
  const item = { kind: 'item', category: 'HAT' };

  // One rule: a kind that carries a world or a section bands by it, every other kind by its category.
  it.each([
    ['a monster row reads its section', [monster], monster, { byWorld: true, facet: 'Bosses' }],
    ['an NPC row reads its world', [npc, soul], npc, { byWorld: true, facet: 'World 3' }],
    ['an item row reads its category', [item], item, { byWorld: false, facet: 'HAT' }],
    ['a row with neither in a world kind reads nothing', [npc, soul], soul, { byWorld: true, facet: null }]
  ])('%s', (title, rows, row, expected) => {
    const { byWorld, facetOf } = facetReader(rows);
    expect({ byWorld, facet: facetOf(row) }).toEqual(expected);
  });
});
