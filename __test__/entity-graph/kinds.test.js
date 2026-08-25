import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { LISTED_KINDS, hasListing } from '../../utility/wiki/kinds.mjs';
import { SECOND_HOP_RELS } from '../../utility/wiki/page-graph';

const graph = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'entity-graph.json'), 'utf-8'));
const nodes = Object.entries(graph.nodes).filter(([, node]) => node.navigable !== false);

describe('listed kinds', () => {
  // A quest's name means nothing without its giver, and the 348 of them carry no category to band
  // by, so the catalog was a flat A-Z of names nobody could use. The pages stay.
  it('gives quests no catalog of their own', () => {
    expect(hasListing('quest')).toBe(false);
    expect(nodes.some(([, node]) => node.kind === 'quest' && node.slug)).toBe(true);
  });

  // The reason dropping the listing costs nothing: the NPC that gives a quest renders it in full
  // and links to it, so /wiki/npc still reaches every quest page in two hops. A quest with no
  // giver would be reachable from nowhere.
  it('leaves no quest page reachable from nowhere', () => {
    const given = new Set(graph.edges.filter((edge) => edge.rel === 'gives').map((edge) => edge.to));
    const stranded = nodes
      .filter(([id, node]) => node.kind === 'quest' && !given.has(id))
      .map(([id]) => id);
    expect(stranded).toEqual([]);
  });

  // Nine shops, every one named for the town it sits in, so the tile repeated nine names already
  // in Maps. The pages stay and are reached from the item, the town and the town's NPCs.
  it('gives shops no catalog of their own', () => {
    expect(hasListing('shop')).toBe(false);
    const shops = nodes.filter(([, node]) => node.kind === 'shop');
    const sold = new Set(graph.edges.filter((edge) => edge.rel === 'sells').map((edge) => edge.from));
    const sited = new Set(graph.edges.filter((edge) => edge.rel === 'hasShop').map((edge) => edge.to));
    expect(shops.every(([id]) => sold.has(id) && sited.has(id))).toBe(true);
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

  // The map catalog goes the same way: an area is where a trail leads, not where one starts. What
  // makes it safe is that the monster and NPC pages carry the trail.
  it('reaches all but three maps without a catalog', () => {
    expect(hasListing('map')).toBe(false);
    const isMap = (id) => graph.nodes[id]?.kind === 'map';
    const seeds = new Set();
    for (const edge of graph.edges) {
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
    // All three host nothing at all, so nothing can link to them. Named areas, so they keep their
    // pages: How_Did_u_get_here is a joke room you are not meant to reach, which is why it has no
    // portal in either direction.
    expect(stranded.sort()).toEqual(['Grand_Owl_Perch', 'How_Did_u_get_here', 'The_Oasis']);
  });

  // A kind added to the graph later has no listing until it is named here, which would leave its
  // pages out of the sitemap and off the category grid without anything failing.
  it('lists every other kind the graph carries', () => {
    const unlisted = new Set(['quest', 'shop', 'map']);
    const kinds = [...new Set(nodes.map(([, node]) => node.kind))].filter((kind) => !unlisted.has(kind));
    expect([...kinds].sort()).toEqual([...LISTED_KINDS].sort());
  });
});
