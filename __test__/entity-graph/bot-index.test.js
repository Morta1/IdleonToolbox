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
      obtainedFrom: null, path: '/wiki/item/golden-jam', listingPath: '/wiki/item'
    });
  });

  // A same-name page carries the label that tells it from its twin; a unique one (Golden Jam) has no field.
  it('carries the disambiguator of a same-name page', () => {
    const [entry] = buildBotIndex({
      'mineheadopponent:MineheadOpp21': {
        kind: 'mineheadopponent', rawName: 'MineheadOpp21', name: 'Brainhead', slug: 'brainhead--mineheadopp21',
        icon: '/data/MineH6.png', category: 'World 7', disambig: '#22'
      }
    }, []);
    expect(entry).toEqual({
      id: 'mineheadopponent:MineheadOpp21', kind: 'mineheadopponent', kindLabel: 'Minehead Opponent',
      label: 'Brainhead', disambig: '#22', slug: 'brainhead--mineheadopp21', icon: '/data/MineH6.png',
      category: 'World 7', description: null, effect: null, sources: [], obtainedFrom: null,
      path: '/wiki/minehead/opponents/brainhead--mineheadopp21', listingPath: '/wiki/minehead/opponents'
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
    expect(byId['quest:Q1'].listingPath).toBeNull();
  });

  // A system's kinds sit under it, so the bot has to take both URLs from the site rather than build them from the kind.
  it('carries the page and listing URLs of a kind filed under a system', () => {
    const [entry] = buildBotIndex({
      'equinox:E1': { kind: 'equinox', rawName: 'E1', name: 'Equinox_Dreams', slug: 'equinox-dreams' }
    }, []);
    expect([entry.path, entry.listingPath]).toEqual(['/wiki/equinox/upgrades/equinox-dreams', '/wiki/equinox/upgrades']);
  });
});

