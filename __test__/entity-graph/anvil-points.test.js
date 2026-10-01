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
  it('gives the first material the points up to its threshold', () => {
    expect(anvilPoints(costs).get('Grasslands1')).toEqual({ from: 1, to: 5 });
  });

  it('starts each later material one past the previous threshold', () => {
    expect(anvilPoints(costs).get('Grasslands2')).toEqual({ from: 6, to: 15 });
  });

  it('leaves the last material open-ended', () => {
    expect(anvilPoints(costs).get('GalaxyC4')).toEqual({ from: 16, to: null });
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
