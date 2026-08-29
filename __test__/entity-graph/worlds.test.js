import { describe, it, expect } from 'vitest';
import { WORLD_NAMES, worldNodes } from '../../scripts/entity-graph/nodes/worlds.mjs';
import { worldEdges } from '../../scripts/entity-graph/edges/worlds.mjs';

const maps = {
  'map:0': { kind: 'map', rawName: '0', category: 'World 1' },
  'map:1': { kind: 'map', rawName: '1', category: 'World 1' },
  'map:3': { kind: 'map', rawName: '3', category: 'World 1', catalog: false },
  'map:50': { kind: 'map', rawName: '50', category: 'World 2' }
};

describe('world nodes', () => {
  it('names the seven worlds and draws each one with its own map art', () => {
    const nodes = worldNodes(maps);
    expect(nodes['world:1']).toEqual({
      kind: 'world',
      rawName: '1',
      name: 'Blunder_Hills',
      icon: '/data/UImap1.png',
      category: 'World',
      order: 1
    });
    expect(Object.keys(WORLD_NAMES)).toHaveLength(7);
  });

  // A world with no areas in the graph would be a page listing nothing, and UImap8 is an empty
  // frame the game ships for a world it has not built.
  it('builds only the worlds the maps actually cover', () => {
    const nodes = worldNodes(maps);
    expect(Object.keys(nodes)).toEqual(['world:1', 'world:2']);
    expect(worldNodes({})).toEqual({});
  });

  // One category across all seven so the listing is one run rather than seven bands of one row.
  // The order field is what keeps them in the game's sequence instead of alphabetical, which would
  // open on Blunder Hills, Frostbite Tundra, Hyperion Nebula.
  it('bands as one category and carries the game order', () => {
    const nodes = Object.values(worldNodes(maps));
    expect([...new Set(nodes.map((node) => node.category))]).toEqual(['World']);
    expect(nodes.map((node) => node.order)).toEqual([1, 2]);
  });
});

describe('world edges', () => {
  const nodes = {
    ...maps,
    ...worldNodes(maps),
    'monster:mushG': { kind: 'monster', rawName: 'mushG', name: 'Green_Mushroom' }
  };
  const shared = {
    mapEnemiesArray: ['Nothing', 'mushG', 'Filler', 'JungleZ'],
    npcPlacements: { Scripticus: [0], Glumlee: [0], Clown: [0, 50] }
  };

  it('files every area under its world with the enemy and NPC count on the row', () => {
    const edges = worldEdges(nodes, shared);
    expect(edges).toEqual([
      { from: 'world:1', to: 'map:0', rel: 'contains', meta: { enemy: null, npcs: 3 }, source: 'worlds' },
      { from: 'world:1', to: 'map:1', rel: 'contains', meta: { enemy: 'Green_Mushroom', npcs: 0 }, source: 'worlds' },
      { from: 'world:2', to: 'map:50', rel: 'contains', meta: { enemy: null, npcs: 1 }, source: 'worlds' }
    ]);
  });

  // The nine slots the game never named keep their pages and stay out of the atlas, and a world
  // listing is an atlas. They are still reached from the real areas that connect to them.
  it('leaves an uncatalogued area out of its world', () => {
    expect(worldEdges(nodes, shared).some((edge) => edge.to === 'map:3')).toBe(false);
  });

  // The same absence markers map edges already drop, read from the same set rather than a copy:
  // 'Filler' is not a monster id, and treating it as one would print it as an area's enemy.
  it('reads an absence marker as no enemy rather than as a monster', () => {
    const withFiller = {
      ...nodes,
      'map:2': { kind: 'map', rawName: '2', category: 'World 1' }
    };
    const edge = worldEdges(withFiller, shared).find((entry) => entry.to === 'map:2');
    expect(edge.meta.enemy).toBeNull();
  });

  // An enemy the graph has no monster node for names nothing a reader could click, so the row says
  // nothing rather than printing a raw id.
  it('names no enemy it cannot resolve to a monster', () => {
    const { 'monster:mushG': removed, ...withoutMonster } = nodes;
    const edges = worldEdges(withoutMonster, shared);
    expect(edges.find((edge) => edge.to === 'map:1').meta.enemy).toBeNull();
  });
});
