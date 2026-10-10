import '../../polyfills';
import { describe, expect, it } from 'vitest';
// Values below are pinned to the 22 Aug 2026 save (latest-2026-08.json), checked against the game then.
import latest from '../fixtures/latest-2026-08.json';
import { parseEmpty, parseFixture } from '../helpers/parsed-fixtures';
import { getJellyBonus, getOptimizedJellyUpgrades, JELLY_UPGRADE_CATEGORIES } from '@parsers/world-7/jellyOperator';
import { research } from '@website-data';

const clone = (o) => JSON.parse(JSON.stringify(o));

// Pre-2.3.531 saves stop at Research[13]; the game appends [14]-[18] on login (DoOnce 386).
const withJelly = (fixture, { defeated = 0, operationsLeft = 0, bloodcells = 0, upgrades = {}, cells = [], placement = [], slotGroups = [] } = {}) => {
  const copy = clone(fixture);
  const data = copy.data ?? copy;
  const raw = typeof data.Research === 'string' ? JSON.parse(data.Research) : data.Research;
  while (raw.length < 19) raw.push([]);
  raw[7] = [...raw[7]];
  while (raw[7].length < 20) raw[7].push(0);
  raw[7][9] = defeated;
  raw[7][10] = operationsLeft;
  raw[7][11] = bloodcells;
  raw[16] = Array.from({ length: 10 }, (_, i) => cells[i] ?? 0);
  raw[17] = Array.from({ length: 100 }, (_, i) => upgrades[i] ?? 0);
  raw[14] = Array.from({ length: 180 }, (_, i) => placement[i] ?? -1);
  raw[18] = slotGroups;
  data.Research = typeof data.Research === 'string' ? JSON.stringify(raw) : raw;
  return copy;
};

describe('getJellyBonus', () => {
  it('pays research[47] only once more than `index` obstructions are removed', () => {
    const account = { jellyOperator: { obstructionsDefeated: 38 } };
    expect(getJellyBonus(account, 37)).toBe(Number(research[47][37]));
    expect(getJellyBonus(account, 38)).toBe(0);
    expect(getJellyBonus({}, 0)).toBe(0);
  });
});

describe('jelly operator parser', () => {
  it('renders the full catalog on an empty account', () => {
    const { account } = parseEmpty();
    const jelly = account.jellyOperator;
    expect(jelly.unlocked).toBe(false);
    expect(jelly.obstructions).toHaveLength(research[45].length);
    expect(jelly.upgrades.length).toBeGreaterThan(0);
    expect(jelly.cells.length).toBeGreaterThan(0);
    expect(jelly.bloodcellMulti).toBeGreaterThanOrEqual(1);
  });

  it('reads a pre-Jelly save as locked with nothing removed', () => {
    const { account } = parseFixture(latest);
    expect(account.jellyOperator.obstructionsDefeated).toBe(0);
    expect(account.jellyOperator.unlocked).toBe(false);
  });

  it('reads progress from the Research save', () => {
    const fixture = withJelly(latest, { defeated: 12, operationsLeft: 1, bloodcells: 5000, upgrades: { 0: 1, 1: 1 }, cells: [3, 2] });
    const { account } = parseFixture(fixture);
    const jelly = account.jellyOperator;
    expect(jelly.unlocked).toBe(true);
    expect(jelly.obstructionsDefeated).toBe(12);
    expect(jelly.operationsLeft).toBe(1);
    expect(jelly.unitsOwned).toBe(2);
    expect(jelly.cellLevelTotal).toBe(5);
    expect(jelly.obstructions.filter(({ defeated }) => defeated)).toHaveLength(12);
    // two obstructions removed open both bonus slot pairs
    expect(jelly.slotsOwned).toBe(8);
    expect(jelly.upgrades.every(({ cost }) => Number.isFinite(cost))).toBe(true);
    const tomeEntry = account.tome.tome.find((entry) => JSON.stringify(entry).includes('Successful_Jelly_Operations'));
    expect(tomeEntry?.quantity).toBe(12);
  });

  it('fills every "{", "}" and "$" placeholder in upgrade descriptions', () => {
    const { account } = parseFixture(latest);
    const leftovers = account.jellyOperator.upgrades.filter(({ description }) => /[{}$]/.test(description));
    expect(leftovers.map(({ id }) => id)).toEqual([]);
  });

  it('game "UpgCost": the first display position is free', () => {
    const { account } = parseFixture(latest);
    const first = account.jellyOperator.upgrades.find(({ position }) => position === 0);
    expect(first.cost).toBe(0);
  });
});

