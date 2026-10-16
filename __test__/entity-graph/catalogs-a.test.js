import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import {
  arcadeNodes, constellationNodes, growth, postBoxNodes, sigilNodes, starSignNodes
} from '../../scripts/entity-graph/nodes/catalogs-a.mjs';
import { constellationEdges } from '../../scripts/entity-graph/edges/catalogs-a.mjs';
import {
  artifactNodes, equinoxNodes, godNodes, jadeNodes, superbitNodes
} from '../../scripts/entity-graph/nodes/catalogs-b.mjs';
import { loadWebsiteData } from '../../scripts/entity-graph/registry/data.mjs';
import { firstLevel, levelledLines, levelledText } from '../../utility/wiki/effects.mjs';

const data = loadWebsiteData(path.join(process.cwd(), 'data', 'website-data'));

describe('growth', () => {
  it('reproduces the three curves the catalogs use', () => {
    expect(growth('add', 10, 0.25, 0)).toBe(2.5);
    expect(growth('decay', 100, 60, 100)).toBe(30);
    expect(growth('intervalAdd', 400, 1, 2)).toBe(201);
  });

  it('returns null for a curve it does not know', () => {
    expect(growth('bigBase', 5, 1, 2)).toBeNull();
  });
});

describe('star sign nodes', () => {
  const sign = (starName, bonuses, extra = {}) => ({ starName, cost: 1, tree: 'chronus', bonuses, ...extra });

  // The description keeps the bonuses as one sentence for search and the bot; the page shows them as rows.
  it('fills each bonus, joins them with a comma and gives each its own row', () => {
    const nodes = starSignNodes([sign('The_Buff_Guy', [
      { bonus: 1, rawName: '+{%_Total_Damage' }, { bonus: 3, rawName: '+{_STR' }
    ])]);
    expect(nodes['starsign:The_Buff_Guy']).toMatchObject({
      kind: 'starsign',
      category: 'Chronus',
      description: '+1%_Total_Damage, +3_STR',
      fieldsLabel: 'Bonuses',
      fields: [{ label: 'Total Damage', value: '+1%' }, { label: 'STR', value: '+3' }],
      hideDescription: true
    });
  });

  it('runs a trailing fragment on rather than starting a new bonus', () => {
    const nodes = starSignNodes([sign('Gum_Drop', [
      { bonus: 15, rawName: '+{%_to_get_a_Time' }, { bonus: 0, rawName: 'Candy_when_claiming' },
      { bonus: 8, rawName: '{+_Hour_AFK_gains' }
    ])]);
    expect(nodes['starsign:Gum_Drop'].description).toBe('+15%_to_get_a_Time Candy_when_claiming, 8+_Hour_AFK_gains');
    expect(nodes['starsign:Gum_Drop'].fields).toEqual([
      { label: 'to get a Time Candy when claiming', value: '+15%' },
      { label: 'Hour AFK gains', value: '+8' }
    ]);
  });

  it('does not double the minus of a negative bonus', () => {
    const nodes = starSignNodes([sign('The_Bulwark', [{ bonus: -12, rawName: '-{%_Movement_Speed' }])]);
    expect(nodes['starsign:The_Bulwark'].description).toBe('-12%_Movement_Speed');
    expect(nodes['starsign:The_Bulwark'].fields).toEqual([{ label: 'Movement Speed', value: '-12%' }]);
  });

  // `{.{` keeps its decimals: Blue Hedgehog's 0.0001% Ring Drop read as 0 at two decimals.
  it.each([
    [1.1, '{.{x_Star_Sign_bonuses', '1.1x_Star_Sign_bonuses', { label: 'Star Sign bonuses', value: '1.1x' }],
    [0.0001, '+{.{%_Ring_Drop', '+0.0001%_Ring_Drop', { label: 'Ring Drop', value: '+0.0001%' }]
  ])('fills the decimal marker of %s', (bonus, rawName, description, row) => {
    const [node] = Object.values(starSignNodes([sign('Cosmos', [{ bonus, rawName }])]));
    expect([node.description, node.fields]).toEqual([description, [row]]);
  });

  it('keeps a bonus whose number sits mid-sentence as one row, and a continuation number in the stat', () => {
    const nodes = starSignNodes([
      sign('Chronus_Cosmos', [{ bonus: 0, rawName: 'All_characters_can' }, { bonus: 2, rawName: 'now_align_with_{' }]),
      sign('Grim_Reaper_Major', [{ bonus: 4, rawName: '+{%_Mob_Respawn_rate' }, { bonus: 60, rawName: '(If_Lv&{)' }])
    ]);
    expect([nodes['starsign:Chronus_Cosmos'].fields, nodes['starsign:Grim_Reaper_Major'].fields]).toEqual([
      [{ label: 'Bonus', value: 'All characters can now align with 2' }],
      [{ label: 'Mob Respawn rate (If Lv&60)', value: '+4%' }]
    ]);
  });

  it('drops the filler rows and the unreachable sign', () => {
    const nodes = starSignNodes([
      { starName: 'Fillerz48', cost: 999, tree: 'seraph', bonuses: [] },
      { starName: 'Glimmer_of_Beyond', cost: 999, tree: 'seraph', description: 'x' }
    ]);
    expect(nodes).toEqual({});
  });
});

