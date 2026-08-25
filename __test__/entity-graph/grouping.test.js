import { describe, it, expect } from 'vitest';
import { chooseGrouping, groupEntries } from '../../utility/wiki/grouping';

const repeat = (value, times) => Array.from({ length: times }, () => value);

describe('chooseGrouping', () => {
  // All 162 maps carry a world, spread 41/24/21/17/17/17/25. This is the case the facet was for.
  it('uses the facet when it divides the set evenly enough', () => {
    const categories = [
      ...repeat('World 1', 41), ...repeat('World 2', 24), ...repeat('World 3', 21),
      ...repeat('World 4', 17), ...repeat('World 5', 17), ...repeat('World 6', 17),
      ...repeat('World 7', 25)
    ];
    expect(chooseGrouping(categories)).toBe('facet');
  });

  // 324 of 398 monsters are the category "Monster". Banding by it gives one band and four slivers.
  it('gives up on the facet when one value swallows the set', () => {
    const categories = [
      ...repeat('Monster', 324), ...repeat('Ore', 22), ...repeat('Fish', 19),
      ...repeat('Tree', 18), ...repeat('Bug', 15)
    ];
    expect(chooseGrouping(categories)).toBe('none');
  });

  // Items have 112 distinct categories: past a dozen the bands are the noise.
  it('gives up when there are too many values', () => {
    expect(chooseGrouping(Array.from({ length: 200 }, (unused, i) => `Type${i % 112}`))).toBe('none');
  });

  it('gives up when there is no category at all', () => {
    expect(chooseGrouping(repeat(null, 348))).toBe('none');
    expect(chooseGrouping([])).toBe('none');
  });

  // A partly-populated facet would put every entity missing one into a single Other band, which is
  // the exact shape the dominance rule exists to avoid.
  it('gives up when only some entities carry a category', () => {
    expect(chooseGrouping([...repeat('World 1', 30), ...repeat('World 2', 30), ...repeat(null, 40)]))
      .toBe('none');
  });

  it('needs more than one value to be worth banding', () => {
    expect(chooseGrouping(repeat('Shop', 9))).toBe('none');
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

  it('keeps every entry exactly once', () => {
    const bands = groupEntries(entries, 'none');
    expect(bands.flatMap((band) => band.entries)).toHaveLength(entries.length);
  });
});
