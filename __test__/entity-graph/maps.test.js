import { describe, it, expect } from 'vitest';
import { mapNodes } from '../../scripts/entity-graph/nodes/maps.mjs';
import { mapEdges } from '../../scripts/entity-graph/edges/maps.mjs';

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
  // the same string, nobody ever named the area: JungleZ, the four Tutorial rooms, JungleX, both
  // Miningg slots and Filler. They keep their pages, since real maps still connect to them.
  it('keeps an unnamed map out of the atlas without taking its page away', () => {
    const nodes = mapNodes(
      { 3: 'JungleZ', 16: 'Jungle_Perimeter', 33: 'How_Did_u_get_here' },
      { 3: 'JungleZ', 16: 'JungleA', 33: 'NOTHINGLOL' }
    );
    expect(nodes['map:3'].catalog).toBe(false);
    expect(nodes['map:3'].name).toBe('JungleZ');
    // A joke area someone deliberately named is not the same thing as an unfinished one.
    expect(nodes['map:33'].catalog).toBeUndefined();
    expect(nodes['map:16'].catalog).toBeUndefined();
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

describe('map edges', () => {
  const shared = {
    mapEnemiesArray: ['Nothing', 'mushG', 'frogG', 'JungleZ', 'Z', 'Filler'],
    mapMonsterCounts: { 1: 15, 2: 34 },
    mapPortalDestinations: { 0: [50, 1], 1: [2], 2: [-1], 50: [50] },
    npcPlacements: { Scripticus: [0], Clown: [0, 50] }
  };

  it('emits one spawns edge per map that has an enemy, carrying the count', () => {
    const edges = mapEdges(shared).filter((edge) => edge.rel === 'spawns');
    expect(edges).toEqual([
      { from: 'map:1', to: 'monster:mushG', rel: 'spawns', meta: { count: 15 }, source: 'maps' },
      { from: 'map:2', to: 'monster:frogG', rel: 'spawns', meta: { count: 34 }, source: 'maps' }
    ]);
  });

  it('treats every absence marker as no enemy rather than as a monster id', () => {
    // Nothing, Z, Filler and JungleZ are placeholders; only two of the six maps have a real enemy.
    const edges = mapEdges(shared).filter((edge) => edge.rel === 'spawns');
    expect(edges.map((edge) => edge.to)).not.toContain('monster:Z');
    expect(edges).toHaveLength(2);
  });

  it('links maps through their portals', () => {
    const edges = mapEdges(shared).filter((edge) => edge.rel === 'connectsTo');
    expect(edges.map((edge) => `${edge.from}->${edge.to}`)).toEqual([
      'map:0->map:50', 'map:0->map:1', 'map:1->map:2'
    ]);
  });

  it('drops the null destination and a map pointing at itself', () => {
    const edges = mapEdges(shared).filter((edge) => edge.rel === 'connectsTo');
    expect(edges.map((edge) => edge.to)).not.toContain('map:-1');
    expect(edges.find((edge) => edge.from === 'map:50')).toBeUndefined();
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
