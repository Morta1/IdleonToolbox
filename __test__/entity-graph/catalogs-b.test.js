import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import {
  artifactIslands, artifactNodes, equinoxNodes, godNodes, jadeNodes, superbitNodes
} from '../../scripts/entity-graph/nodes/catalogs-b.mjs';

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
    expect(godNodes(gods)['god:DivGod1']).toMatchObject({ kind: 'god', name: 'Arctis', icon: '/data/DivGod1.png', category: 'World 5' });
  });

  it('fills the minor bonus at its ceiling and the blessing at level one', () => {
    expect(godNodes(gods)['god:DivGod0'].description).toBe(
      '+30%_AFK_Gains_for_all_activities! Minor bonus for a linked character, at most: +70%_accuracy_and_+70%_defence. '
      + 'Blessing, Level 1: +2%_Divinity_PTS_Gain.'
    );
  });

  // The multiplier column is in godIndex order: slot 1 (Arctis) reads row 2, not its own row.
  it('reads the minor multiplier through godIndex, not the slot row', () => {
    expect(godNodes(gods)['god:DivGod1'].description).toContain('+15_Talent_LV.');
    expect(godNodes(gods)['god:DivGod2'].description).toContain('+150%_Total_Damage.');
  });

  it('gives Kattlekruk its base daily levels and drops the bubble list it cannot name', () => {
    const { description } = godNodes(gods)['god:DivGod3'];
    expect(description).toContain('+20_LV_for_some_Alchemy_Bubbles._Only_1_player_can_link_here.');
    expect(description).not.toMatch(/[#$@]/);
  });

  it('does not double the full stop when the game text already has one', () => {
    expect(godNodes(gods)['god:DivGod3'].description).toContain('Minor bonus: Nothing._Be_patient_mortal.');
    expect(godNodes(gods)['god:DivGod3'].description).not.toContain('..');
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
    expect(artifactNodes(artifacts, islands)['artifact:Arti1'].description).toBe('+2%_coins_per_class_level. Found on Safari_Island.');
    expect(artifactNodes(artifacts, islands)['artifact:Arti7'].description).toBe('+15%_bits_per_10_items. Found on The_Maw.');
  });

  it('counts the full four artifacts on The Edge when assigning islands', () => {
    expect(artifactIslands(artifacts, islands).slice(2, 7)).toEqual(['The_Edge', 'The_Edge', 'The_Edge', 'The_Edge', 'The_Maw']);
  });

  it('replaces the lone $ in the Deathskull text', () => {
    expect(artifactNodes(artifacts, islands)['artifact:Arti6'].description).toMatch(/^Gives_\+1_Gallery_Slots/);
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
    expect(nodes['superbit:Superbit0'].description).toBe("x1.03_bits_per_Achievement_you've_unlocked. Super Bit, costs 1e9 bits.");
  });

  it('draws the bits sprite for the cost tier', () => {
    expect(superbitNodes(superbits)['superbit:Superbit0'].icon).toBe('/etc/Bits_0.png');
    expect(superbitNodes(superbits)['superbit:Superbit1'].icon).toBe('/etc/Bits_5.png');
  });
});

describe('equinox nodes', () => {
  const upgrades = [
    { name: 'Matching_Scims', description: "{10%_Damage._Its_own_multiplier_@___@_Total_Bonus:_{}%_DMG", maxLevel: 8, bonus: 10 },
    { name: 'Food_Lust', description: 'Stacks_up_to_}_times._@___@_(0.80x_cost)', maxLevel: 10, bonus: 1 },
    { name: 'Hmm...', description: 'Huh...', maxLevel: 2, bonus: null }
  ];

  it('reads a leading brace as a gain, drops the total, and states the max level', () => {
    expect(equinoxNodes(upgrades)['equinox:Dream_Upgrade_1'].description).toBe('Level 1: +10%_Damage._Its_own_multiplier Max level 8.');
  });

  it('fills the running total with the per-level bonus', () => {
    expect(equinoxNodes(upgrades)['equinox:Dream_Upgrade_2'].description).toBe('Level 1: Stacks_up_to_1_times._(0.80x_cost) Max level 10.');
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
    god: godNodes(shared.gods),
    artifact: artifactNodes(read('artifacts.json'), shared.islands),
    superbit: superbitNodes(shared.superbitsUpgrades),
    equinox: equinoxNodes(shared.equinoxUpgrades),
    jade: jadeNodes(shared.jadeUpgrades)
  };

  it('builds every catalog at the expected size', () => {
    expect(Object.keys(built.god)).toHaveLength(10);
    expect(Object.keys(built.artifact)).toHaveLength(41);
    expect(Object.keys(built.superbit)).toHaveLength(69);
    expect(Object.keys(built.equinox)).toHaveLength(13);
    expect(Object.keys(built.jade)).toHaveLength(47);
  });

  it('keys every node by its own kind and rawName, with a name and a world category', () => {
    for (const [kind, nodes] of Object.entries(built)) {
      for (const [id, node] of Object.entries(nodes)) {
        expect(id).toBe(`${kind}:${node.rawName}`);
        expect(node.kind).toBe(kind);
        expect(node.name).toBeTruthy();
        expect(node.category).toMatch(/^World \d$/);
      }
    }
  });

  it('points every node at an icon that exists', () => {
    const missing = Object.values(built).flatMap((nodes) => Object.values(nodes))
      .filter((node) => !fs.existsSync(path.join(process.cwd(), 'public', node.icon)))
      .map((node) => `${node.kind}:${node.rawName} ${node.icon}`);
    expect(missing).toEqual([]);
  });

  it('leaves no placeholder or in-font glyph in any description', () => {
    const bad = Object.values(built).flatMap((nodes) => Object.values(nodes))
      .filter((node) => !node.description || /[{}$@#船般航舞製]/.test(node.description) || /\.\./.test(node.description.replace(/\.\.\./g, '')))
      .map((node) => `${node.kind}:${node.rawName} ${node.description}`);
    expect(bad).toEqual([]);
  });

  it('places every artifact on an island', () => {
    expect(Object.values(built.artifact).filter((node) => !/Found on /.test(node.description))).toEqual([]);
  });
});
