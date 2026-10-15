import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { bubbleNodes, bubbleRawName, isRealMaterial, vialNodes } from '../../scripts/entity-graph/nodes/alchemy.mjs';
import { alchemyEdges } from '../../scripts/entity-graph/edges/alchemy.mjs';
import { levelledText } from '../../utility/wiki/effects.mjs';

const vials = {
  0: {
    name: 'COPPER_CORONA', mainItem: 'Copper', desc: 'Orange_bubble_cauldron_brew_speed_+{%',
    func: 'add', x1: 3, x2: 0, discoveryScore: 1,
    itemReq: [{ rawName: 'Copper' }, { rawName: 'Liquid1' }, { rawName: 'Blank' }, { rawName: 'Blank' }]
  }
};

const cauldrons = {
  0: [{
    bubbleIndex: '_0', bubbleName: 'ROID_RAGIN', x1: 1, x2: 0, func: 'addDECAY',
    desc: '+{_Total_STR', cauldron: 'power',
    itemReq: [{ rawName: 'Copper', baseCost: 1 }, { rawName: 'Liquid1', baseCost: 2 }, { rawName: 'Blank', baseCost: 0 }]
  }],
  1: [{
    bubbleIndex: 'a0', bubbleName: 'SWIFT_STEPPIN', x1: 1, x2: 0, func: 'add',
    desc: '+{%_Speed', cauldron: 'quicc', itemReq: [{ rawName: 'OakTree', baseCost: 3 }]
  }]
};

describe('alchemy nodes', () => {
  it('names a bubble after the art the game draws for it', () => {
    // aUpgrades + the cauldron's letter + the index, which is what public/data actually holds.
    expect(bubbleRawName(0, '_0')).toBe('aUpgradesO0');
    expect(bubbleRawName(1, 'a12')).toBe('aUpgradesG12');
    expect(bubbleRawName(3, 'c5')).toBe('aUpgradesY5');
  });

  // The game draws the same flask for every vial and identifies it by its item, so the vial takes
  // that item's art. discoveryScore is what the game rolls against.
  it('builds a vial with the art of the item it is discovered with', () => {
    expect(vialNodes(vials)).toEqual({
      'vial:COPPER_CORONA': {
        kind: 'vial',
        rawName: 'COPPER_CORONA',
        vialIndex: 0,
        name: 'COPPER_CORONA',
        order: 0,
        icon: '/data/Copper.png',
        category: 'Vial',
        description: 'Orange_bubble_cauldron_brew_speed_+{%',
        effect: {
          levelLabel: 'Vial level',
          cap: null,
          terms: [
            { token: '{', formula: 'growth', args: { func: 'add', x1: 3, x2: 0 } },
            { token: '$', formula: 'growth', args: { func: 'add', x1: 3, x2: 0 } }
          ]
        },
        discoveryScore: 1,
        upgradeCosts: [],
        liquids: [{ name: 'Water Drops', icon: '/data/Liquid1_x1.png', cost: null }]
      }
    });
  });

  // The upgrade ladder is the vial's level cap: its last rung is the highest level it reaches.
  it('caps a vial at the top of its upgrade ladder', () => {
    const costs = [{ level: 2, materials: 100, liquid: 3 }, { level: 13, materials: 9000, liquid: 40 }];
    expect(vialNodes(vials, costs)['vial:COPPER_CORONA'].effect.cap).toBe(13);
  });

  it('gives a bubble its effect at any level, uncapped', () => {
    const bubble = bubbleNodes(cauldrons)['bubble:aUpgradesG0'];
    expect(bubble.effect.levelLabel).toBe('Bubble level');
    expect(bubble.effect.cap).toBe(null);
  });

  it('gives an entry with no growth function no effect', () => {
    const plain = { 0: { ...vials[0], func: null } };
    expect(vialNodes(plain)['vial:COPPER_CORONA'].effect).toBeUndefined();
  });

  // A few bubbles write their slot as `$` rather than `{`; both read the same growth.
  it('fills a bubble written with a $ token', () => {
    const dollar = { 0: [{ ...cauldrons[1][0], bubbleIndex: '_0', desc: '+$%_Speed' }] };
    expect(levelledText(bubbleNodes(dollar)['bubble:aUpgradesO0'], 10)).toBe('+10% Speed');
  });

  it('keeps the upgrade ladder on the vial', () => {
    const costs = [{ level: 2, materials: 100, liquid: 3 }];
    expect(vialNodes(vials, costs)['vial:COPPER_CORONA'].upgradeCosts).toEqual(costs);
  });

  it('files a bubble under its cauldron, in the game order', () => {
    const nodes = bubbleNodes(cauldrons);
    expect(nodes['bubble:aUpgradesO0'].category).toBe('Power Cauldron');
    expect(nodes['bubble:aUpgradesG0'].category).toBe('Quicc Cauldron');
    // Power before Quicc, which an alphabet would not give.
    expect(nodes['bubble:aUpgradesO0'].order).toBeLessThan(nodes['bubble:aUpgradesG0'].order);
  });

  // Liquids are not items, so they can never be edges, and Blank is padding.
  it('tells a real material from a liquid and from padding', () => {
    expect(isRealMaterial('Copper')).toBe(true);
    expect(isRealMaterial('Liquid1')).toBe(false);
    expect(isRealMaterial('Blank')).toBe(false);
  });

  it('keeps the liquid on the node so the upgrade cost still reads in full', () => {
    // The icon is the site's existing Liquid<n>_x1 convention, derived from the rawName rather
    // than from the entry's position in itemReq.
    expect(vialNodes(vials)['vial:COPPER_CORONA'].liquids)
      .toEqual([{ name: 'Water Drops', icon: '/data/Liquid1_x1.png', cost: null }]);
    expect(bubbleNodes(cauldrons)['bubble:aUpgradesO0'].liquids)
      .toEqual([{ name: 'Water Drops', icon: '/data/Liquid1_x1.png', cost: 2 }]);
  });
});

