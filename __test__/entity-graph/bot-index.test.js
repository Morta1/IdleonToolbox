import { describe, expect, it } from 'vitest';
import { buildBotIndex, humaniseCategory, shortDescription } from '../../scripts/entity-graph/bot-index.mjs';

const nodes = {
  'item:FoodG2': { kind: 'item', rawName: 'FoodG2', name: 'Golden_Jam', slug: 'golden-jam', icon: '/data/FoodG2.png', category: 'GOLDEN_FOOD', description: 'Increases your Max Health by 30%. Golden foods are never consumed.' },
  'item:Copper': { kind: 'item', rawName: 'Copper', name: 'Copper_Ore', slug: 'copper-ore', icon: '/data/Copper.png', category: 'ORE', description: 'Smelt_down_2_Ores into 1 Bar.' },
  'item:CopperBar': { kind: 'item', rawName: 'CopperBar', name: 'Copper_Bar', slug: 'copper-bar', icon: null, category: 'Bits' },
  'item:Dungeonite': { kind: 'item', rawName: 'Dungeonite', name: 'Dungeonite', slug: 'dungeonite', icon: null, obtainedFrom: 'Dungeons' },
  'item:Hidden': { kind: 'item', rawName: 'Hidden', name: 'Hidden', slug: 'hidden', navigable: false },
  'monster:chestG': { kind: 'monster', rawName: 'chestG', name: 'Golden_Chest', slug: 'golden-chest', icon: null, category: 'Monster' },
  'quest:Q1': { kind: 'quest', rawName: 'Q1', name: 'Quest_One', slug: 'quest-one' },
  'quest:Q2': { kind: 'quest', rawName: 'Q2', name: 'Quest_Two', slug: 'quest-two' },
  'talent:T1': { kind: 'talent', rawName: 'T1', name: 'Some_Talent', slug: 'some-talent', description: 'Gives {% damage' }
};
const edges = [
  { from: 'monster:chestG', to: 'item:FoodG2', rel: 'drops' },
  { from: 'quest:Q1', to: 'item:FoodG2', rel: 'rewards' },
  { from: 'quest:Q2', to: 'item:FoodG2', rel: 'rewards' },
  { from: 'quest:Q2', to: 'item:FoodG2', rel: 'rewards' },
  { from: 'item:CopperBar', to: 'item:Copper', rel: 'craftedFrom' },
  { from: 'monster:chestG', to: 'item:Copper', rel: 'hosts' }
];

describe('buildBotIndex', () => {
  const index = buildBotIndex(nodes, edges);
  const byId = Object.fromEntries(index.map((entry) => [entry.id, entry]));

  it('skips nodes that are not navigable or have no slug', () => {
    expect(byId['item:Hidden']).toBeUndefined();
  });

  it('builds the Golden Jam entry', () => {
    expect(byId['item:FoodG2']).toEqual({
      id: 'item:FoodG2', kind: 'item', kindLabel: 'Item', label: 'Golden Jam', slug: 'golden-jam',
      icon: '/data/FoodG2.png', category: 'Golden food',
      description: 'Increases your Max Health by 30%.',
      effect: null,
      sources: [
        { label: 'Dropped by', count: 1, names: ['Golden Chest'] },
        { label: 'Reward from', count: 2, names: ['Quest One', 'Quest Two'] }
      ],
      obtainedFrom: null, listed: true
    });
  });

  it('counts craftedFrom on the product side, ignores non-source relations', () => {
    expect(byId['item:CopperBar'].sources).toEqual([{ label: 'Crafted from', count: 1, names: ['Copper Ore'] }]);
    expect(byId['item:Copper'].sources).toEqual([]);
  });

  it('keeps obtainedFrom, drops template descriptions and kind-repeating categories', () => {
    expect(byId['item:Dungeonite'].obtainedFrom).toBe('Dungeons');
    expect(byId['talent:T1'].description).toBeNull();
    expect(byId['monster:chestG'].category).toBeNull();
    expect(byId['quest:Q1'].listed).toBe(false);
  });
});

