import { describe, it, expect } from 'vitest';
import { indexGraph } from '../../utility/wiki/graph';
import { searchEntities } from '../../utility/wiki/search';

const graph = {
  nodes: {
    'item:Copper': { kind: 'item', rawName: 'Copper', name: 'Copper_Ore' },
    'item:CopperBar': { kind: 'item', rawName: 'CopperBar', name: 'Copper_Bar' },
    'monster:mushG': { kind: 'monster', rawName: 'mushG', name: 'Green_Mushroom' },
    'item:COIN': { kind: 'item', rawName: 'COIN', name: 'Coin', navigable: false },
  },
  edges: [
    { from: 'monster:mushG', to: 'item:Copper', rel: 'drops', meta: { chance: 1 } },
  ],
};

describe('indexGraph', () => {
  it('indexes edges both directions', () => {
    const { edgesFrom, edgesTo, byId } = indexGraph(graph);
    expect(edgesFrom.get('monster:mushG')).toHaveLength(1);
    expect(edgesTo.get('item:Copper')[0].from).toBe('monster:mushG');
    expect(byId['item:Copper'].name).toBe('Copper_Ore');
  });

  // Coin exists only to label a drop row. Leaving it in the search list would also put it in the
  // Items category count and the browse list, offering a page there is no reason to open.
  it('keeps a row-label node out of the search list but still resolvable by id', () => {
    const { searchList, byId } = indexGraph(graph);
    expect(searchList.find((entry) => entry.id === 'item:COIN')).toBeUndefined();
    expect(byId['item:COIN'].name).toBe('Coin');
  });

  it('builds a search list with space-normalized labels', () => {
    const { searchList } = indexGraph(graph);
    expect(searchList).toContainEqual({ id: 'item:Copper', kind: 'item', label: 'Copper Ore' });
  });
});

describe('searchEntities', () => {
  it('ranks prefix matches above substring matches, case-insensitive', () => {
    const { searchList } = indexGraph(graph);
    const results = searchEntities(searchList, 'copper');
    expect(results[0].id).toBe('item:Copper');
    expect(results.map(r => r.id)).toContain('item:CopperBar');
  });

  it('returns empty for empty query', () => {
    const { searchList } = indexGraph(graph);
    expect(searchEntities(searchList, '  ')).toEqual([]);
  });

  // Typing a name in full should land it first. Both of these are prefix matches, so without an
  // exact bucket the winner is whichever the graph happened to list first.
  it('ranks an exact match above a longer prefix match that precedes it', () => {
    const searchList = [
      { id: 'item:CopperOreBar', kind: 'item', label: 'Copper Ore Bar' },
      { id: 'item:Copper', kind: 'item', label: 'Copper Ore' }
    ];
    expect(searchEntities(searchList, 'Copper Ore')[0].id).toBe('item:Copper');
  });

  // The exact match can sit past the limit-th prefix match, so the scan cannot stop early.
  it('finds an exact match sitting beyond the result limit', () => {
    const searchList = Array.from({ length: 40 }, (_, i) => ({
      id: `item:Filler${i}`, kind: 'item', label: `Copper Ore ${i}`
    })).concat({ id: 'item:Copper', kind: 'item', label: 'Copper Ore' });
    expect(searchEntities(searchList, 'copper ore')[0].id).toBe('item:Copper');
  });
});
