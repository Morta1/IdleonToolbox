import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { entityNeighbourhood } from '../../utility/wiki/page-graph';
import { staticNeighbourhood } from '../../utility/wiki/static-graph.mjs';

// Two implementations of one slice: page-graph scans, static-graph reads a prebuilt index because
// the export calls it 3,466 times. They have already drifted twice, and both times the symptom was
// a section that silently rendered nothing rather than an error: static-graph kept its own
// hardcoded list of second-hop relations while page-graph's grew. This is the guard.
const graph = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'entity-graph.json'), 'utf-8'));

const key = (edge) => `${edge.from}|${edge.rel}|${edge.to}`;

// An NPC with quests that both pay out and ask for items, a monster, and an item: between them they
// exercise every branch either implementation has.
const IDS = ['npc:Picnic_Stowaway', 'monster:mushG', 'item:COIN'];

describe('the two slice builders agree', () => {
  for (const id of IDS) {
    it(`produces the same neighbourhood for ${id}`, () => {
      const scanned = entityNeighbourhood(graph, id);
      const indexed = staticNeighbourhood(id);
      expect(indexed).not.toBeNull();
      expect(Object.keys(indexed.nodes).sort()).toEqual(Object.keys(scanned.nodes).sort());
      expect(indexed.edges.map(key).sort()).toEqual(scanned.edges.map(key).sort());
    });
  }
});
