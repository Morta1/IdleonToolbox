import path from 'path';
import { describe, expect, it } from 'vitest';
import { loadWebsiteData } from '../../scripts/entity-graph/registry/data.mjs';
import { registryNodes } from '../../scripts/entity-graph/registry/build.mjs';
import world3 from '../../scripts/entity-graph/registry/world-3/index.mjs';
import { costAt, costToMax, levelledText } from '../../utility/wiki/effects.mjs';
import { totemPrayerEdges } from '../../scripts/entity-graph/edges/totem-prayers.mjs';

const data = loadWebsiteData(path.join(process.cwd(), 'data', 'website-data'));
const nodes = registryNodes(data, world3);
const ofKind = (kind) => Object.values(nodes).filter((node) => node.kind === kind);

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
    const base = data.atomsInfo.map(() => ({ label: 'Base max level', value: expect.stringMatching(/^20 \(raised by .*Isotope Discovery.*Atomic Potential.*Higgs Boson/) }));
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
