import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { stampEdges } from '../../scripts/entity-graph/edges/stamps.mjs';

const stamps = {
  combat: {
    0: { rawName: 'StampA1', displayName: 'Sword_Stamp', itemReq: [{ rawName: 'Grasslands1', name: 'Spore_Cap' }] },
    1: { rawName: 'StampA2', displayName: 'Heart_Stamp', itemReq: [{ rawName: 'Blank' }] }
  },
  skills: {
    0: { rawName: 'StampB1', displayName: 'Pickaxe_Stamp', itemReq: [{ rawName: 'Copper' }] }
  }
};

describe('stampEdges', () => {
  it('links a stamp to the material it is upgraded with', () => {
    expect(stampEdges(stamps)).toContainEqual({
      from: 'item:StampA1', to: 'item:Grasslands1', rel: 'upgradedWith', meta: {}, source: 'stamps'
    });
  });

  // A stamp is upgraded with an item exactly as a vial or a bubble is, so it shares the relation
  // rather than adding a near-duplicate of it.
  it('uses the same relation the alchemy upgrades use', () => {
    expect(stampEdges(stamps).every((edge) => edge.rel === 'upgradedWith')).toBe(true);
  });

  it('skips the Blank padding slot rather than emitting an edge to nothing', () => {
    expect(stampEdges(stamps).map((edge) => edge.from)).not.toContain('item:StampA2');
  });

  it('reads every stamp group, not just the first', () => {
    expect(stampEdges(stamps).map((edge) => edge.from)).toContain('item:StampB1');
  });
});

describe('the built graph', () => {
  const graph = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'entity-graph.json'), 'utf-8'));
  // `source` is a build-time hint that resolveEdges strips, so a stamp edge is identified the way
  // it actually survives: an upgradedWith whose FROM side is the stamp item itself.
  const isStamp = (id) => graph.nodes[id]?.stamp;
  const edges = (graph.edges || []).filter((edge) => edge.rel === 'upgradedWith' && isStamp(edge.from));

  // Every stamp names a material and every one of them resolves, so a short count means the build
  // silently dropped some.
  it('links all 128 stamps', () => {
    expect(edges).toHaveLength(128);
    expect(edges.every((edge) => graph.nodes[edge.to])).toBe(true);
  });

  // The point of the edge: the material's own page can now name what wants it.
  it('gives Spore Cap its stamps', () => {
    const wants = edges.filter((edge) => edge.to === 'item:Grasslands1').map((edge) => edge.from);
    expect(wants).toContain('item:StampA1');
  });
});
