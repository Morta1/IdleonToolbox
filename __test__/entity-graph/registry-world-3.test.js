import path from 'path';
import { describe, expect, it } from 'vitest';
import { loadWebsiteData } from '../../scripts/entity-graph/registry/data.mjs';
import { registryNodes } from '../../scripts/entity-graph/registry/build.mjs';
import world3 from '../../scripts/entity-graph/registry/world-3/index.mjs';
import { costAt, costToMax, levelledText } from '../../utility/wiki/effects.mjs';
import { totemPrayerEdges } from '../../scripts/entity-graph/edges/totem-prayers.mjs';
import { armorSetEdges } from '../../scripts/entity-graph/edges/armor-sets.mjs';

const data = loadWebsiteData(path.join(process.cwd(), 'data', 'website-data'));
const nodes = registryNodes(data, world3);
const ofKind = (kind) => Object.values(nodes).filter((node) => node.kind === kind);
// The whole field, links included, of the page with this id.
const fieldAt = (id, label) => nodes[id].fields.find((field) => field.label === label);

describe('atoms', () => {
  const byName = (name) => ofKind('atom').find((node) => node.name === name);

  it('build one page per atom', () => {
    expect(ofKind('atom')).toHaveLength(data.atomsInfo.length);
  });

  // Oracles: N.js AtomInfo desc fill, `{` = baseBonus * level and `<` = level.
  it.each([
    ['Nitrogen_-_Construction_Trimmer', 10, '+150%'],
    ['Oxygen_-_Library_Booker', 7, '+14%'],
    ['Oxygen_-_Library_Booker', 7, 'is increased by +7,']
  ])('%s at level %s reads %s', (name, level, expected) => {
    expect(levelledText(byName(name), level)).toContain(expected);
  });

  // Oracle: N.js AtomCost with no save (discount 1), floored below a million.
  it('price Hydrogen at 2 for level 1 and 163 for level 10', () => {
    expect([1, 10].map((level) => costAt(byName('Hydrogen_-_Stamp_Decreaser'), level))).toEqual([2, 163]);
  });

  it('price in Particles', () => {
    expect(byName('Hydrogen_-_Stamp_Decreaser').cost.currency).toBe('Particles');
  });

  // The real cap is 20 plus unlocks (atomCollider.ts), so the calculator must not stop at the base.
  it('leave the level uncapped and state the base max level on every atom', () => {
    const base = data.atomsInfo.map(() => ({
      label: 'Base max level',
      value: expect.stringMatching(/^20 \(raised by .*Isotope Discovery.*Atomic Potential.*Higgs Boson/),
      links: ['superbit:Superbit23', 'compassupgrade:CompassUpg53'],
      linkAs: 'maxRaisedBy'
    }));
    expect(ofKind('atom').map((node) => node.effect.cap)).toEqual(data.atomsInfo.map(() => null));
    expect(ofKind('atom').map((node) => node.fields)).toEqual(base.map((field) => [field]));
    expect(costToMax(byName('Hydrogen_-_Stamp_Decreaser'))).toBeNull();
  });

  it('label the level the way the collider does', () => {
    expect(ofKind('atom').map((node) => node.effect.levelLabel)).toEqual(ofKind('atom').map(() => 'Atom level'));
  });

  it('drop the live readout tail from Carbon and Fluoride', () => {
    expect(ofKind('atom').filter((node) => /total.bonus/i.test(levelledText(node, 1)))).toEqual([]);
  });
});

describe('equinox dreams', () => {
  const dreams = ofKind('dream');
  const spaced = (text) => String(text).replace(/_/g, ' ');

  it('build one page per challenge', () => {
    expect(dreams).toHaveLength(data.equinoxChallenges.length);
  });

  // Oracle: N.js titles each challenge "Dream_#" + (CloudsTask + 1), where CloudsTask is its table position.
  it('name each one Dream #N in table order', () => {
    expect(dreams.map((node) => spaced(node.name))).toEqual(data.equinoxChallenges.map((_, index) => `Dream #${index + 1}`));
  });

  it('show the reward and the target of the first challenge as the data has them', () => {
    const [first] = data.equinoxChallenges;
    expect(dreams[0].fields).toEqual([
      { label: 'Reward', value: spaced(first.reward) },
      { label: 'Target', value: first.goal }
    ]);
  });

  it('leave the target off the yes/no tasks', () => {
    const yesNo = data.equinoxChallenges.findIndex((entry) => entry.goal === 1);
    expect(dreams[yesNo].fields.map((field) => field.label)).toEqual(['Reward']);
  });

  // Oracle: equinox.ts marks challenge i locked when i >= 36 and Research Grid square 86 is below level 1.
  it('name the Research Grid square that unlocks dream #37 onward, and no earlier one', () => {
    const unlock = { label: 'Unlocked by', value: `${spaced(data.researchGridSquares[86].name)} (Research Grid)`, links: ['researchsquare:ResGrid86'], linkAs: 'unlockedBy' };
    expect(dreams.map((node) => node.fields.filter(({ label }) => label === 'Unlocked by'))).toEqual(
      data.equinoxChallenges.map((_, index) => (index >= 36 ? [unlock] : []))
    );
  });

  // The reward quotes an Equinox upgrade by name only; a reward that quotes none links nothing.
  it('link a reward that raises a named Equinox upgrade, and no other', () => {
    expect(fieldAt('dream:Dream7', 'Reward')).toEqual({
      label: 'Reward',
      value: "+3 Max LV for Equinox Upgrade 'Liquidvestment'",
      links: ['equinox:Dream_Upgrade_4'],
      linkAs: 'raisesMaxOf'
    });
    expect(fieldAt('dream:Dream1', 'Reward').links).toBeUndefined();
  });

  it('finish every sentence and keep the task wording', () => {
    expect(dreams.map((node) => spaced(node.description))).toEqual(
      data.equinoxChallenges.map((entry) => spaced(/[.!?]$/.test(entry.label) ? entry.label : `${entry.label}.`))
    );
  });
});

describe('worship totems', () => {
  const totems = ofKind('totem');
  const spaced = (text) => String(text).replace(/_/g, ' ');
  // The game names only the first five (randomList[10]); the rest are the names the Worship page shows.
  const APP_NAMES = ['Citric Conflict', 'Breezy Battle', 'Pufferblob Brawl'];
  const gameNamed = data.totems.length - APP_NAMES.length;
  const expectedNames = data.totems.map((_, index) => (index < gameNamed ? spaced(data.randomList[10][index]) : APP_NAMES[index - gameNamed]));

  it('lead the description with the map, not the kind the page is already filed under', () => {
    expect(totems.map((node) => spaced(node.description))).toEqual(
      data.totems.map((entry, index) => `Stands on ${spaced(data.mapNames[[26, 63, 30, 107, 155, 208, 259, 308][index]])}. Its waves send ${spaced(entry.monsterName)}.`)
    );
  });

  it('build one page per totem, named as the game and the app name them', () => {
    expect(totems.map((node) => spaced(node.name))).toEqual(expectedNames);
  });

  // Oracle: worship.ts TOTEM_EXP_BASE * (i + 1)^2, the neutral part of WorshipStuff("ExpRewards").
  it('state the level, charge, efficiency and base EXP of each totem', () => {
    expect(totems.map((node) => node.fields.filter(({ label }) => label !== 'Map'))).toEqual(data.totems.map((entry, index) => [
      { label: 'Worship level needed', value: entry.skillReq },
      { label: 'Charge to summon', value: entry.chargeReq },
      { label: 'Worship efficiency for bonus souls', value: entry.minEfficiency },
      { label: 'Worship EXP per wave (before multipliers)', value: 15 * (index + 1) ** 2 }
    ]));
  });

  it('link each totem to the map it stands on', () => {
    expect(fieldAt('totem:Totem0', 'Map')).toEqual({ label: 'Map', value: spaced(data.mapNames[26]), links: ['map:26'], linkAs: 'locatedIn' });
    expect(totems.map((node) => node.fields.find(({ label }) => label === 'Map').links)).toEqual(
      [26, 63, 30, 107, 155, 208, 259, 308].map((id) => [`map:${id}`])
    );
  });

  it('name the map each totem stands on, spaced', () => {
    expect(totems.map((node) => node.fields.find(({ label }) => label === 'Map').value)).toEqual(
      [26, 63, 30, 107, 155, 208, 259, 308].map((id) => spaced(data.mapNames[id]))
    );
  });
});

describe('totem prayer unlocks', () => {
  const edges = totemPrayerEdges(nodes, data.prayers);
  const unlockable = data.prayers.filter((prayer) => prayer.unlockWave !== 999);

  it('link every unlockable prayer to exactly the totem its zone names, with the wave', () => {
    const totemOf = (zone) => ofKind('totem').find((node) => node.name === zone.replace(/ /g, '_')).rawName;
    expect(edges.length).toBeGreaterThan(0);
    expect(edges).toEqual(unlockable.map((prayer) => ({
      from: `totem:${totemOf(prayer.unlockZone)}`,
      to: `prayer:Prayer${prayer.prayerIndex}`,
      rel: 'unlocks',
      meta: { wave: prayer.unlockWave },
      source: 'totems'
    })));
  });
});

describe('armor sets', () => {
  const sets = ofKind('armorset');
  const spaced = (text) => String(text).replace(/_/g, ' ');
  const titled = (text) => text.split('_').map((word) => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');

  it('build one page per set', () => {
    expect(sets.map((node) => spaced(node.name))).toEqual(data.equipmentSets.map((set) => titled(set.setName)));
  });

  // Oracle: N.js set tooltip, `{` = bonusValue, `}` = NotateNumber(1 + bonusValue / 100) with two decimals, `|` = line split.
  it('read as finished sentences with the bonus filled in', () => {
    const expected = data.equipmentSets.map((set) => spaced(set.description)
      .replace(/\|/g, ' ')
      .replace('{', String(set.bonusValue))
      .replace('}', (1 + set.bonusValue / 100).toFixed(2)));
    expect(sets.map((node) => spaced(node.description))).toEqual(expected);
  });

  it.each([
    ['COPPER_SET', '+60% Mining and Chopping Efficiency'],
    ['GOLD_SET', '1.50x Coins Dropped by Monsters'],
    ['TROLL_SET', '1.25x Higher Bonuses from Tome'],
    ['KATTLEKRUK_SET', '+5 LV for all Talents'],
    ['EMPEROR_SET', 'Ribbons and Exalted Stamps give 1.20x more multi']
  ])('%s reads %s', (setName, text) => {
    expect(spaced(sets.find((node) => node.rawName === setName).description)).toBe(text);
  });

  // Oracle: armorSmithy.ts PartsReq = armors + requiredTools + requiredWeapon.
  it('state how many pieces to wear and which pools count', () => {
    expect(sets.map((node) => node.fields)).toEqual(data.equipmentSets.map((set) => [
      { label: 'Pieces to wear', value: set.armors.length + set.requiredTools + set.requiredWeapon },
      { label: 'Armor pieces', value: set.armors.length },
      ...(set.requiredTools > 0 ? [{ label: 'Tools', value: `any ${set.requiredTools} of ${set.tools.length}` }] : []),
      ...(set.requiredWeapon > 0 ? [{ label: 'Weapon', value: `any 1 of ${set.weapons.length}` }] : [])
    ]));
  });

  // Oracle: GetSetBonus PartsOn counts the armour, plus tools and one weapon only when the set requires them.
  it('link every counted piece of every set, and only items that exist', () => {
    const itemIds = new Set(Object.keys(data.items).map((rawName) => `item:${rawName}`));
    const counted = (set) => [
      ...set.armors.map((rawName) => [rawName, 'armor']),
      ...(set.requiredTools > 0 ? set.tools.map((rawName) => [rawName, 'tool']) : []),
      ...(set.requiredWeapon > 0 ? set.weapons.map((rawName) => [rawName, 'weapon']) : [])
    ];
    const edges = armorSetEdges(data.equipmentSets);
    expect(edges.length).toBeGreaterThan(0);
    expect(edges).toEqual(data.equipmentSets.flatMap((set) => counted(set).map(([rawName, slot]) => ({
      from: `armorset:${set.setName}`, to: `item:${rawName}`, rel: 'setPiece', meta: { slot }, source: 'armor-sets'
    }))));
    expect(edges.filter((edge) => !itemIds.has(edge.to))).toEqual([]);
  });
});