// FillerMaterial is the game's "this material isn't in the game yet" item, and the bubbles that cost
// it are the unreleased slots named BUBBLE.
describe('unreleased bubbles', () => {
  const slots = {
    ...cauldrons,
    1: [...cauldrons[1], {
      bubbleIndex: 'a33', bubbleName: 'BUBBLE', x1: 99, x2: 40, func: 'decay', desc: "It's_just_a_normal_bubble.",
      itemReq: [{ rawName: 'FillerMaterial', baseCost: 2500 }, { rawName: 'Liquid4', baseCost: 6 }]
    }]
  };

  it('gets no page and no cost row', () => {
    expect(Object.keys(bubbleNodes(slots))).toEqual(['bubble:aUpgradesO0', 'bubble:aUpgradesG0']);
    expect(alchemyEdges({}, slots).map((edge) => edge.from)).toEqual(['bubble:aUpgradesO0', 'bubble:aUpgradesG0']);
  });

  it('drops exactly the seven BUBBLE slots in the shipped data', () => {
    const shipped = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'website-data', 'cauldrons.json'), 'utf-8'));
    const built = bubbleNodes(shipped);
    const every = Object.values(shipped).flatMap((bubbles, cauldronIndex) => bubbles.map((bubble) => `bubble:${bubbleRawName(cauldronIndex, bubble.bubbleIndex)}`));
    expect(every.filter((id) => !built[id])).toEqual([
      'bubble:aUpgradesO34', 'bubble:aUpgradesG33', 'bubble:aUpgradesG34',
      'bubble:aUpgradesP33', 'bubble:aUpgradesP34', 'bubble:aUpgradesY33', 'bubble:aUpgradesY34'
    ]);
  });
});

describe('alchemy edges', () => {
  it('links only the real materials, and carries a bubble base cost', () => {
    const edges = alchemyEdges(vials, cauldrons);
    expect(edges.filter((edge) => edge.to.includes('Liquid'))).toHaveLength(0);
    expect(edges.filter((edge) => edge.to.includes('Blank'))).toHaveLength(0);
    expect(edges).toContainEqual({
      from: 'bubble:aUpgradesO0', to: 'item:Copper', rel: 'upgradedWith',
      meta: { baseCost: 1 }, source: 'bubbles'
    });
    expect(edges).toContainEqual({
      from: 'vial:COPPER_CORONA', to: 'item:Copper', rel: 'upgradedWith', meta: {}, source: 'vials'
    });
  });
});

describe('the built graph', () => {
  const graph = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'entity-graph.json'), 'utf-8'));

  // 171 distinct items feed a vial or a bubble, and 55 of them had no outgoing use before this.
  it('gives an alchemy-only material somewhere to go', () => {
    const beanSlices = (graph.edges || []).filter((edge) => edge.rel === 'upgradedWith' && edge.to === 'item:Grasslands3');
    expect(beanSlices.length).toBeGreaterThan(0);
  });

  // Every bubble but the unreleased BUBBLE slots, which bubbleNodes leaves out.
  it('holds every vial and every released bubble', () => {
    const readData = (name) => JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'website-data', name), 'utf-8'));
    const kinds = Object.values(graph.nodes).reduce((acc, node) => ({ ...acc, [node.kind]: (acc[node.kind] || 0) + 1 }), {});
    expect(kinds.vial).toBe(Object.keys(readData('vials.json')).length);
    expect(Object.keys(bubbleNodes(readData('cauldrons.json'))).filter((id) => !graph.nodes[id])).toEqual([]);
  });
});
