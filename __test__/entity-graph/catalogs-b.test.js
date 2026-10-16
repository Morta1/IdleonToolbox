import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import {
  artifactIslands, artifactNodes, equinoxNodes, godNodes, jadeNodes, superbitNodes
} from '../../scripts/entity-graph/nodes/catalogs-b.mjs';
import { levelledText } from '../../utility/wiki/effects.mjs';
import { loadWebsiteData, resetMissingTables } from '../../scripts/entity-graph/registry/data.mjs';

const data = loadWebsiteData(path.join(process.cwd(), 'data', 'website-data'));

const gods = [
  {
    name: 'Snehebatu', majorBonus: '+30%_AFK_Gains_for_all_activities!', minorBonus: '+{%_accuracy_and_+{%_defence',
    blessing: '+{%_Divinity_PTS_Gain', minorBonusMultiplier: 70, godIndex: '0', blessingMultiplier: 2
  },
  {
    name: 'Arctis', majorBonus: 'Always_active_in_the_Lab.', minorBonus: '+{_Talent_LV',
    blessing: '+{%_Divinity_PTS_Gain', minorBonusMultiplier: 150, godIndex: '2', blessingMultiplier: 3
  },
  {
    name: 'Nobisect', majorBonus: '2x_kills.', minorBonus: '+{%_Total_Damage',
    blessing: '+{_All_Skill_Efficiency', minorBonusMultiplier: 15, godIndex: '1', blessingMultiplier: 50
  },
  {
    name: 'Kattlekruk', majorBonus: 'Every_day_you_play,_you_get_+$_LV_for_these_Alchemy_Bubbles:_@_#_@___@_Only_1_player_can_link_here.',
    minorBonus: 'Nothing._Be_patient_mortal.', blessing: '+{%_Sailing_Speed', minorBonusMultiplier: 1, godIndex: '1', blessingMultiplier: 5
  }
];