describe('effect and source names', () => {
  const rich = {
    'item:CardsD3': { kind: 'item', rawName: 'CardsD3', name: 'Void_Card', slug: 'void-card', card: { effect: '+{%_Total_Mining_Efficiency', bonus: 6 } },
    'item:CardBad': { kind: 'item', rawName: 'CardBad', name: 'Bad_Card', slug: 'bad-card', card: { effect: '+{%_Thing_}', bonus: 6 } },
    'vial:V': { kind: 'vial', rawName: 'V', name: 'Vial_V', slug: 'vial-v', description: 'Brew_speed_+{%', effect: { levelLabel: 'Vial level', cap: null, terms: [{ token: '{', formula: 'growth', args: { func: 'add', x1: 3, x2: 0 } }] } },
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
    expect(byId['vial:V'].effect).toBe('Lv 1: Brew speed +3%');
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
  it('reads the level-dependent numbers at level 1, labelled', () => {
    const [entry] = buildBotIndex({
      'talent:T': {
        kind: 'talent', rawName: 'T', name: 'Maestro_Transfusion', slug: 't',
        description: '+{%_Skill_EXP_Gain,_and_-}%_Skill_Efficiency.',
        effect: {
          levelLabel: 'Talent level', cap: null, terms: [
            { token: '{', formula: 'growth', args: { func: 'add', x1: 2, x2: 0 } },
            { token: '}', formula: 'growth', args: { func: 'add', x1: 1, x2: 0 } }
          ]
        }
      }
    }, []);
    expect(entry.effect).toBe('Lv 1: +2% Skill EXP Gain, and -1% Skill Efficiency.');
    expect(entry.description).toBeNull();
  });
});

describe('capped effect', () => {
  // A vial-shaped node capped at 13. The growth is `add` with x1 3, x2 0: 3 per level, so level 1
  // reads 3 and level 13 reads 13 * 3 = 39.
  it('reads level 1 and the cap, each labelled', () => {
    const [entry] = buildBotIndex({
      'vial:V': {
        kind: 'vial', rawName: 'V', name: 'Vial_V', slug: 'vial-v', description: 'Brew_speed_+{%',
        effect: { levelLabel: 'Vial level', cap: 13, terms: [{ token: '{', formula: 'growth', args: { func: 'add', x1: 3, x2: 0 } }] }
      }
    }, []);
    expect(entry.effect).toBe('Lv 1: Brew speed +3% · Lv 13 (max): Brew speed +39%');
  });

  // A sneaking floor's calculator opens on Ninja Mastery 0, so the bot reads it there too, under the page's own
  // word for the level: Mastery 0 is not a level 0.
  it('reads an effect that starts at 0 at 0, named as the page names it', () => {
    const [entry] = buildBotIndex({
      'sneakfloor:F': {
        kind: 'sneakfloor', rawName: 'F', name: 'Floor 1', slug: 'floor-1', description: 'Door_HP:_{',
        effect: { levelLabel: 'Ninja Mastery', cap: null, from: 0, terms: [{ token: '{', formula: 'pow', args: { base: 5, rate: 2 } }] }
      }
    }, []);
    expect(entry.effect).toBe('Ninja Mastery 0: Door HP: 5');
  });

  // A sentence with no number in it reads the same at every level, so a level label would only
  // suggest it changes.
  it.each([
    ['a term whose token is absent', [{ token: '{', formula: 'linear', args: { perLevel: 2 } }]],
    ['no terms (a cost-only node)', []]
  ])('prints the plain sentence when the description has %s', (unused, terms) => {
    const [entry] = buildBotIndex({
      'owl:O': {
        kind: 'owl', rawName: 'O', name: 'Owl_O', slug: 'owl-o', description: 'Reset_almost_all_Upgrades.',
        effect: { levelLabel: 'Upgrade level', cap: 13, terms }
      }
    }, []);
    expect(entry.effect).toBe('Reset almost all Upgrades.');
  });
});

// A merit shop or a trait tier has no effect of its own: its answer is its sub-entries, a capped one at its cap.
describe('entries effect', () => {
  it('joins the entries at their cap, an entry with no effect as its sentence', () => {
    const [entry] = buildBotIndex({
      'shop:S': {
        kind: 'shop', rawName: 'S', name: 'Shop', slug: 'shop', description: 'A_shop.',
        entries: [
          { key: 'A', description: '+{%_faster', effect: { levelLabel: 'Purchases', cap: 4, terms: [{ token: '{', formula: 'linear', args: { perLevel: 2 } }] } },
          { key: 'B', description: 'Start_with_2_items' },
          { key: 'C', effect: { levelLabel: 'Purchases', cap: 2, terms: [] } }
        ]
      }
    }, []);
    expect(entry.effect).toBe('At max: +8% faster · Start with 2 items');
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

  // A period after an abbreviation is not the end of the sentence, with one rule per kind: Mr./Mrs./Ms./Sr./Jr./vs./St.
  // and single-capital initials always skip, "Lv"/"Lvs" skip only when a digit or lowercase word follows (otherwise
  // "per sailing LV. Found on Safari Island." is two sentences), and "Dr" is case-sensitive ("DR" is Drop Rate).
  it.each([
    ['Get 3 vials to Lv. 4, which are the green ones.', 'Get 3 vials to Lv. 4, which are the green ones.'],
    ['Reach Lv. 4 to unlock this. Then rest.', 'Reach Lv. 4 to unlock this.'],
    ['Reach LV. 20 to unlock this. Then rest.', 'Reach LV. 20 to unlock this.'],
    ['Reach lv. 20 to unlock this. Then rest.', 'Reach lv. 20 to unlock this.'],
    ['Needs Lvs. 2 and 3 first. Then rest.', 'Needs Lvs. 2 and 3 first.'],
    ['Raise your Lv. up to the cap. Then rest.', 'Raise your Lv. up to the cap.'],
    ['+1% find chance per sailing LV. Found on Safari Island.', '+1% find chance per sailing LV.'],
    ['Boosted by each Lvs. Stacks with others. Then more.', 'Boosted by each Lvs.'],
    ['Thanks to Mr. Pigibank for the loan. Pay it back.', 'Thanks to Mr. Pigibank for the loan.'],
    ['Mrs. Claus and Dr. Hoggindaz agree. Nobody else does.', 'Mrs. Claus and Dr. Hoggindaz agree.'],
    ['Also known as DR. More text follows.', 'Also known as DR.'],
    ['Ms. Shuvelle votes. So does King Goldrichius Sr. Elvar.', 'Ms. Shuvelle votes.'],
    ['Goldrichius Jr. Elvar votes. Then rest.', 'Goldrichius Jr. Elvar votes.'],
    ['Fast vs. slow is a choice. Pick one.', 'Fast vs. slow is a choice.'],
    ['Ask St. Nick about it. Then rest.', 'Ask St. Nick about it.'],
    ['Defeat C. Chizoar. Then rest.', 'Defeat C. Chizoar.'],
    ['Reach LV.', 'Reach LV.'],
    ['Costs 5 EXP. Then more.', 'Costs 5 EXP.'],
    ['Is this a question? Yes! Maybe.', 'Is this a question?']
  ])('shortDescription does not end a sentence on an abbreviation: %s', (input, expected) => {
    expect(shortDescription(input)).toBe(expected);
  });
});