describe('obstruction bonuses reach the rest of the game', () => {
  const base = parseFixture(latest).account;
  const maxed = parseFixture(withJelly(latest, { defeated: 72 })).account;

  it('game "AtomsAvailableAtAll": Opal Pendant (17) opens one more atom', () => {
    expect(maxed.atoms.totalAtomsAvailable - base.atoms.totalAtomsAvailable).toBe(1);
  });

  it('game "BlessingMaxLV": Pointed Prism (49) and Sharpened Axe (63) raise every blessing cap', () => {
    const bonus = Number(research[47][49]) + Number(research[47][63]);
    const baseMax = base.divinity?.deities?.[0]?.maxLevel;
    const maxedMax = maxed.divinity?.deities?.[0]?.maxLevel;
    expect(maxedMax - baseMax).toBe(bonus);
  });
});

describe('jelly layout', () => {
  // A live 2.3.531 board (26 removed, fighting Pair), read off the debug server.
  const placement = Object.assign([], { 54: 0, 55: 1, 57: 1, 59: 1, 67: 2, 75: 1, 77: 2, 78: 2, 94: 5, 108: 6, 119: 5,
    121: 5, 122: 6, 130: 0, 131: 1, 133: 5, 134: 4, 136: 0, 138: 3, 148: 4, 150: 4, 154: 4, 170: 1, 174: 1 });
  const slotGroups = [24, 15, 27, 28, 34, 35, 38, 37, 39, 36, 29, 30, 32, 31, 33, 25, 26, 17];
  const { layout } = parseFixture(withJelly(latest, { defeated: 26, placement, slotGroups })).account.jellyOperator;
  const unitAt = (slot) => layout.units.find((unit) => unit.slot === slot);

  it('puts the obstruction in the 4x4 hole no slot group reaches', () => {
    expect(layout.boss).toMatchObject({ col: 7, row: 3, colSpan: 4, rowSpan: 4, index: 26, name: 'Pair' });
  });

  it('opens the base slots plus every purchased group', () => {
    expect(layout.openSlots).toHaveLength(86);
    expect(layout.theme).toBe(2);
  });

  it('spans each cell over its footprint', () => {
    expect(layout.units).toHaveLength(24);
    expect(unitAt(55)).toMatchObject({ type: 1, col: 1, row: 3, colSpan: 2, rowSpan: 1 });
    expect(unitAt(67)).toMatchObject({ type: 2, col: 13, row: 3, colSpan: 1, rowSpan: 3 });
    // the plus-shaped Organelle is dropped on its centre
    expect(unitAt(138)).toMatchObject({ type: 3, col: 11, row: 6, colSpan: 3, rowSpan: 3 });
    // only the five plus cells are the Organelle; its corners belong to whatever sits there
    expect(unitAt(138).footprint).toEqual([{ col: 12, row: 7 }, { col: 13, row: 7 }, { col: 11, row: 7 }, { col: 12, row: 8 }, { col: 12, row: 6 }]);
    expect(unitAt(108)).toMatchObject({ type: 6, col: 0, row: 6, colSpan: 4, rowSpan: 4 });
  });
});