describe('god nodes', () => {
  it('keys a god by its slot, the number its icon carries', () => {
    expect(godNodes(gods, data)['god:DivGod1']).toMatchObject({ kind: 'god', name: 'Arctis', icon: '/data/DivGod1.png', category: 'World 5' });
  });

  it('fills the minor bonus at its ceiling and the blessing at level one', () => {
    expect(godNodes(gods, data)['god:DivGod0'].description).toBe(
      '+30%_AFK_Gains_for_all_activities! Minor bonus for a linked character, at most: +70%_accuracy_and_+70%_defence. '
      + 'Blessing, Level 1: +2%_Divinity_PTS_Gain.'
    );
  });

  // The multiplier column is in godIndex order: slot 1 (Arctis) reads row 2, not its own row.
  it('reads the minor multiplier through godIndex, not the slot row', () => {
    expect(godNodes(gods, data)['god:DivGod1'].description).toContain('+15_Talent_LV.');
    expect(godNodes(gods, data)['god:DivGod2'].description).toContain('+150%_Total_Damage.');
  });

  it('gives Kattlekruk its base daily levels and drops the bubble list it cannot name', () => {
    const { description } = godNodes(gods, data)['god:DivGod3'];
    expect(description).toContain('+20_LV_for_some_Alchemy_Bubbles._Only_1_player_can_link_here.');
    expect(description).not.toMatch(/[#$@]/);
  });

  // With no base to fill, the daily-levels sentence goes rather than print the raw token.
  it('leaves out the Kattlekruk daily levels without their table', () => {
    try {
      expect(godNodes(gods, {})['god:DivGod3'].description.split(' ')[0]).toBe('Only_1_player_can_link_here.');
    } finally {
      resetMissingTables();
    }
  });

  it('does not double the full stop when the game text already has one', () => {
    expect(godNodes(gods, data)['god:DivGod3'].description).toContain('Minor bonus: Nothing._Be_patient_mortal.');
    expect(godNodes(gods, data)['god:DivGod3'].description).not.toContain('..');
  });
});

describe('artifact nodes', () => {
  const islands = [
    { name: 'Safari_Island', numberOfArtifacts: 2 },
    { name: 'The_Edge', numberOfArtifacts: 1 },
    { name: 'The_Maw', numberOfArtifacts: 2 }
  ];
  const artifacts = [
    { name: 'Moai_Head', description: 'Get_shrine_bonuses!', baseBonus: 1 },
    { name: 'Maneki_Kat', description: '+{%_coins_per_class_level._Total_Bonus:_+}%_coins', baseBonus: 2 },
    { name: 'Lantern_A', description: 'Shimmer_x2.', baseBonus: 1 },
    { name: 'Lantern_B', description: 'Winner_x1.25.', baseBonus: 1 },
    { name: 'Lantern_C', description: 'Onyx_x2.3.', baseBonus: 1 },
    { name: 'Lantern_D', description: 'Particles.', baseBonus: 1 },
    { name: 'Deathskull', description: '$', baseBonus: 1 },
    { name: 'Gummy_Orb', description: '+{%_bits_per_10_items._@_Total_Bonus:_+}%_bits', baseBonus: 15 }
  ];

  it('fills the placeholder at the base bonus and drops the live total', () => {
    expect(artifactNodes(artifacts, islands, data)['artifact:Arti1'].description).toBe('+2%_coins_per_class_level. Found on Safari_Island.');
    expect(artifactNodes(artifacts, islands, data)['artifact:Arti7'].description).toBe('+15%_bits_per_10_items. Found on The_Maw.');
  });

  it('counts the full four artifacts on The Edge when assigning islands', () => {
    expect(artifactIslands(artifacts, islands).slice(2, 7)).toEqual(['The_Edge', 'The_Edge', 'The_Edge', 'The_Edge', 'The_Maw']);
  });

  // Deathskull is found by its index in the real list, not by name.
  it('replaces the lone $ in the Deathskull text with its base form', () => {
    expect(artifactNodes(data.artifacts, data.islands, data)['artifact:Arti33'].description)
      .toBe("Gives_+1_Gallery_Slots_for_Trophies_in_World_7! Found on World's_End.");
  });
});

describe('superbit nodes', () => {
  const superbits = [
    { index: 0, x1: 1, x2: 9, name: 'Bits_Per_Achievement', description: "x1.03_bits_per_Achievement_you've_unlocked_(})._Total_bonus:_x{_bits" },
    { index: 1, x1: 4, x2: 100, name: 'Cooking_Master', description: 'Boosts_Cooking_Mastery.' },
    { index: 2, x1: 2, x2: 150, name: 'Not_Happening', description: "You?_Buying_THIS??" }
  ];

  it('drops the live total, and the unbuyable joke entries', () => {
    const nodes = superbitNodes(superbits);
    expect(Object.keys(nodes)).toEqual(['superbit:Superbit0', 'superbit:Superbit1']);
    expect(nodes['superbit:Superbit0'].description).toBe("x1.03_bits_per_Achievement_you've_unlocked.");
  });

  // The old sentence read "Super Bit, costs 1e9 bits": the tier and the price are now rows, the price with the bits
  // sprite of its tier of magnitude, and the page has no art of its own.
  it('boxes the tier and the cost with the bits sprite for the cost tier', () => {
    const nodes = superbitNodes(superbits);
    expect([nodes['superbit:Superbit0'], nodes['superbit:Superbit1']].map(({ icon, fields }) => [icon, fields])).toEqual([
      [null, [{ label: 'Tier', value: 'Super Bit' }, { label: 'Cost', value: 1e9, format: 'cost', currency: 'Bits', currencyIcon: '/etc/Bits_0.png' }]],
      [null, [{ label: 'Tier', value: 'Super Bit' }, { label: 'Cost', value: 4e100, format: 'cost', currency: 'Bits', currencyIcon: '/etc/Bits_5.png' }]]
    ]);
  });
});

describe('equinox nodes', () => {
  const upgrades = [
    { name: 'Matching_Scims', description: "{10%_Damage._Its_own_multiplier_@___@_Total_Bonus:_{}%_DMG", maxLevel: 8, bonus: 10 },
    { name: 'Food_Lust', description: 'Stacks_up_to_}_times._@___@_(0.80x_cost)', maxLevel: 10, bonus: 1 },
    { name: 'Hmm...', description: 'Huh...', maxLevel: 2, bonus: null }
  ];

  // The old sentences read "Level 1: +10%_Damage" and "Stacks_up_to_1_times" with the max level after them.
  it.each([
    ['Dream_Upgrade_1', 1, '+10% Damage. Its own multiplier'],
    ['Dream_Upgrade_1', 8, '+80% Damage. Its own multiplier'],
    ['Dream_Upgrade_2', 1, 'Stacks up to 1 times. (0.80x cost)'],
    ['Dream_Upgrade_2', 10, 'Stacks up to 10 times. (0.80x cost)']
  ])('%s reads its per-level bonus times level %s, the total dropped', (raw, level, text) => {
    expect(levelledText(equinoxNodes(upgrades)[`equinox:${raw}`], level)).toBe(text);
  });

  // Clouds and other bonuses raise most max levels, so the field has no cap and the base is a row.
  it('states the base max level as a row, levelled or not', () => {
    const nodes = equinoxNodes([...upgrades, { name: 'Shades_of_K', description: 'Adds_another_choice', maxLevel: 3, bonus: 0 }]);
    expect(Object.values(nodes).map(({ registry, effect, fields }) => [Boolean(registry), effect?.cap ?? null, fields])).toEqual([
      [true, null, [{ label: 'Base max level', value: 8 }]],
      [true, null, [{ label: 'Base max level', value: 10 }]],
      [false, null, [{ label: 'Base max level', value: 3 }]]
    ]);
  });

  it('leaves out the hidden placeholder', () => {
    expect(Object.keys(equinoxNodes(upgrades))).toHaveLength(2);
  });
});

describe('jade nodes', () => {
  it('keys an upgrade by its sprite number and skips the unreleased stubs', () => {
    const nodes = jadeNodes([
      { name: 'Quick_Ref_Access', x3: 0, description: 'Adds_QuickRef!' },
      { name: 'UNDER_CONSTRUCTION', x3: 47, description: 'Not_out_yet.' }
    ]);
    expect(nodes).toEqual({
      'jade:NjJupg0': {
        kind: 'jade', rawName: 'NjJupg0', name: 'Quick_Ref_Access', icon: '/data/NjJupg0.png', category: 'World 6', description: 'Adds_QuickRef!'
      }
    });
  });
});

describe('real data', () => {
  const dataDir = path.join(process.cwd(), 'data', 'website-data');
  const read = (name) => JSON.parse(fs.readFileSync(path.join(dataDir, name), 'utf-8'));
  const shared = read('shared-data.json');
  const built = {
    god: godNodes(shared.gods, data),
    artifact: artifactNodes(read('artifacts.json'), shared.islands, data),
    superbit: superbitNodes(shared.superbitsUpgrades),
    equinox: equinoxNodes(shared.equinoxUpgrades),
    jade: jadeNodes(shared.jadeUpgrades)
  };

  // Key, icon, description and name checks for these catalogs run in catalogs-a.test.js, alongside
  // the catalogs-a ones. Superbits keep a hard count: the unbuyable rows are dropped by an exponent
  // threshold inside the builder, which the test would have to copy to derive it.
  it('builds every catalog entry that is not a placeholder', () => {
    expect(Object.keys(built.god)).toHaveLength(shared.gods.length);
    expect(Object.keys(built.artifact)).toHaveLength(read('artifacts.json').length);
    expect(Object.keys(built.superbit)).toHaveLength(69);
    expect(Object.keys(built.equinox)).toHaveLength(shared.equinoxUpgrades.filter((upgrade) => upgrade.name !== 'Hmm...').length);
    expect(Object.keys(built.jade)).toHaveLength(shared.jadeUpgrades.filter((upgrade) => upgrade.name !== 'UNDER_CONSTRUCTION').length);
  });

  it('places every artifact on an island', () => {
    expect(Object.values(built.artifact).filter((node) => !/Found on /.test(node.description))).toEqual([]);
  });
});
