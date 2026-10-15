import path from 'path';
import { describe, it, expect } from 'vitest';
import { isPlaceholderMap, mapNodes } from '../../scripts/entity-graph/nodes/maps.mjs';
import { mapEdges } from '../../scripts/entity-graph/edges/maps.mjs';
import { loadWebsiteData } from '../../scripts/entity-graph/registry/data.mjs';

const mapNames = { 0: 'Blunder_Hills', 1: 'Spore_Meadows', 2: 'Froggy_Fields', 50: 'YumYum_Grotto' };

describe('map nodes', () => {
  it('keys maps by index and derives the world from blocks of fifty', () => {
    const nodes = mapNodes(mapNames);
    expect(nodes['map:1']).toEqual({
      kind: 'map', rawName: '1', name: 'Spore_Meadows', icon: null, category: 'World 1'
    });
    expect(nodes['map:50'].category).toBe('World 2');
  });

  // The game shows a map a display name and keeps its internal one separately. Where the two are
  // the same string, nobody ever named the area. One that a portal or an NPC still reaches keeps its
  // page; it only leaves the atlas.
  const unnamed = [
    { 3: 'JungleZ', 16: 'Jungle_Perimeter', 33: 'How_Did_u_get_here' },
    { 3: 'JungleZ', 16: 'JungleA', 33: 'NOTHINGLOL' }
  ];

  it('keeps an unnamed map out of the atlas without taking its page away', () => {
    const nodes = mapNodes(...unnamed, { mapPortalDestinations: { 16: [3] } });
    expect(nodes['map:3'].catalog).toBe(false);
    expect(nodes['map:3'].name).toBe('JungleZ');
    // A joke area someone deliberately named is not the same thing as an unfinished one.
    expect(nodes['map:33'].catalog).toBeUndefined();
    expect(nodes['map:16'].catalog).toBeUndefined();
  });

  // Nothing leads to it: no other map's portal, and no NPC stands there. A map listing itself or -1
  // reaches nothing.
  it('drops an unnamed map that nothing reaches', () => {
    const nodes = mapNodes(...unnamed, { mapPortalDestinations: { 3: [3, -1, 16] }, npcPlacements: { Scripticus: [16] } });
    expect(Object.keys(nodes)).toEqual(['map:16', 'map:33']);
  });

  it('keeps an unnamed map an NPC stands on', () => {
    expect(mapNodes(...unnamed, { npcPlacements: { Secretkeeper: [3] } })['map:3'].catalog).toBe(false);
  });

  // Reading only mapNames cannot tell the two apart, so the raw list has to be passed through.
  it('keeps every map when the raw names are missing', () => {
    expect(Object.values(mapNodes(mapNames)).every((node) => node.catalog === undefined)).toBe(true);
  });

  // 165 of the game's 327 map slots are unbuilt: named Z, unused or PlayerSelect, with no enemy,
  // no NPC and no portal. They were two thirds of the Maps browse list and, once every entity gets
  // a page, would have been two thirds of the map URLs.
  it('drops the placeholder slots the game never built', () => {
    const nodes = mapNodes({ ...mapNames, 43: 'Z', 313: 'unused', 4: 'PlayerSelect' });
    expect(nodes['map:43']).toBeUndefined();
    expect(nodes['map:313']).toBeUndefined();
    expect(nodes['map:4']).toBeUndefined();
    expect(nodes['map:1']).toBeDefined();
  });

  it('keeps a real map whose name merely starts with one of those words', () => {
    const nodes = mapNodes({ 7: 'Zow_Grounds' });
    expect(nodes['map:7']).toBeDefined();
  });
});

describe('against the shipped game data', () => {
  const data = loadWebsiteData(path.join(process.cwd(), 'data', 'website-data'));
  // The slots mapNodes builds from the name alone, which leaves out the Z / unused / PlayerSelect
  // padding that also reads as unnamed.
  const built = Object.keys(data.mapNames).filter((index) => mapNodes({ [index]: data.mapNames[index] })[`map:${index}`]);
  const dropped = built.filter((index) => isPlaceholderMap(index, data)).map(Number);

  it('drops exactly the five unnamed maps nothing reaches', () => {
    expect(dropped).toEqual([3, 23, 25, 34, 56]);
  });

  it('emits no edge from a dropped map', () => {
    const from = new Set(dropped.map((index) => `map:${index}`));
    expect(mapEdges(data).filter((edge) => from.has(edge.from))).toEqual([]);
  });
});

describe('map edges', () => {
  const shared = {
    mapEnemiesArray: ['Nothing', 'mushG', 'frogG', 'JungleZ', 'Z', 'Filler'],
    mapMonsterCounts: { 1: 15, 2: 34 },
    mapPortalDestinations: { 0: [50, 1], 1: [2], 2: [-1], 50: [50] },
    npcPlacements: { Scripticus: [0], Clown: [0, 50] }
  };

  // Nothing, Z, Filler and JungleZ are placeholders; only two of the six maps have a real enemy.
  it('emits one spawns edge per map that has an enemy, carrying the count', () => {
    const edges = mapEdges(shared).filter((edge) => edge.rel === 'spawns');
    expect(edges).toEqual([
      { from: 'map:1', to: 'monster:mushG', rel: 'spawns', meta: { count: 15 }, source: 'maps' },
      { from: 'map:2', to: 'monster:frogG', rel: 'spawns', meta: { count: 34 }, source: 'maps' }
    ]);
  });

  // The fixture's -1 (no destination) and map 50 pointing at itself are both dropped.
  it('links maps through their portals', () => {
    const edges = mapEdges(shared).filter((edge) => edge.rel === 'connectsTo');
    expect(edges.map((edge) => `${edge.from}->${edge.to}`)).toEqual([
      'map:0->map:50', 'map:0->map:1', 'map:1->map:2'
    ]);
  });

  // An NPC standing on two maps is normal rather than a parse error: Clown appears in three towns.
  it('places npcs on every map that hosts them', () => {
    const edges = mapEdges(shared).filter((edge) => edge.rel === 'hosts');
    expect(edges).toEqual([
      { from: 'map:0', to: 'npc:Scripticus', rel: 'hosts', meta: {}, source: 'maps' },
      { from: 'map:0', to: 'npc:Clown', rel: 'hosts', meta: {}, source: 'maps' },
      { from: 'map:50', to: 'npc:Clown', rel: 'hosts', meta: {}, source: 'maps' }
    ]);
  });
});
