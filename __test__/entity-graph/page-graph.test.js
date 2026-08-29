import { describe, it, expect } from 'vitest';
import { entityHref, entityNeighbourhood, pageIndex } from '../../utility/wiki/page-graph';

const graph = {
  nodes: {
    'npc:TP_Pete': { kind: 'npc', rawName: 'TP_Pete', name: 'TP_Pete', slug: 'tp-pete', icon: null },
    'quest:TP_Pete1': {
      kind: 'quest', rawName: 'TP_Pete1', name: 'Roll_of_Anger', slug: 'roll-of-anger', icon: null,
      description: 'Go defeat 40 poops.', difficulty: 4,
      objectives: [{ desc: 'Poops Defeated', value: 40 }]
    },
    'item:Quest14': { kind: 'item', rawName: 'Quest14', name: 'Employment_Statistics', slug: 'employment-statistics', icon: '/data/Quest14.png' },
    'map:0': { kind: 'map', rawName: '0', name: 'Blunder_Hills', slug: 'blunder-hills', icon: null },
    'item:COIN': { kind: 'item', rawName: 'COIN', name: 'Coins', slug: 'coins', icon: '/data/Coins5.png', navigable: false },
    'monster:mushG': { kind: 'monster', rawName: 'mushG', name: 'Green_Mushroom', slug: 'green-mushroom', icon: null }
  },
  edges: [
    { from: 'npc:TP_Pete', to: 'quest:TP_Pete1', rel: 'gives', meta: { order: 1 } },
    { from: 'npc:TP_Pete', to: 'map:0', rel: 'hosts', meta: {} },
    { from: 'quest:TP_Pete1', to: 'item:Quest14', rel: 'rewards', meta: { amount: 2 } },
    { from: 'quest:TP_Pete1', to: 'item:Quest14', rel: 'requires', meta: { amount: 3 } },
    { from: 'monster:mushG', to: 'item:COIN', rel: 'drops', meta: { chance: 1 } }
  ]
};

describe('entityNeighbourhood', () => {
  it('returns null for an id the graph does not hold', () => {
    expect(entityNeighbourhood(graph, 'item:Nope')).toBeNull();
  });

  it('carries the focal node and everything one hop away', () => {
    const slice = entityNeighbourhood(graph, 'npc:TP_Pete');
    expect(Object.keys(slice.nodes).sort()).toContain('quest:TP_Pete1');
    expect(Object.keys(slice.nodes).sort()).toContain('map:0');
    expect(slice.node.name).toBe('TP_Pete');
  });

  // An NPC's Quests section prints each quest's rewards on the quest's own row, so the reward item
  // is two hops out and would otherwise render as a missing node.
  it('reaches the rewards of a quest the entity gives', () => {
    const slice = entityNeighbourhood(graph, 'npc:TP_Pete');
    expect(slice.nodes['item:Quest14']).toBeDefined();
    expect(slice.edges).toContainEqual(
      { from: 'quest:TP_Pete1', to: 'item:Quest14', rel: 'rewards', meta: { amount: 2 } }
    );
  });

  // The NPC block prints what each quest asks for as well as what it pays, so requires is the
  // second second-hop relation. It was rewards alone, and the Requires line silently never rendered.
  it('reaches the items a quest requires', () => {
    const slice = entityNeighbourhood(graph, 'npc:TP_Pete');
    expect(slice.edges.filter((edge) => edge.rel === 'requires')).toHaveLength(1);
  });

  // A quest neighbour is slimmed, and difficulty and objectives are the two fields the NPC block
  // renders that no other kind of node has.
  it('keeps the quest fields an NPC page renders for its neighbours', () => {
    const slice = entityNeighbourhood(graph, 'npc:TP_Pete');
    expect(slice.nodes['quest:TP_Pete1'].difficulty).toBe(4);
    expect(slice.nodes['quest:TP_Pete1'].objectives).toEqual([{ desc: 'Poops Defeated', value: 40 }]);
    // Nothing else carries them, and the slice ships with every page.
    expect(slice.nodes['map:0'].difficulty).toBeUndefined();
  });

  it('does not drag in edges belonging to unrelated entities', () => {
    const slice = entityNeighbourhood(graph, 'npc:TP_Pete');
    expect(slice.nodes['monster:mushG']).toBeUndefined();
    expect(slice.edges.some((edge) => edge.rel === 'drops')).toBe(false);
  });

  // getStaticProps must return JSON and Next refuses undefined outright. Quests carry no category,
  // and that one missing field aborted the export for all 3,466 pages: it has to fail here instead.
  it('never emits undefined, which the static export cannot serialize', () => {
    const undef = (value, path = '$') => {
      if (value === undefined) return [path];
      if (value === null || typeof value !== 'object') return [];
      return Object.entries(value).flatMap(([key, inner]) => undef(inner, `${path}.${key}`));
    };
    // quest:TP_Pete1 has no category, stats or card; npc:TP_Pete has no description.
    for (const id of ['npc:TP_Pete', 'quest:TP_Pete1', 'monster:mushG']) {
      expect(undef(entityNeighbourhood(graph, id))).toEqual([]);
    }
  });

  it('keeps a non-navigable neighbour marked as such', () => {
    const slice = entityNeighbourhood(graph, 'monster:mushG');
    expect(slice.nodes['item:COIN'].navigable).toBe(false);
  });
});