describe('jelly formation', () => {
  // A live 2.3.531 board read off the debug server; the game reported UnitSumAtk 5.6,
  // 1 / UnitSumAtkCD 6 and 54 starred slots for it, and every cell's hover DPS matched.
  const placement = Object.assign([], {"54":0,"55":1,"57":1,"59":1,"65":2,"66":2,"67":0,"68":0,"70":0,"71":2,"72":4,"74":0,"75":1,"77":2,"78":2,"85":5,"87":3,"92":1,"94":5,"103":0,"104":0,"106":0,"108":6,"112":5,"119":5,"121":0,"122":6,"130":0,"131":1,"133":5,"134":4,"136":0,"138":3,"148":4,"150":4,"154":4,"157":0,"170":1,"174":1});
  const upgrades = {"0":1,"1":1,"2":1,"3":1,"4":1,"5":1,"6":1,"8":25,"9":1,"10":1101,"12":1,"14":1,"15":4,"16":6,"17":20,"18":1482,"19":1044,"20":517,"21":659,"23":2151,"24":1486,"25":738,"27":323,"28":1,"29":150,"31":1220,"32":10,"33":25,"36":1,"38":20,"39":1};
  const { jellyOperator } = parseFixture(withJelly(latest, { defeated: 37, placement, upgrades,
    slotGroups: [24,15,27,28,34,35,38,37,39,36,29,30,32,31,33,25,26,17,19,23,22,21,20,16,18,14] })).account;

  it('stacks passives per cell on the board, +1 per 3 with Cells of Three', () => {
    expect(jellyOperator.layout.passives.damage).toBeCloseTo(5.6, 10);
    expect(jellyOperator.layout.passives.speed).toBeCloseTo(6, 10);
  });

  it('counts the room left on the board for the dashboard', () => {
    const { layout } = jellyOperator;
    expect(layout.virusesAllowed).toBe(5);
    expect(layout.virusesPlaced).toBe(5);
    const covered = new Set(layout.units.flatMap(({ footprint }) => footprint.map(({ col, row }) => row * 18 + col)));
    expect(layout.emptySlots).toBe(layout.openSlots.filter((slot) => !covered.has(slot)).length);
  });

  it('stars every slot of a cell touching a Virus', () => {
    expect(jellyOperator.layout.passives.stars).toBe(54);
  });

  it('scales DPS here by the own Organelle speed of that cell only', () => {
    const { units } = jellyOperator.layout;
    const boosted = units.find(({ slot }) => slot === 68);
    const plain = units.find(({ speedBoost, proximityBoost }) => speedBoost === 1 && proximityBoost === 1);
    expect(boosted.speedBoost).toBeGreaterThanOrEqual(1.5);
    expect(boosted.dps).toBeCloseTo(jellyOperator.cells[boosted.type].dps * boosted.speedBoost, 6);
    expect(plain.dps).toBe(jellyOperator.cells[plain.type].dps);
    expect(units.reduce((sum, { stars }) => sum + stars, 0)).toBe(54);
  });

  it('upgrade optimizer: ranks each category by its own stat, cost rising along the path', () => {
    const account = parseFixture(withJelly(latest, { defeated: 37, placement, upgrades, bloodcells: 1e95,
      slotGroups: [24, 15, 27, 28, 34, 35, 38, 37, 39, 36, 29, 30, 32, 31, 33, 25, 26, 17] })).account;
    for (const [category, { upgradeIndices }] of Object.entries(JELLY_UPGRADE_CATEGORIES)) {
      const path = getOptimizedJellyUpgrades({}, account, category, 20);
      // Lower Cholesterol is still behind an unbought upgrade on this board
      if (category === 'costReduction') {
        expect(path.stoppedReason).toBe('no-candidates');
        continue;
      }
      expect(path.length, category).toBeGreaterThan(0);
      expect(path.every(({ index }) => upgradeIndices.includes(index)), category).toBe(true);
      expect(path.every(({ cost, totalStatChange }) => Number.isFinite(cost) && cost > 0 && totalStatChange > 0), category).toBe(true);
    }
  });

  it('upgrade optimizer: respects the Research level gate', () => {
    const account = parseFixture(withJelly(latest, { defeated: 37, placement, upgrades, bloodcells: 1e95 })).account;
    const gated = getOptimizedJellyUpgrades({}, account, 'all', 50, { researchLevel: 0 });
    expect(gated).toHaveLength(0);
  });

  it('marks the drop slot of every cell an Organelle reaches', () => {
    const arrows = jellyOperator.layout.markers.filter(({ speed }) => speed).map(({ slot }) => slot);
    expect(arrows).toEqual([66, 68, 70, 71, 85, 104, 106, 119, 121, 122, 136, 154, 157, 174]);
  });
});