describe('constellation nodes and edges', () => {
  const entries = [{ rawIndex: 12, mapIndex: 52, requiredPlayers: 3, points: 4, name: 'B-1', requirement: 'Reach_this_star_on_3_players' }];

  it('keys a constellation by its letter, bands it by the world of its map and boxes its facts', () => {
    expect(constellationNodes(entries)['constellation:B-1']).toMatchObject({
      kind: 'constellation',
      name: 'Constellation_B-1',
      category: 'World 2',
      description: 'Reach_this_star_on_3_players. Worth 4 points.',
      fields: [
        { label: 'Requirement', value: 'Reach this star on 3 players.' },
        { label: 'Points', value: 4 },
        { label: 'World', value: 'World 2' }
      ],
      hideDescription: true
    });
  });

  it('does not stack a full stop on a requirement that already ends in one', () => {
    const [node] = Object.values(constellationNodes([{ ...entries[0], requirement: 'AFK_here_for_1+_hours.' }]));
    expect(node.description).toBe('AFK_here_for_1+_hours. Worth 4 points.');
  });

  it('places the constellation on its map', () => {
    expect(constellationEdges(entries)).toEqual([{
      from: 'constellation:B-1', to: 'map:52', rel: 'locatedIn', meta: {}, source: 'catalogs-a'
    }]);
  });
});

describe('post office box nodes', () => {
  const box = {
    name: 'Civil_War_Memory_Box',
    upgradeLevels: [24.9, 99.9, 400.1],
    maxLevel: 400,
    upgrades: [
      { bonus: '_Base_Damage', x1: 1, x2: 0, func: 'add' },
      { bonus: '%_Fight_AFK_Gains', x1: 13, x2: 200, func: 'decay' },
      { bonus: '%_Critical_Chance', x1: 10, x2: 200, func: 'decay' }
    ]
  };

  // The old sentence printed +400, +8.48% and +6% at level 400; a bonus past a threshold reads 0 until it is passed.
  it.each([
    [400, ['+400 Base Damage', '+8.48% Fight AFK Gains', '+6% Critical Chance']],
    [25, ['+25 Base Damage', '+0% Fight AFK Gains', '+0% Critical Chance']],
    [26, ['+26 Base Damage', '+0.06% Fight AFK Gains', '+0% Critical Chance']]
  ])('reads each bonus as its own line at level %s', (level, texts) => {
    expect(levelledLines(postBoxNodes([box])['postbox:UIboxUpg0'], level)).toEqual([
      { label: null, text: texts[0] },
      { label: 'Above level 25', text: texts[1] },
      { label: 'Above level 100', text: texts[2] }
    ]);
  });

  it('caps the level field at the box max and joins the lines for the bot', () => {
    const node = postBoxNodes([box])['postbox:UIboxUpg0'];
    expect([node.effect.cap, levelledText(node, 400)])
      .toEqual([400, '+400 Base Damage. Above level 25: +8.48% Fight AFK Gains. Above level 100: +6% Critical Chance.']);
  });

  it('skips the filler boxes', () => {
    expect(postBoxNodes([{ ...box, name: 'Filler' }])).toEqual({});
  });
});

