import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { bubbleNodes, bubbleRawName, isRealMaterial, vialNodes } from '../../scripts/entity-graph/nodes/alchemy.mjs';
import { alchemyEdges } from '../../scripts/entity-graph/edges/alchemy.mjs';
import { costsAt, levelledText } from '../../utility/wiki/effects.mjs';
import { loadWebsiteData, missingTables, resetMissingTables } from '../../scripts/entity-graph/registry/data.mjs';

const data = loadWebsiteData(path.join(process.cwd(), 'data', 'website-data'));

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
    itemReq: [{ rawName: 'Copper', name: 'Copper_Ore', baseCost: 1 }, { rawName: 'Liquid1', name: 'Liquid1', baseCost: 2 }, { rawName: 'Blank', baseCost: 0 }]
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
    const bubble = bubbleNodes(cauldrons, data)['bubble:aUpgradesG0'];
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
    expect(levelledText(bubbleNodes(dollar, data)['bubble:aUpgradesO0'], 10)).toBe('+10% Speed');
  });

  it('keeps the upgrade ladder on the vial', () => {
    const costs = [{ level: 2, materials: 100, liquid: 3 }];
    expect(vialNodes(vials, costs)['vial:COPPER_CORONA'].upgradeCosts).toEqual(costs);
  });

  it('files a bubble under its cauldron, in the game order', () => {
    const nodes = bubbleNodes(cauldrons, data);
    expect(nodes['bubble:aUpgradesO0'].category).toBe('Power Cauldron');
    expect(nodes['bubble:aUpgradesG0'].category).toBe('Quicc Cauldron');
    // Power before Quicc, which an alphabet would not give.
    expect(nodes['bubble:aUpgradesO0'].order).toBeLessThan(nodes['bubble:aUpgradesG0'].order);
  });

  // The cauldron names are the game's panel titles; IQ keeps its capitals.
  it('names every shipped cauldron after its panel title', () => {
    const shipped = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'website-data', 'cauldrons.json'), 'utf-8'));
    expect([...new Set(Object.values(bubbleNodes(shipped, data)).map((node) => node.category))])
      .toEqual(['Power Cauldron', 'Quicc Cauldron', 'High-IQ Cauldron', 'Kazam Cauldron']);
  });

  // Without the titles no cauldron is named, rather than all four filed under one band.
  it('leaves the cauldron out of the category without its titles', () => {
    try {
      expect(Object.values(bubbleNodes(cauldrons, {})).map((node) => node.category)).toEqual([null, null]);
      expect(missingTables()).toContain('cauldronTitles');
    } finally {
      resetMissingTables();
    }
  });

  // Liquids are not items, so they can never be edges, and Blank is padding.
  it('tells a real material from a liquid and from padding', () => {
    expect(isRealMaterial('Copper')).toBe(true);
    expect(isRealMaterial('Liquid1')).toBe(false);
    expect(isRealMaterial('Blank')).toBe(false);
  });

  it('keeps the liquid on a vial so its upgrade table still reads in full', () => {
    // The icon is the site's existing Liquid<n>_x1 convention, derived from the rawName rather
    // than from the entry's position in itemReq.
    expect(vialNodes(vials)['vial:COPPER_CORONA'].liquids)
      .toEqual([{ name: 'Water Drops', icon: '/data/Liquid1_x1.png', cost: null }]);
  });
});