describe('effect and source names', () => {
  const rich = {
    'item:CardsD3': { kind: 'item', rawName: 'CardsD3', name: 'Void_Card', slug: 'void-card', card: { effect: '+{%_Total_Mining_Efficiency', bonus: 6 } },
    'item:CardBad': { kind: 'item', rawName: 'CardBad', name: 'Bad_Card', slug: 'bad-card', card: { effect: '+{%_Thing_}', bonus: 6 } },
    'vial:V': { kind: 'vial', rawName: 'V', name: 'Vial_V', slug: 'vial-v', description: 'Brew_speed_+{%', effect: { func: 'add', x1: 3, x2: 0 } },
    'item:StampA1': { kind: 'item', rawName: 'StampA1', name: 'Sword_Stamp', slug: 'sword-stamp', stamp: { effect: { template: '+{_Base_Damage', func: 'add', x1: 1, x2: 0 } } },
    'item:Hat': { kind: 'item', rawName: 'Hat', name: 'Hat', slug: 'hat', stats: { STR: 2, Defence: 3, lvReqToEquip: 1 } },
    'item:Pile': { kind: 'item', rawName: 'Pile', name: 'Pile', slug: 'pile' },
    'monster:A': { kind: 'monster', rawName: 'A', name: 'Alpha', slug: 'a' },
    'monster:B': { kind: 'monster', rawName: 'B', name: 'Bravo', slug: 'b' },
    'monster:C': { kind: 'monster', rawName: 'C', name: 'Charlie', slug: 'c' },
    'monster:D': { kind: 'monster', rawName: 'D', name: 'Delta', slug: 'd' }
  };
  const drop = (from, chance, to = 'item:Pile') => ({ from, to, rel: 'drops', meta: { effectiveChance: chance } });
  const index = buildBotIndex(rich, [
    drop('monster:A', 0.1), drop('monster:B', 0.9), drop('monster:C', 0.5),
    drop('monster:A', 0.2, 'item:CardsD3'), drop('monster:D', 0.2, 'item:Hat'),
    ...['A', 'B', 'C', 'D'].map((id) => drop(`monster:${id}`, 0.1, 'item:StampA1'))
  ]);
  const byId = Object.fromEntries(index.map((entry) => [entry.id, entry]));

  it('fills card, vial, stamp and equipment effects the way the wiki does', () => {
    expect(byId['item:CardsD3'].effect).toBe('+6% Total Mining Efficiency');
    expect(byId['vial:V'].effect).toBe('Brew speed +3%');
    expect(byId['item:StampA1'].effect).toBe('+1 Base Damage');
    expect(byId['item:Hat'].effect).toBe('+2 STR · +3 Defence');
  });

  it('leaves effect null when a placeholder survives or nothing applies', () => {
    expect(byId['item:CardBad'].effect).toBeNull();
    expect(byId['item:Pile'].effect).toBeNull();
  });

  it('names up to three sources, highest drop chance first, and omits names beyond that', () => {
    expect(byId['item:Pile'].sources).toEqual([{ label: 'Dropped by', count: 3, names: ['Bravo', 'Charlie', 'Alpha'] }]);
    expect(byId['item:StampA1'].sources).toEqual([{ label: 'Dropped by', count: 4 }]);
  });
});

describe('talent effect', () => {
  it('shows the level-dependent numbers as X and Y', () => {
    const [entry] = buildBotIndex({
      'talent:T': { kind: 'talent', rawName: 'T', name: 'Maestro_Transfusion', slug: 't', description: '+{%_Skill_EXP_Gain,_and_-}%_Skill_Efficiency.', funcX: 'add', funcY: 'decay' }
    }, []);
    expect(entry.effect).toBe('+X% Skill EXP Gain, and -Y% Skill Efficiency.');
    expect(entry.description).toBeNull();
  });
});

describe('helpers', () => {
  it('humaniseCategory', () => {
    expect(humaniseCategory('GOLDEN_FOOD')).toBe('Golden food');
    expect(humaniseCategory('Bits')).toBe('Bits');
    expect(humaniseCategory(undefined)).toBeNull();
  });

  it('shortDescription cleans underscores, keeps the first sentence, caps at 200', () => {
    expect(shortDescription('Smelt_down_2_Ores into 1 Bar.')).toBe('Smelt down 2 Ores into 1 Bar.');
    expect(shortDescription('x'.repeat(250))).toBe(`${'x'.repeat(199)}…`);
    expect(shortDescription('Has a {template}')).toBeNull();
  });
});
