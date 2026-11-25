// Build time only, like static-graph.mjs. The drawn maps (public/atlas) and what sits on them, written by z-processing's
// scripts/mapAtlas.js. Everything on a map is in its picture already; what the page adds is the numbers, on the picture and
// on the rows of its sections, and rows for what the graph has no page of.
import fs from 'fs';
import path from 'path';
import { LISTED_KINDS } from './kinds.mjs';
import { entityName } from './names.mjs';
import { placePlates } from './map-pins.mjs';
import { entityHref, slimNode } from './page-graph.js';

let cached = null;
const mapAtlas = () => {
  if (!cached) {
    const file = path.join(process.cwd(), 'data', 'map-atlas.json');
    cached = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf-8')) : {};
  }
  return cached;
};

// The wiki pages a place on a map can have: the Construction buildings and the stations.
const PLACE_KINDS = ['building', 'station'];
// Two clickers stand on a map and are no NPC of the wiki's: their page is the clicker's.
const CLICKERS = { 'npc:Orion': '/wiki/owl', 'npc:Poppy': '/wiki/kangaroo' };
// Relations of the page alone, for what the graph leaves out. Edges there would also show on the other end's page.
const LOCAL = { Bosses: 'mapBoss', Places: 'mapPlace', Gathering: 'mapGathering' };

// "To Froggy Fields: 21 kills" on the map's own page, by destination.
const portalNotes = (node) => Object.fromEntries((node.fields?.find(({ label }) => label === 'Portals')?.value ?? [])
  .map((line) => line.match(/^To (.+?): (.+)$/)?.slice(1) ?? [])
  .filter(([name]) => name));

const leftToRight = (a, b) => a.box[0] - b.box[0] || a.box[1] - b.box[1];
const kindRank = (kind) => (LISTED_KINDS.includes(kind) ? LISTED_KINDS.indexOf(kind) : LISTED_KINDS.length);

// A map's picture and its slice with the numbers on it, or null for a map with no picture. The slice's own objects are
// shared by the whole build, so what changes is copied.
export const atlasFor = (graph, id, slice) => {
  const entry = mapAtlas()[graph.nodes[id].rawName];
  if (!entry) return null;
  const nodes = { ...slice.nodes };
  const notes = portalNotes(slice.node);
  const other = (edge) => (edge.from === id ? edge.to : edge.from);
  const own = (rel) => slice.edges.filter((edge) => edge.rel === rel && (edge.from === id || edge.to === id));
  const known = (target) => {
    if (!nodes[target] && graph.nodes[target]) nodes[target] = slimNode(graph.nodes[target]);
    return Boolean(nodes[target]);
  };

  // Where each linked page is drawn. A spot with blank art has nothing to point at.
  const boxes = Object.fromEntries(entry.spots.filter(({ blank }) => !blank).map((spot) => [spot.id, spot.box]));
  const places = entry.places ?? [];
  const withBox = (edge, box) => ({ ...edge, ...(box ? { box } : {}) });
  // Drawn rows first, left to right; the rest keep their order.
  const sorted = (edges) => [...edges.filter(({ box }) => box).sort(leftToRight), ...edges.filter(({ box }) => !box)];

  const enemies = own('spawns').map((edge) => withBox(edge, places.find((place) => place.id === edge.to)?.box));
  const hosted = own('hosts');
  // An NPC drawn here that the wiki places elsewhere (the Rift Ripper inside The Rift), and the two clickers.
  const guests = entry.spots.filter((spot) => spot.id.startsWith('npc:') && !hosted.some(({ to }) => to === spot.id)).flatMap((spot) => {
    if (CLICKERS[spot.id]) {
      nodes[spot.id] = { kind: 'npc', rawName: spot.id.slice(4), name: spot.id.slice(4), icon: null, slug: null, href: CLICKERS[spot.id] };
    }
    return known(spot.id) ? [{ from: id, to: spot.id, rel: 'hosts', meta: {}, box: spot.box }] : [];
  });
  const npcs = [...hosted.map((edge) => withBox(edge, boxes[edge.to])), ...guests];
  const shop = places.find(({ name }) => name === 'Shop');
  const shops = own('hasShop').map((edge) => withBox(edge, shop?.box));
  const found = own('locatedIn').map((edge) => withBox(edge, boxes[edge.from]))
    .sort((a, b) => kindRank(nodes[a.from]?.kind) - kindRank(nodes[b.from]?.kind));
  const foundByKind = [...new Set(found.map((edge) => nodes[edge.from]?.kind))]
    .flatMap((kind) => sorted(found.filter((edge) => nodes[edge.from]?.kind === kind)));

  // Every way out once, whichever end the graph stores it at: a portal has one number.
  const exits = entry.exits.filter(({ to }) => known(`map:${to}`));
  const drawn = new Set(exits.map(({ to }) => `map:${to}`));
  const linked = [...new Set(own('connectsTo').map(other))].filter((target) => !drawn.has(target));
  const ways = [...exits.map(({ to, box, need }) => ({ target: `map:${to}`, box, need })), ...linked.map((target) => ({ target }))]
    .map(({ target, box, need }) => {
      const label = notes[entityName(nodes[target])] ?? need;
      return { from: id, to: target, rel: 'connectsTo', meta: label ? { need: label } : {}, source: 'maps', ...(box ? { box } : {}) };
    });

  const taken = new Set([...enemies.map(({ to }) => to), ...(shops.length ? [shop] : [])]);
  const npcNames = new Set(npcs.map(({ to }) => nodes[to] && entityName(nodes[to])));
  const local = Object.fromEntries(Object.entries(LOCAL).map(([group, rel]) => [rel, sorted(places
    .filter((place) => place.group === group && !taken.has(place) && !(place.id && taken.has(place.id)) && !npcNames.has(place.name))
    .map((place) => {
      const page = place.id ?? Object.keys(graph.nodes)
        .find((key) => PLACE_KINDS.includes(graph.nodes[key].kind) && entityName(graph.nodes[key]) === place.name);
      const target = page && known(page) ? page : `place:${place.name}`;
      if (target !== page) {
        nodes[target] = {
          kind: 'place', rawName: place.name, name: place.name, icon: `/atlas/icon/${place.icon}.png`, slug: null,
          ...(place.href ? { href: place.href } : { navigable: false })
        };
      }
      return { from: id, to: target, rel, meta: {}, box: place.box };
    }))]));

  // In the order the page's sections come, so the numbers count down the page.
  let number = 0;
  const pins = [];
  const numbered = [
    enemies, local.mapBoss, sorted(npcs), shops, foundByKind, sorted(ways), local.mapPlace, local.mapGathering
  ].flat().map(({ box, ...edge }) => {
    if (!box) return edge;
    const target = nodes[other(edge)];
    const href = target.href ?? (target.navigable === false ? null : entityHref(target));
    pins.push({
      number: ++number, box, name: entityName(target), ...(href ? { href } : {}),
      ...(target.icon && target.kind !== 'map' ? { icon: target.icon } : {}), ...(edge.meta?.need ? { note: edge.meta.need } : {})
    });
    return { ...edge, meta: { ...edge.meta, number } };
  });

  const replaced = new Set(['spawns', 'hosts', 'hasShop', 'locatedIn', 'connectsTo'].flatMap(own));
  // The exits carry their requirement, so the Details box does not repeat it.
  const { fields, ...rest } = slice.node;
  const kept = fields?.filter(({ label }) => label !== 'Portals') ?? [];
  const node = { ...rest, ...(kept.length ? { fields: kept } : {}) };
  nodes[id] = node;
  return {
    atlas: { src: `/atlas/${node.rawName}.webp`, width: entry.w, height: entry.h, pins },
    slice: { ...slice, node, nodes, edges: [...slice.edges.filter((edge) => !replaced.has(edge)), ...numbered] }
  };
};