describe('pageIndex', () => {
  it('indexes edges in both directions the way indexGraph does', () => {
    const index = pageIndex(entityNeighbourhood(graph, 'npc:TP_Pete'));
    expect(index.edgesFrom.get('npc:TP_Pete').map((edge) => edge.rel)).toEqual(['gives', 'hosts']);
    expect(index.edgesTo.get('quest:TP_Pete1')).toHaveLength(1);
    expect(index.byId['map:0'].name).toBe('Blunder_Hills');
  });
});

describe('entityHref', () => {
  it('addresses a page by kind and slug', () => {
    expect(entityHref(graph.nodes['monster:mushG'])).toBe('/wiki/monster/green-mushroom');
  });

  it('has no href for something that is not an entity', () => {
    expect(entityHref(null)).toBeNull();
    expect(entityHref({ kind: 'item' })).toBeNull();
  });
});

// The focal node's own edges are the first hop. The second hop follows the neighbours OUT, and an
// edge that leads back is one already counted: Tomahawk Stamp listed the quest that rewards it
// twice, and every shop listed its own town twice, because the panel draws a row per edge.
describe('the second hop', () => {
  const graph = {
    nodes: {
      'item:StampA4': { kind: 'item', rawName: 'StampA4', name: 'Tomahawk_Stamp' },
      'quest:Hamish1': { kind: 'quest', rawName: 'Hamish1', name: 'The_Hamazing_Plot_Twist' },
      'item:CopperBar': { kind: 'item', rawName: 'CopperBar', name: 'Copper_Bar' },
      'npc:Hamish': { kind: 'npc', rawName: 'Hamish', name: 'Hamish' }
    },
    edges: [
      { from: 'quest:Hamish1', to: 'item:StampA4', rel: 'rewards', meta: { amount: 1 } },
      { from: 'quest:Hamish1', to: 'item:CopperBar', rel: 'requires', meta: { amount: 10 } },
      { from: 'npc:Hamish', to: 'quest:Hamish1', rel: 'gives', meta: { order: 1 } }
    ]
  };

  it('does not collect an edge that leads back to the focal node', () => {
    const slice = entityNeighbourhood(graph, 'item:StampA4');
    const rewards = slice.edges.filter((edge) => edge.rel === 'rewards' && edge.to === 'item:StampA4');
    expect(rewards).toHaveLength(1);
  });

  // The hop still has to do its job: an NPC's quest chain renders each quest's items inline, and
  // those are exactly the edges that do not touch the NPC.
  it('still reaches what a neighbour leads to', () => {
    const slice = entityNeighbourhood(graph, 'npc:Hamish');
    expect(slice.edges.filter((edge) => edge.rel === 'rewards')).toHaveLength(1);
    expect(slice.nodes['item:StampA4']).toBeTruthy();
  });
});
