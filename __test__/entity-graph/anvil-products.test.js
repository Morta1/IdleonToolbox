import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { anvilProductEdges } from '../../scripts/entity-graph/edges/anvil.mjs';

const anvilProducts = {
  0: { rawName: 'CraftMat1', requiredAmount: 100, levelReq: 1, exp: 6 },
  1: { rawName: 'CraftMat5', requiredAmount: 200, levelReq: 5, exp: 10 },
  2: { rawName: 'CraftMat15', requiredAmount: 1, levelReq: 999, exp: 0 }
};
const items = {
  CraftMat1: { displayName: 'Thread' },
  CraftMat5: { displayName: 'Trusty_Nails' },
  CraftMat15: { displayName: 'Filler' }
};

describe('anvilProductEdges', () => {
  it('links the anvil to each product with the Smithing level it needs', () => {
    expect(anvilProductEdges(anvilProducts, items)).toContainEqual({
      from: 'station:anvil', to: 'item:CraftMat5', rel: 'produces', meta: { levelReq: 5 }, source: 'anvil'
    });
  });

  it('skips the Filler slots the game never unlocks', () => {
    expect(anvilProductEdges(anvilProducts, items).map((edge) => edge.to)).not.toContain('item:CraftMat15');
  });

  it('emits nothing without product data', () => {
    expect(anvilProductEdges(undefined, items)).toEqual([]);
  });
});

describe('the built graph', () => {
  const graph = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'entity-graph.json'), 'utf-8'));
  const edges = graph.edges.filter((edge) => edge.rel === 'produces');

  it('gives the anvil a page that lists its real products', () => {
    expect(graph.nodes['station:anvil']?.slug).toBe('anvil');
    expect(edges.length).toBeGreaterThan(10);
    expect(edges.every((edge) => edge.from === 'station:anvil' && graph.nodes[edge.to]?.kind === 'item')).toBe(true);
    expect(edges.some((edge) => graph.nodes[edge.to]?.name === 'Filler')).toBe(false);
  });

  // The edge is now the source, so the fallback label must not also print.
  it('drops the Anvil production label from the products', () => {
    expect(edges.some((edge) => graph.nodes[edge.to]?.obtainedFrom)).toBe(false);
  });
});