// The island picture the game opens to travel, and where it draws an area on it: the picture sits at 75, 27 and a spot's
// center 15, 13 from its place in MapDetails (N.js _UIinventory4[10] and [2]). An area the island hides is out of bounds.
const ISLAND = { width: 811, height: 433, offset: [15 - 75, 13 - 27] };
// A world's first map is its town.
const MAPS_PER_WORLD = 50;

let details = null;
const mapDetails = () => {
  details ??= JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'website-data', 'shared-data.json'), 'utf-8')).mapDetails;
  return details;
};

// A world's island with a number on each of its areas, and its slice with the numbers on the Areas rows, in the game's order.
export const islandFor = (graph, id, slice) => {
  const own = slice.edges.filter((edge) => edge.rel === 'contains' && edge.from === id);
  const indexOf = (edge) => Number(slice.nodes[edge.to].rawName);
  const pins = [];
  const areas = [...own].sort((a, b) => indexOf(a) - indexOf(b)).map((edge) => {
    const place = mapDetails()[indexOf(edge)]?.[2];
    const at = [0, 1].map((axis) => Number(place?.[axis]) + ISLAND.offset[axis]);
    if (!(at[0] > 0 && at[0] < ISLAND.width && at[1] > 0 && at[1] < ISLAND.height)) return edge;
    const number = pins.length + 1;
    const node = slice.nodes[edge.to];
    const town = indexOf(edge) % MAPS_PER_WORLD === 0;
    pins.push({ number, at, ...(town ? { town } : {}), name: entityName(node), href: entityHref(node), ...(edge.meta?.enemy ? { note: edge.meta.enemy.replace(/_/g, ' ') } : {}) });
    return { ...edge, meta: { ...edge.meta, number } };
  });
  if (!pins.length) return null;
  const below = placePlates(pins.map(({ at }) => at));
  return {
    atlas: { src: slice.node.icon, width: ISLAND.width, height: ISLAND.height, island: true, pins: pins.map((pin, i) => (below[i] ? { ...pin, below: true } : pin)) },
    slice: { ...slice, edges: [...slice.edges.filter((edge) => !own.includes(edge)), ...areas] }
  };
};

// The maps listing: the game's order, each map's small picture, and what is fought or gathered there.
export const atlasListing = (graph, { entries }) => {
  const targets = new Map(graph.edges.filter((edge) => edge.rel === 'spawns' && edge.from.startsWith('map:'))
    .map((edge) => [edge.from, graph.nodes[edge.to]]));
  return {
    columns: [],
    entries: entries.map((entry) => {
      const { rawName } = entry.node;
      const target = targets.get(entry.id);
      return {
        ...entry,
        cells: [],
        node: {
          ...entry.node,
          order: Number(rawName),
          thumb: mapAtlas()[rawName] ? `/atlas/thumb/${rawName}.webp` : null,
          target: target ? entityName(target) : null
        }
      };
    })
  };
};
