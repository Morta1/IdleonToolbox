import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import {
  KIND_GROUPS, LISTED_KINDS, SYSTEMS, entityPath, hasListing, inListing, kindAtSegment, listingCounts, listingHref,
  listingSegment, movedEntityPath, movedListingHref, routeClashes, systemBySlug, systemOf, wikiCrumbs
} from '../../utility/wiki/kinds.mjs';
import { KIND_LABELS, KIND_PLURALS, KIND_SHORT_PLURALS } from '../../utility/wiki/kind-labels.mjs';
import { SECOND_HOP_RELS } from '../../utility/wiki/page-graph';
import { worldNames } from '../../scripts/entity-graph/nodes/worlds.mjs';
import { loadWebsiteData } from '../../scripts/entity-graph/registry/data.mjs';
import { ROWS } from '../../scripts/entity-graph/registry/index.mjs';

const graph = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'entity-graph.json'), 'utf-8'));
const nodes = Object.entries(graph.nodes).filter(([, node]) => node.navigable !== false);
const shared = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'website-data', 'shared-data.json'), 'utf-8'));
const searchIndex = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'wiki-search-index.json'), 'utf-8'));
const indexRow = (id) => searchIndex.find((row) => row.id === id);

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
    expect(nodes.filter(([, node]) => node.kind === 'world')).toHaveLength(Object.keys(worldNames(loadWebsiteData(path.join(process.cwd(), 'data', 'website-data')))).length);
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
  // Every listed kind gets one rail row and one tile, so a kind filed twice would render twice and a
  // system of one kind would be a fold hiding a single row.
  it('files each kind once, and only nests a system of two or more', () => {
    const systems = KIND_GROUPS.flatMap((group) => group.entries.filter((entry) => typeof entry !== 'string'));
    const nested = new Set(systems.flatMap((system) => system.kinds));
    expect({
      repeated: LISTED_KINDS.filter((kind, i) => LISTED_KINDS.indexOf(kind) !== i),
      lonely: systems.filter((system) => system.kinds.length < 2).map((system) => system.label),
      // A short label reads only under its system's heading, or in a group whose own heading says what
      // its entries are (Clickers); anywhere else it would lose what it is.
      shortUnnested: Object.keys(KIND_SHORT_PLURALS).filter((kind) => !nested.has(kind)
        && !KIND_GROUPS.some((group) => group.shortLabels && group.entries.includes(kind))),
      // Plain kinds lead their group, so their home tiles sit under the world rather than after a system.
      looseAfterSystem: KIND_GROUPS.filter((group) => group.entries.some((entry, i) => typeof entry === 'string'
        && group.entries.slice(0, i).some((before) => typeof before !== 'string'))).map((group) => group.label)
    }).toEqual({ repeated: [], lonely: [], shortUnnested: [], looseAfterSystem: [] });
  });

  // The app's menu puts the clickers between the account pages and World 1, so the wiki does too, and the
  // Kangaroo's two shops fold under it. Sailing stands for every world's systems.
  it('groups the clickers before World 1 and files a world by its systems', () => {
    const outline = (entry) => (typeof entry === 'string' ? entry : [entry.label, entry.kinds.map((kind) => KIND_SHORT_PLURALS[kind] || kind)]);
    const at = KIND_GROUPS.findIndex((group) => group.label === 'Clickers');
    expect({
      around: KIND_GROUPS.slice(at - 1, at + 2).map((group) => group.label),
      clickers: KIND_GROUPS[at].entries.map(outline),
      sailing: outline(KIND_GROUPS.find((group) => group.label === 'World 5').entries[0])
    }).toEqual({
      around: ['Account', 'Clickers', 'World 1'],
      clickers: ['owl', 'bubbaupgrade', ['Kangaroo', ['Upgrades', 'Tar Upgrades']]],
      sailing: ['Sailing', ['Artifacts', 'Islands']]
    });
  });
});

