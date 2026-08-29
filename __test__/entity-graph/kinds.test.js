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
    expect(shops.filter(([id]) => sited.has(id))).toHaveLength(9);
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
  // makes it safe is that the monster and NPC pages carry the trail, and that the world above it
  // lists every area it holds.
  it('gives maps no catalog of their own', () => {
    expect(hasListing('map')).toBe(false);
    expect(nodes.some(([, node]) => node.kind === 'map' && node.slug)).toBe(true);
  });

  // The three the portals never reach: Grand Owl Perch, The Oasis and How_Did_u_get_here host
  // nothing at all, so nothing could link to them. Their world is the only route in, which is the
  // hole the world catalog was added to close.
  it('leaves no area reachable from nowhere', () => {
    const listed = new Set(graph.edges.filter((edge) => edge.rel === 'contains').map((edge) => edge.to));
    const stranded = nodes
      .filter(([id, node]) => node.kind === 'map' && node.catalog !== false && !listed.has(id))
      .map(([, node]) => node.name);
    expect(stranded).toEqual([]);
  });

  // Without the world listing, the trail is monsters and NPCs plus the portals out of them, and
  // those three are what it misses. Kept as its own check so removing the world catalog cannot
  // silently strand them again.
  it('reaches all but three areas from the monster and NPC trail alone', () => {
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
    // All three host nothing at all, so nothing can link to them. Named areas, so they keep their
    // pages: How_Did_u_get_here is a joke room you are not meant to reach, which is why it has no
    // portal in either direction.
    expect(stranded.sort()).toEqual(['Grand_Owl_Perch', 'How_Did_u_get_here', 'The_Oasis']);
  });

  // Seven tiles where the areas under them are 163. The world is also the only listing whose rows
  // are art rather than names, which is why it is worth browsing when the map list was not.
  it('gives worlds a catalog and every area a world', () => {
    expect(hasListing('world')).toBe(true);
    expect(nodes.filter(([, node]) => node.kind === 'world')).toHaveLength(7);
    const filed = new Set(graph.edges.filter((edge) => edge.rel === 'contains').map((edge) => edge.to));
    const areas = nodes.filter(([, node]) => node.kind === 'map' && node.catalog !== false);
    expect(areas.every(([id]) => filed.has(id))).toBe(true);
  });

  // A kind added to the graph later has no listing until it is named here, which would leave its
  // pages out of the sitemap and off the category grid without anything failing.
  it('lists every other kind the graph carries', () => {
    const unlisted = new Set(['quest', 'shop', 'map']);
    const kinds = [...new Set(nodes.map(([, node]) => node.kind))].filter((kind) => !unlisted.has(kind));
    expect([...kinds].sort()).toEqual([...LISTED_KINDS].sort());
  });
});
