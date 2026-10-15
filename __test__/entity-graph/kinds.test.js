import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { LISTED_KINDS, hasListing } from '../../utility/wiki/kinds.mjs';
import { SECOND_HOP_RELS } from '../../utility/wiki/page-graph';
import { WORLD_NAMES } from '../../scripts/entity-graph/nodes/worlds.mjs';
import { ROWS } from '../../scripts/entity-graph/registry/index.mjs';

const graph = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'entity-graph.json'), 'utf-8'));
const nodes = Object.entries(graph.nodes).filter(([, node]) => node.navigable !== false);
const shared = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'website-data', 'shared-data.json'), 'utf-8'));

describe('listed kinds', () => {
  // Quests have no catalog (a name means nothing without its giver), but the pages stay. Dropping
  // the listing costs nothing: the NPC that gives a quest renders it in full and links to it, so
  // /wiki/npc still reaches every quest page in two hops. A quest with no giver would be stranded.
  it('leaves no quest page reachable from nowhere', () => {
    expect(nodes.some(([, node]) => node.kind === 'quest' && node.slug)).toBe(true);
    const given = new Set(graph.edges.filter((edge) => edge.rel === 'gives').map((edge) => edge.to));
    const stranded = nodes
      .filter(([id, node]) => node.kind === 'quest' && !given.has(id))
      .map(([id]) => id);
    expect(stranded).toEqual([]);
  });

  // Nine town shops, every one named for the town it sits in, so the tile repeated nine names
  // already in Maps. The pages stay and are reached from the item, the town and the town's NPCs.
  it('gives shops no catalog of their own', () => {
    expect(hasListing('shop')).toBe(false);
    const shops = nodes.filter(([, node]) => node.kind === 'shop');
    const sold = new Set(graph.edges.filter((edge) => edge.rel === 'sells').map((edge) => edge.from));
    expect(shops.every(([id]) => sold.has(id))).toBe(true);
  });

  // The gem shop, Killroy's and the weekly boss shop stand in no town, which is the one thing that
  // separates them from the nine: they are reached from the items they sell rather than from a map.
  it('sites every town shop on its map and no currency shop anywhere', () => {
    const sited = new Set(graph.edges.filter((edge) => edge.rel === 'hasShop').map((edge) => edge.to));
    const shops = nodes.filter(([, node]) => node.kind === 'shop');
    const unsited = shops.filter(([id]) => !sited.has(id)).map(([, node]) => node.rawName);
    expect(unsited.sort()).toEqual(['gem', 'skull', 'weekly']);
    expect(shops.filter(([id]) => sited.has(id))).toHaveLength(Object.keys(shared.shops).length);
  });

  // The NPC route to a shop is the second hop the slice has to carry: without hasShop in the set,
  // a town NPC's page would render the shop section from edges that never reached it.
  it('carries a town shop into the slice of the NPCs standing in it', () => {
    expect(SECOND_HOP_RELS.has('hasShop')).toBe(true);
    const shopTowns = new Set(graph.edges.filter((edge) => edge.rel === 'hasShop').map((edge) => edge.from));
    const reached = new Set(graph.edges
      .filter((edge) => edge.rel === 'hosts' && shopTowns.has(edge.from))
      .map((edge) => edge.to));
    expect(reached.size).toBeGreaterThan(20);
  });

  // Maps have no catalog either: an area is where a trail leads, not where one starts. The pages
  // stay, and what makes that safe is the world above each one listing every area it holds. For
  // Grand Owl Perch, The Oasis and How_Did_u_get_here, which the portals never reach, their world is
  // the only route in.
  it('leaves no area reachable from nowhere', () => {
    expect(nodes.some(([, node]) => node.kind === 'map' && node.slug)).toBe(true);
    expect(nodes.filter(([, node]) => node.kind === 'world')).toHaveLength(Object.keys(WORLD_NAMES).length);
    const listed = new Set(graph.edges.filter((edge) => edge.rel === 'contains').map((edge) => edge.to));
    const stranded = nodes
      .filter(([id, node]) => node.kind === 'map' && node.catalog !== false && !listed.has(id))
      .map(([, node]) => node.name);
    expect(stranded).toEqual([]);
  });

  // Without the world listing, the trail is monsters and NPCs plus the portals out of them, and
  // those two are what it misses (The Oasis now hosts an observation). Kept as its own check so removing the world catalog cannot
  // silently strand them again.
  it('reaches all but two areas from the monster and NPC trail alone', () => {
    const isMap = (id) => graph.nodes[id]?.kind === 'map';
    const seeds = new Set();
    for (const edge of graph.edges) {
      if (edge.rel === 'contains') continue;
      if (isMap(edge.from) && !isMap(edge.to)) seeds.add(edge.from);
      if (isMap(edge.to) && !isMap(edge.from)) seeds.add(edge.to);
    }
    // Then out along the portals, which is how a player would walk it.
    const portals = new Map();
    const link = (a, b) => portals.set(a, [...(portals.get(a) || []), b]);
    for (const edge of graph.edges) {
      if (edge.rel !== 'connectsTo') continue;
      link(edge.from, edge.to);
      link(edge.to, edge.from);
    }
    const seen = new Set(seeds);
    const queue = [...seeds];
    while (queue.length) {
      for (const next of portals.get(queue.pop()) || []) {
        if (!seen.has(next)) {
          seen.add(next);
          queue.push(next);
        }
      }
    }
    const stranded = nodes
      .filter(([id, node]) => node.kind === 'map' && node.catalog !== false && !seen.has(id))
      .map(([, node]) => node.name);
    // Both host nothing at all, so nothing can link to them. Named areas, so they keep their
    // pages: How_Did_u_get_here is a joke room you are not meant to reach, which is why it has no
    // portal in either direction.
    expect(stranded.sort()).toEqual(['Grand_Owl_Perch', 'How_Did_u_get_here']);
  });

  // A kind added to the graph later has no listing until it is named here, which would leave its
  // pages out of the sitemap and off the category grid without anything failing.
  it('lists every other kind the graph carries', () => {
    const unlisted = new Set(['quest', 'shop', 'station', 'spice', 'map']);
    // Registry kinds count before the committed graph is regenerated with them, so a new row does not
    // fail this until the next build.
    const kinds = [...new Set([...nodes.map(([, node]) => node.kind), ...ROWS.map((row) => row.kind)])].filter((kind) => !unlisted.has(kind));
    expect([...kinds].sort()).toEqual([...LISTED_KINDS].sort());
  });
});
