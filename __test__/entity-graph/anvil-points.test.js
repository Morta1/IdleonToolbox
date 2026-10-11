import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { anvilPoints } from '../../scripts/entity-graph/anvil-points.mjs';

const costs = [
  { costThreshold: 5, rawName: 'Grasslands1' },
  { costThreshold: 15, rawName: 'Grasslands2' },
  { costThreshold: 601, rawName: 'GalaxyC4' }
];

describe('anvilPoints', () => {
  // The first material runs up to its threshold, each later one starts one past the previous
  // threshold, and the last is open-ended.
  it('splits the anvil points between the materials by threshold', () => {
    expect(anvilPoints(costs)).toEqual(new Map([
      ['Grasslands1', { from: 1, to: 5 }],
      ['Grasslands2', { from: 6, to: 15 }],
      ['GalaxyC4', { from: 16, to: null }]
    ]));
  });
});

describe('the built graph', () => {
  const graph = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'entity-graph.json'), 'utf-8'));
  const sharedData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'website-data', 'shared-data.json'), 'utf-8'));

  it('annotates every anvil material', () => {
    const annotated = Object.values(graph.nodes).filter((node) => node.anvilPoints);
    expect(annotated).toHaveLength(sharedData.anvilUpgradeCost.length);
    expect(graph.nodes['item:Grasslands1'].anvilPoints).toEqual({ from: 1, to: 5 });
  });
});
