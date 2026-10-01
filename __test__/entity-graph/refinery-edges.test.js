import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { refineryEdges } from '../../scripts/entity-graph/edges/refinery.mjs';

const refinery = {
  Refinery1: { cost: [{ rawName: 'Grasslands1', quantity: 10 }, { rawName: 'Copper', quantity: 5 }] },
  Refinery9: { cost: [{ rawName: 'FillerMaterial', quantity: 5 }, { rawName: 'Refinery8', quantity: 2 }] }
};

describe('refineryEdges', () => {
  it('links a salt to each ingredient with its rank-one quantity', () => {
    expect(refineryEdges(refinery)).toContainEqual({
      from: 'item:Refinery1', to: 'item:Grasslands1', rel: 'refinedFrom', meta: { quantity: 10 }, source: 'refinery'
    });
  });

  it('links a salt made from another salt', () => {
    expect(refineryEdges(refinery).map((edge) => edge.to)).toContain('item:Refinery8');
  });

  // A real item row, so it would resolve and print as an ingredient.
  it('skips the FillerMaterial padding', () => {
    expect(refineryEdges(refinery).map((edge) => edge.to)).not.toContain('item:FillerMaterial');
  });
});

describe('the built graph', () => {
  const graph = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'entity-graph.json'), 'utf-8'));
  const edges = graph.edges.filter((edge) => edge.rel === 'refinedFrom');

  it('gives every salt a recipe, and every ingredient resolves to an item', () => {
    const salts = new Set(edges.map((edge) => edge.from));
    expect(salts.size).toBe(9);
    expect(edges.every((edge) => graph.nodes[edge.to]?.kind === 'item')).toBe(true);
    expect(edges.some((edge) => edge.to === 'item:FillerMaterial')).toBe(false);
  });
});