// One predicate decides a listing's rows and the home's counts. It reads a graph node or a search-index row, so each
// branch is checked on both shapes of the same real page.
describe('inListing', () => {
  it.each([
    ['a plain item node', graph.nodes['item:Copper'], true],
    ['its index row', indexRow('item:Copper'), true],
    ['a monster kept out of the catalog (a Forge)', graph.nodes['monster:ForgeA'], false],
    ['its index row', indexRow('monster:ForgeA'), false],
    ['a page that is not navigable (coins)', graph.nodes['item:COIN'], false],
    ['a page with no slug', { ...graph.nodes['item:Copper'], slug: undefined }, false]
  ])('%s', (unused, page, expected) => {
    expect(inListing(page)).toBe(expected);
  });

  // The home counts index rows and the listing filters graph nodes: a graph rebuilt without its index (or the other
  // way round) shows a count the listing does not have.
  it('counts the same rows per listed kind in the graph and in the search index', () => {
    expect(listingCounts(searchIndex)).toEqual(listingCounts(Object.values(graph.nodes)));
  });
});

describe('routes', () => {
  // URLs are a decision: a renamed system would move its page, so the slugs are pinned rather than derived.
  it('slugs every system in rail order', () => {
    expect(SYSTEMS.map((system) => system.slug)).toEqual([
      'task-board', 'dungeons', 'kangaroo', 'equinox', 'breeding', 'laboratory', 'rift', 'sailing', 'divinity', 'gaming',
      'hole', 'farming', 'sneaking', 'summoning', 'spelunking', 'research', 'minehead', 'sushi-station', 'jelly-operator',
      'royal-armory'
    ]);
  });

  it('holds exactly the system entries of the groups, and maps each kind back to its system', () => {
    const entries = KIND_GROUPS.flatMap((group) => group.entries.filter((entry) => typeof entry !== 'string'));
    const kinds = SYSTEMS.flatMap((system) => system.kinds);
    expect(kinds).toEqual(entries.flatMap((entry) => entry.kinds));
    expect(kinds.map((kind) => systemOf(kind).label)).toEqual(entries.flatMap((entry) => entry.kinds.map(() => entry.label)));
  });

  it('finds no route clash in the real data', () => {
    const kinds = [...new Set([...Object.keys(KIND_LABELS), ...Object.values(graph.nodes).map((node) => node.kind), ...ROWS.map((row) => row.kind)])];
    expect(routeClashes({ kinds, nodes: Object.values(graph.nodes) })).toEqual([]);
  });

  // The URL of every system kind's listing is pinned: a renamed short label would move every page of its kind, and
  // that has to be a decision someone sees in a diff, with a redirect if the old pages were live.
  it('files every system kind under its system, at the segment its short label gives', () => {
    expect(Object.fromEntries(SYSTEMS.flatMap((system) => system.kinds).map((kind) => [kind, listingHref(kind)]))).toEqual({
      achievement: '/wiki/task-board/achievements',
      meritshop: '/wiki/task-board/merit-shops',
      dungeonitem: '/wiki/dungeons/rng-items',
      dungeonpassive: '/wiki/dungeons/passives',
      dungeontrait: '/wiki/dungeons/trait-tiers',
      poppy: '/wiki/kangaroo/upgrades',
      tarpit: '/wiki/kangaroo/tar-upgrades',
      equinox: '/wiki/equinox/upgrades',
      dream: '/wiki/equinox/dreams',
      gene: '/wiki/breeding/pet-genes',
      petupgrade: '/wiki/breeding/upgrades',
      chip: '/wiki/laboratory/chips',
      jewel: '/wiki/laboratory/jewels',
      labbonus: '/wiki/laboratory/bonuses',
      rift: '/wiki/rift/levels',
      riftbonus: '/wiki/rift/bonuses',
      artifact: '/wiki/sailing/artifacts',
      sailingisland: '/wiki/sailing/islands',
      god: '/wiki/divinity/gods',
      divstyle: '/wiki/divinity/styles',
      superbit: '/wiki/gaming/superbits',
      gamingimport: '/wiki/gaming/imports',
      palette: '/wiki/gaming/palette-colours',
      cavern: '/wiki/hole/caverns',
      schematic: '/wiki/hole/schematics',
      majik: '/wiki/hole/majiks',
      lampwish: '/wiki/hole/lamp-wishes',
      fountainupgrade: '/wiki/hole/fountain-upgrades',
      jarcollectible: '/wiki/hole/jar-collectibles',
      coveupgrade: '/wiki/hole/cove-upgrades',
      marketupgrade: '/wiki/farming/market',
      exoticupgrade: '/wiki/farming/exotic-market',
      seed: '/wiki/farming/seeds',
      landrank: '/wiki/farming/land-rank-upgrades',
      sticker: '/wiki/farming/stickers',
      jade: '/wiki/sneaking/jade-emporium',
      ninjaupgrade: '/wiki/sneaking/knowledge-upgrades',
      pristinecharm: '/wiki/sneaking/pristine-charms',
      ninjaitem: '/wiki/sneaking/items',
      sneakfloor: '/wiki/sneaking/floors',
      summoningupgrade: '/wiki/summoning/upgrades',
      summoningbattle: '/wiki/summoning/battles',
      spelunkupgrade: '/wiki/spelunking/shop-upgrades',
      spelunktunnel: '/wiki/spelunking/tunnels',
      researchsquare: '/wiki/research/grid-squares',
      observation: '/wiki/research/observations',
      mineheadupgrade: '/wiki/minehead/upgrades',
      mineheadopponent: '/wiki/minehead/opponents',
      sushiupgrade: '/wiki/sushi-station/upgrades',
      sushi: '/wiki/sushi-station/sushi',
      jellyupgrade: '/wiki/jelly-operator/upgrades',
      jellyobstruction: '/wiki/jelly-operator/obstructions',
      armoryupgrade: '/wiki/royal-armory/upgrades',
      orbletupgrade: '/wiki/royal-armory/orblet-market'
    });
  });

  it('never gives two kinds of one system the same segment, and finds each kind back from its segment', () => {
    for (const system of SYSTEMS) {
      const segments = system.kinds.map(listingSegment);
      expect(new Set(segments).size, system.label).toBe(segments.length);
      expect(segments.map((segment) => kindAtSegment(system.slug, segment)), system.label).toEqual(system.kinds);
    }
    expect(kindAtSegment('sneaking', 'upgrades')).toBeNull();
  });

  // Every kind outside a system keeps the URLs it shipped with.
  it('leaves a loose kind at /wiki/<kind>', () => {
    const loose = Object.keys(KIND_LABELS).filter((kind) => !systemOf(kind));
    expect(loose.map((kind) => [listingSegment(kind), entityPath(kind, 'x')]))
      .toEqual(loose.map((kind) => [null, `/wiki/${kind}/x`]));
    expect(loose.filter(hasListing).map(listingHref)).toEqual(loose.filter(hasListing).map((kind) => `/wiki/${kind}`));
  });

  it.each([
    ['a system kind', 'sneakfloor', 'floor-5', '/wiki/sneaking/floors/floor-5'],
    ['a moved kind', 'god', 'goharut', '/wiki/divinity/gods/goharut'],
    ['a loose kind', 'item', 'copper-ore', '/wiki/item/copper-ore'],
    ['a kind with no listing', 'quest', 'hoopsies', '/wiki/quest/hoopsies']
  ])('writes the entity URL of %s', (unused, kind, slug, href) => {
    expect(entityPath(kind, slug)).toBe(href);
  });

  // Exactly the system kinds that shipped at /wiki/<kind> keep a redirect, and Equinox's old listing needs none: its
  // system page holds that URL now.
  it('keeps the old URLs of exactly the kinds that shipped before the move', () => {
    const moved = Object.keys(KIND_LABELS).filter((kind) => movedEntityPath(kind, 'x'));
    expect(moved.map((kind) => [kind, movedListingHref(kind), movedEntityPath(kind, 'x'), systemOf(kind)?.slug]).sort()).toEqual([
      ['achievement', '/wiki/achievement', '/wiki/achievement/x', 'task-board'],
      ['artifact', '/wiki/artifact', '/wiki/artifact/x', 'sailing'],
      ['chip', '/wiki/chip', '/wiki/chip/x', 'laboratory'],
      ['equinox', null, '/wiki/equinox/x', 'equinox'],
      ['god', '/wiki/god', '/wiki/god/x', 'divinity'],
      ['jade', '/wiki/jade', '/wiki/jade/x', 'sneaking'],
      ['jewel', '/wiki/jewel', '/wiki/jewel/x', 'laboratory'],
      ['superbit', '/wiki/superbit', '/wiki/superbit/x', 'gaming']
    ]);
  });

  const equinox = { label: 'Equinox', slug: 'equinox', group: 'World 3', kinds: ['equinox', 'dream'] };
  const hole = (group) => ({ label: 'Hole', slug: 'hole', group, kinds: [] });
  it.each([
    ['a system slug equal to a loose kind',
      { kinds: ['hole'], nodes: [], systems: [hole('World 5')] },
      '/wiki/hole is claimed by system "Hole" and kind "hole"'],
    ['two kinds of one system on one segment',
      { kinds: ['sushiupgrade', 'jellyupgrade'], nodes: [], systems: [{ label: 'Mixed', slug: 'mixed', group: 'World 7', kinds: ['sushiupgrade', 'jellyupgrade'] }] },
      '/wiki/mixed/upgrades is claimed by the sushiupgrade listing and the jellyupgrade listing'],
    ['an old entity URL of a moved kind on its system\'s listing',
      { kinds: ['equinox', 'dream'], nodes: [{ kind: 'equinox', slug: 'dreams' }], systems: [equinox] },
      '/wiki/equinox/dreams is claimed by the dream listing and the old URL of equinox page "dreams"'],
    ['two systems with one slug',
      { kinds: [], nodes: [], systems: [hole('World 5'), hole('World 8')] },
      '/wiki/hole is claimed by system "Hole" and system "Hole"'],
    ['a system slug a static wiki page holds',
      { kinds: [], nodes: [], systems: [{ label: 'Changelog', slug: 'changelog', group: 'Account', kinds: [] }] },
      '/wiki/changelog is claimed by a static page and system "Changelog"'],
    ['a kind id a static wiki page holds',
      { kinds: ['changelog'], nodes: [], systems: [] },
      '/wiki/changelog is claimed by a static page and kind "changelog"']
  ])('reports %s', (unused, input, message) => {
    expect(routeClashes(input)).toEqual([message]);
  });

  it.each([
    ['equinox', '/wiki/equinox/upgrades'],
    ['rift', '/wiki/rift/levels'],
    ['item', '/wiki/item'],
    ['quest', null]
  ])('links the %s listing at %s', (kind, href) => {
    expect(listingHref(kind)).toBe(href);
  });

  it.each([
    ['a kind in a system', { kind: 'ninjaitem' }, [['Wiki', '/wiki'], ['Sneaking', '/wiki/sneaking'], ['Items', '/wiki/sneaking/items']]],
    ['the listing of a kind in a system', { kind: 'equinox', listing: true }, [['Wiki', '/wiki'], ['Equinox', '/wiki/equinox'], ['Upgrades', null]]],
    ['a loose kind', { kind: 'item' }, [['Wiki', '/wiki'], [KIND_PLURALS.item, '/wiki/item']]],
    ['a loose kind of a shortLabels group', { kind: 'owl' }, [['Wiki', '/wiki'], [KIND_PLURALS.owl, '/wiki/owl']]],
    ['a kind with no listing', { kind: 'quest' }, [['Wiki', '/wiki'], [KIND_PLURALS.quest, null]]],
    ['an entity page', { kind: 'ninjaitem', page: 'Silk Veil' }, [['Wiki', '/wiki'], ['Sneaking', '/wiki/sneaking'], ['Items', '/wiki/sneaking/items'], ['Silk Veil', null]]],
    ['an entity of a kind with no listing', { kind: 'quest', page: 'Hoopsies' }, [['Wiki', '/wiki'], [KIND_PLURALS.quest, null], ['Hoopsies', null]]],
    ['a system page', { system: systemBySlug('rift') }, [['Wiki', '/wiki'], ['Rift', null]]]
  ])('crumbs %s', (unused, input, crumbs) => {
    expect(wikiCrumbs(input).map(({ label, href }) => [label, href])).toEqual(crumbs);
  });
});