// A bubble pays one cost per slot (CauldronStats "CauldronCosts"), all priced at the level the reader types: the
// material on a curve, a liquid by steps, Bits doubling. The liquid has no page, so it carries its own art.
describe('bubble costs', () => {
  const NOTE = 'Base cost, before discounts. The game caps the material price at 1,000,000,000 after discounts.';
  // The game never discounts a liquid, and the cap is the material's alone.
  const liquid = (base, n, name, label = 'Liquid for this level') => ({
    formula: 'bubbleLiquidCost', args: { base }, currency: name, currencyIcon: `/data/Liquid${n}_x1.png`, label, note: 'No discounts apply.'
  });
  // The cauldron is the position in cauldrons.json, so the ones before it are there, empty.
  const priced = (bubble, cauldronIndex = 0) => bubbleNodes([0, 1, 2, 3].map((at) => (at === cauldronIndex ? [bubble] : [])), data);

  it('prices the material and the liquid, in the game slot order', () => {
    expect(bubbleNodes(cauldrons, data)['bubble:aUpgradesO0'].cost).toEqual([
      { formula: 'bubbleMaterialCost', args: { base: 1, bubbleIndex: 0 }, currency: 'Copper_Ore', label: 'Material for this level', note: NOTE },
      liquid(2, 1, 'Water Drops')
    ]);
  });

  // The game switches curves past index 14, so the node carries the index the formula splits on.
  it('carries the bubble index inside its cauldron', () => {
    const late = { ...cauldrons[0][0], bubbleIndex: '_15' };
    expect(priced(late)['bubble:aUpgradesO15'].cost[0].args).toEqual({ base: 1, bubbleIndex: 15 });
  });

  // A sailing treasure's raw display name is the placeholder "Strung_Jewels": the line takes its page's name instead.
  it('names a material after its item page', () => {
    const sailing = { ...cauldrons[0][0], itemReq: [{ rawName: 'SailTr9', name: 'Strung_Jewels', baseCost: 100 }] };
    expect(priced(sailing)['bubble:aUpgradesO0'].cost[0].currency).toBe('Sailing_Treasure_9');
  });

  // The four weapon power bubbles cost Bits, on their own doubling arm with no cap.
  it('prices a Bits bubble in Bits', () => {
    const bits = { ...cauldrons[0][0], bubbleIndex: '_20', itemReq: [{ rawName: 'Bits', name: 'Bits', baseCost: 10000 }, { rawName: 'Liquid3', name: 'Liquid3', baseCost: 5 }] };
    expect(priced(bits)['bubble:aUpgradesO20'].cost).toEqual([
      { formula: 'bubbleBitsCost', args: { base: 10000 }, currency: 'Bits', label: 'Bits for this level' },
      liquid(5, 3, 'Trench H2O')
    ]);
  });

  // GRIND_TIME costs two liquids and no material: each line is named after its liquid.
  it('names each liquid when a bubble pays in two', () => {
    const grind = { ...cauldrons[0][0], bubbleIndex: 'c8', itemReq: [{ rawName: 'Liquid1', baseCost: 50 }, { rawName: 'Liquid2', baseCost: 25 }, { rawName: 'Blank', baseCost: 0 }] };
    expect(priced(grind, 3)['bubble:aUpgradesY8'].cost).toEqual([
      liquid(50, 1, 'Water Drops', 'Water Drops for this level'),
      liquid(25, 2, 'Liquid N2', 'Liquid N2 for this level')
    ]);
  });

  it('leaves the cost out without its table', () => {
    try {
      const withoutTable = { ...data, gameTables: { ...data.gameTables, bubbleCost: undefined } };
      expect([bubbleNodes(cauldrons, withoutTable)['bubble:aUpgradesO0'].cost, missingTables()]).toEqual([undefined, ['bubbleCost']]);
    } finally {
      resetMissingTables();
    }
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
    expect(Object.keys(bubbleNodes(slots, data))).toEqual(['bubble:aUpgradesO0', 'bubble:aUpgradesG0']);
    expect(alchemyEdges({}, slots).map((edge) => edge.from)).toEqual(['bubble:aUpgradesO0', 'bubble:aUpgradesG0']);
  });

  it('drops exactly the seven BUBBLE slots in the shipped data', () => {
    const shipped = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'website-data', 'cauldrons.json'), 'utf-8'));
    const built = bubbleNodes(shipped, data);
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
    expect(Object.keys(bubbleNodes(readData('cauldrons.json'), data)).filter((id) => !graph.nodes[id])).toEqual([]);
  });

  it('draws every bubble cost with its art', () => {
    const bare = Object.entries(graph.nodes).filter(([, node]) => node.kind === 'bubble')
      .flatMap(([id, node]) => (node.cost || []).filter((cost) => !cost.currencyIcon).map((cost) => `${id}: ${cost.currency}`));
    expect(bare).toEqual([]);
  });

  // Swift Steppin's Pocket Sand and Water Drops at the wiki's Lv 1, 10 and 100, the game's price at levels 0, 9 and 99,
  // each drawn with its art: the material's from its item page, the liquid's own.
  it.each([[1, [1, 2]], [10, [11, 2]], [100, [1081860, 6]]])('prices Swift Steppin at Lv %s as the game does', (level, values) => {
    const node = graph.nodes['bubble:aUpgradesG0'];
    expect([node.liquids, costsAt(node, level).map(({ value, currency, currencyIcon, label }) => [value, currency, currencyIcon, label])]).toEqual([
      undefined,
      [
        [values[0], 'Pocket_Sand', graph.nodes['item:DesertA1'].icon, 'Material for this level'],
        [values[1], 'Water Drops', '/data/Liquid1_x1.png', 'Liquid for this level']
      ]
    ]);
  });
});
