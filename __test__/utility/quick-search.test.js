import { describe, expect, it } from 'vitest';
import { addRecent, emptyBox, recentEntry, searchToolbox, wikiMatches } from '@utility/search/quickSearch';

describe('searchToolbox', () => {
  it.each([
    ['cooking', {}],
    ['meals', { t: 'Meals' }],
    ['cooking kitchens', { t: 'Kitchens' }]
  ])('"%s" finds Cooking once, opening %o', (term, query) => {
    const pages = searchToolbox(term).groups.find((group) => group.key === 'pages');
    const cooking = pages.rows.filter((row) => row.label === 'Cooking');
    expect(cooking.map((row) => row.href.query)).toEqual([query]);
  });
});

describe('emptyBox', () => {
  it('lists the pins in order, then the pages left most recently, once each, without pins or the page on screen', () => {
    const pins = [{ url: '/account/world-5/sailing', name: 'sailing' }, { url: '/account/world-3/refinery', name: 'refinery' }];
    const visits = [
      '/account/world-2/bubbles?demo=true', '/account/world-4/cooking?t=Meals', '/account/world-5/sailing',
      '/account/world-1/stamps', '/account/world-4/cooking?demo=true&t=Kitchens', '/account/world-1/anvil'
    ];
    const recent = visits.map(recentEntry).reduce(addRecent, []);
    const box = emptyBox({ pins, recent, currentUrl: '/account/world-1/anvil' });
    expect([...box.pins, ...box.recent].map(({ label, note }) => [label, note])).toEqual([
      ['Sailing', 'World 5'], ['Refinery', 'World 3'],
      ['Cooking', 'World 4 · Kitchens tab'], ['Stamps', 'World 1'], ['Bubbles', 'World 2']
    ]);
  });
});

describe('close matches', () => {
  it.each([
    ['drp rate', 'drop rate'],
    ['coking', 'cooking'],
    ['nonexistent tool zzz', undefined]
  ])('"%s" reads as %s', (term, closeTo) => {
    expect(searchToolbox(term).closeTo).toBe(closeTo);
  });
});

describe('wikiMatches', () => {
  const entries = [
    { id: 'm:1', kind: 'monster', label: 'Green Mushroom', slug: 'green-mushroom' },
    { id: 'q:1', kind: 'quest', label: 'Mushroom Munchies', slug: 'mushroom-munchies' },
    { id: 'i:1', kind: 'item', label: 'Mush', slug: 'mush' },
    { id: 'i:2', kind: 'item', label: 'Mushie', slug: null },
    { id: 'v:1', kind: 'vial', label: 'MUSHROOM SOUP', slug: 'mushroom-soup' },
    { id: 'i:3', kind: 'item', label: 'Copper Ore', slug: 'copper-ore' }
  ];
  it.each([
    ['mush', ['Mush', 'Mushroom Munchies', 'MUSHROOM SOUP', 'Green Mushroom']],
    ['m', []]
  ])('"%s" ranks the exact name, then names that start with it, then word starts', (term, labels) => {
    expect(wikiMatches(entries, term).map(({ label }) => label)).toEqual(labels);
  });
});