describe('sigil nodes', () => {
  const sigil = {
    name: 'BIG_MUSCLE', unlockBonus: 10, boostBonus: 20, jadeBonus: 40, etherealBonus: 100, eclecticBonus: 200,
    effect: 'Boosts_base_STR_by_+{'
  };

  it('title-cases the name and boxes the bonus and Sigil EXP of every tier', () => {
    const tier = (label, value, cost) => ({ label, value, cost: { value: cost, currency: 'Sigil EXP' } });
    const costs = { unlockCost: 2, boostCost: 100, jadeCost: 50000, etherealCost: 250000, eclecticCost: 1e7 };
    expect(sigilNodes([{ ...sigil, ...costs }])['sigil:aSiga0']).toMatchObject({
      name: 'Big_Muscle',
      category: 'World 2',
      description: 'Boosts_base_STR_by_+10.',
      fieldsLabel: 'Bonus by tier',
      fields: [tier('Unlocked', '+10', 2), tier('Boosted', '+20', 100), tier('Jade', '+40', 50000), tier('Ethereal', '+100', 250000), tier('Eclectic', '+200', 1e7)]
    });
  });

  it('writes a tier bonus with the sign and unit of its effect, and no second value without a cost', () => {
    const [node] = Object.values(sigilNodes([{ ...sigil, effect: 'Decreases_cost_by_-{%' }]));
    expect(node.fields).toEqual(['Unlocked', 'Boosted', 'Jade', 'Ethereal', 'Eclectic']
      .map((label, i) => ({ label, value: ['-10%', '-20%', '-40%', '-100%', '-200%'][i] })));
  });

  it('keeps VIP in capitals', () => {
    expect(sigilNodes([{ ...sigil, name: 'VIP_PARCHMENT' }])['sigil:aSiga0'].name).toBe('VIP_Parchment');
  });
});

describe('arcade nodes', () => {
  // The old sentence printed +0.59% at level 1 and +30% at level 100 (max).
  it('names an upgrade for what it boosts and fills it at any level up to the max', () => {
    const node = arcadeNodes([{ effect: '+{%_Total_Accuracy', x1: 60, x2: 100, func: 'decay' }], data)['arcade:PachiShopICON0'];
    expect([node.name, node.effect.cap, levelledText(node, 1), levelledText(node, 100)])
      .toEqual(['Total_Accuracy', data.wikiTables.arcadeMaxLevel, '+0.59% Total Accuracy', '+30% Total Accuracy']);
  });

  it('leaves the level field uncapped without the arcadeMaxLevel table', () => {
    const node = arcadeNodes([{ effect: '+{_Base_Damage', x1: 1, x2: 0, func: 'add' }], {})['arcade:PachiShopICON0'];
    expect([node.effect.cap, levelledText(node, 3)]).toEqual([null, '+3 Base Damage']);
  });

  it('numbers the second upgrade that boosts the same thing', () => {
    const upgrade = { effect: '+{%_Cash_from_Mobs', x1: 20, x2: 100, func: 'decay' };
    const names = Object.values(arcadeNodes([upgrade, upgrade], data)).map((node) => node.name);
    expect(names).toEqual(['Cash_from_Mobs', 'Cash_from_Mobs_2']);
  });

  it('drops an upgrade whose curve it cannot evaluate', () => {
    expect(arcadeNodes([{ effect: '+{_X', x1: 1, x2: 1, func: 'mystery' }], data)).toEqual({});
  });
});

