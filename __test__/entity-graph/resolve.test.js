import { describe, it, expect } from 'vitest';
import { resolveEdges } from '../../scripts/entity-graph/resolve.mjs';

const nodes = {
  'monster:mushG': { kind: 'monster' },
  'item:Grasslands1': { kind: 'item' },
  'item:Copper': { kind: 'item' },
};

describe('resolveEdges', () => {
  it('keeps edges whose endpoints exist, strips source', () => {
    const raw = [{ from: 'monster:mushG', to: 'item:Grasslands1', rel: 'drops', meta: { chance: 1 }, source: 'drops' }];
    const { edges, unresolved } = resolveEdges(nodes, raw, { aliases: {}, ignore: new Set() });
    expect(edges).toEqual([{ from: 'monster:mushG', to: 'item:Grasslands1', rel: 'drops', meta: { chance: 1 } }]);
    expect(unresolved).toEqual([]);
  });

  it('applies aliases before matching', () => {
    const raw = [{ from: 'monster:mushG', to: 'item:CopperOre', rel: 'drops', meta: {}, source: 'drops' }];
    const { edges, unresolved } = resolveEdges(nodes, raw, { aliases: { 'item:CopperOre': 'item:Copper' }, ignore: new Set() });
    expect(edges[0].to).toBe('item:Copper');
    expect(unresolved).toEqual([]);
  });

  it('silently drops ignored ids, reports unknown ids', () => {
    const raw = [
      { from: 'monster:mushG', to: 'item:COIN', rel: 'drops', meta: {}, source: 'drops' },
      { from: 'monster:mushG', to: 'item:Nope', rel: 'drops', meta: {}, source: 'drops' },
    ];
    const { edges, unresolved } = resolveEdges(nodes, raw, { aliases: {}, ignore: new Set(['item:COIN']) });
    expect(edges).toEqual([]);
    expect(unresolved).toEqual([{ id: 'item:Nope', source: 'drops', from: 'monster:mushG', to: 'item:Nope', rel: 'drops' }]);
  });

  it('still reports the other endpoint when an edge touches an ignored id', () => {
    const raw = [{ from: 'monster:ghost', to: 'item:COIN', rel: 'drops', meta: {}, source: 'drops' }];
    const { edges, unresolved } = resolveEdges(nodes, raw, { aliases: {}, ignore: new Set(['item:COIN']) });
    expect(edges).toEqual([]);
    expect(unresolved).toEqual([{ id: 'monster:ghost', source: 'drops', from: 'monster:ghost', to: 'item:COIN', rel: 'drops' }]);
  });

  it('reports a missing endpoint on either side of an ignored id', () => {
    const raw = [{ from: 'monster:GiantMobzz69', to: 'item:Nope', rel: 'drops', meta: {}, source: 'drops' }];
    const { edges, unresolved } = resolveEdges(nodes, raw, { aliases: {}, ignore: new Set(['monster:GiantMobzz69']) });
    expect(edges).toEqual([]);
    expect(unresolved).toEqual([{ id: 'item:Nope', source: 'drops', from: 'monster:GiantMobzz69', to: 'item:Nope', rel: 'drops' }]);
  });

  it('never reports an ignored id itself, on either side', () => {
    const raw = [
      { from: 'monster:mushG', to: 'item:COIN', rel: 'drops', meta: {}, source: 'drops' },
      { from: 'monster:GiantMobzz69', to: 'item:COIN', rel: 'drops', meta: {}, source: 'drops' },
    ];
    const ignore = new Set(['item:COIN', 'monster:GiantMobzz69']);
    const { edges, unresolved } = resolveEdges(nodes, raw, { aliases: {}, ignore });
    expect(edges).toEqual([]);
    expect(unresolved).toEqual([]);
  });
});