describe('real data', () => {
  const root = path.join(process.cwd(), 'data', 'website-data');
  const read = (name) => JSON.parse(fs.readFileSync(path.join(root, name), 'utf-8'));
  const shared = read('shared-data.json');
  const publicFile = (icon) => path.join(process.cwd(), 'public', icon);

  const built = {
    starsign: starSignNodes(shared.starSigns),
    constellation: constellationNodes(shared.constellations),
    postbox: postBoxNodes(shared.postOffice),
    sigil: sigilNodes(shared.sigils),
    arcade: arcadeNodes(shared.arcadeShop, data)
  };

  it('builds every entry of each catalog that has a name', () => {
    expect(Object.keys(built.constellation)).toHaveLength(shared.constellations.length);
    expect(Object.keys(built.postbox)).toHaveLength(shared.postOffice.length);
    expect(Object.keys(built.sigil)).toHaveLength(shared.sigils.length);
    expect(Object.keys(built.arcade)).toHaveLength(shared.arcadeShop.length);
    // 94 rows, 14 of which are filler or the unreachable sign.
    expect(Object.keys(built.starsign)).toHaveLength(80);
  });

  // One suite for the catalogs-a and catalogs-b builders alike. Star signs band by constellation
  // group rather than by world, and the four Plant_evo superbits share a name, so those two skip
  // the one check that does not apply to them.
  const everyCatalog = {
    ...built,
    god: godNodes(shared.gods, data),
    artifact: artifactNodes(read('artifacts.json'), shared.islands, data),
    superbit: superbitNodes(shared.superbitsUpgrades),
    equinox: equinoxNodes(shared.equinoxUpgrades),
    jade: jadeNodes(shared.jadeUpgrades)
  };
  const bandedByWorld = (kind) => kind !== 'starsign';
  const namesUnique = (kind) => kind !== 'superbit';

  it.each(Object.keys(everyCatalog))('builds clean %s nodes from the real data', (kind) => {
    const entries = Object.entries(everyCatalog[kind]);
    for (const [id, node] of entries) {
      expect(id).toBe(`${kind}:${node.rawName}`);
      expect(node.kind).toBe(kind);
      expect(node.name).toBeTruthy();
      if (bandedByWorld(kind)) expect(node.category).toMatch(/^World \d$/);
    }
    const nodes = entries.map(([, node]) => node);
    // A superbit draws no art of its own: its cost line carries the Bits sprite.
    expect(nodes.filter((node) => node.icon !== null && !fs.existsSync(publicFile(node.icon))).map((node) => node.icon)).toEqual([]);
    // No placeholder, in-font glyph, unfilled value, stray double full stop or empty description. A levelled page's
    // description is a template, so it is read the way the page reads it, at its first level.
    const text = (node) => (node.effect ? levelledText(node, firstLevel(node)) : node.description);
    const bad = nodes
      .filter((node) => !text(node)
        || /[{}$@#船般航舞製]|NaN|undefined/.test(text(node))
        || /\.\./.test(text(node).replace(/\.\.\./g, '')))
      .map((node) => `${node.rawName} ${text(node)}`);
    expect(bad).toEqual([]);
    if (namesUnique(kind)) {
      const names = nodes.map((node) => node.name);
      expect(new Set(names).size).toBe(names.length);
    }
  });

  // Pins against what the old sentences printed for the same entries.
  it('keeps the numbers the old sentences printed', () => {
    const duster = Object.values(built.sigil).find((node) => node.name === 'Duster_Studs');
    const box = Object.values(built.postbox).find((node) => node.name === 'Civil_War_Memory_Box');
    expect([duster.fields.map(({ value }) => value), levelledLines(box, 400).map(({ text }) => text)]).toEqual([
      ['+3', '+7', '+15', '+25', '+40'],
      ['+400 Base Damage', '+8.48% Fight AFK Gains', '+6% Critical Chance']
    ]);
  });

  it('sits every constellation on a map that has a page', () => {
    const real = (index) => {
      const name = shared.mapNames[index];
      return Boolean(name) && !['z', 'unused', 'playerselect'].includes(String(name).toLowerCase());
    };
    const edges = constellationEdges(shared.constellations);
    expect(edges).toHaveLength(shared.constellations.length);
    expect(edges.filter((edge) => !real(edge.to.slice(4))).map((edge) => edge.to)).toEqual([]);
  });
});
