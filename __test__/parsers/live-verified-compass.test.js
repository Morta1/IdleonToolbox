import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { within } from '../helpers/live-verified';
import { getCompassBonus, getCompassStats, getCompassTotalUpgradeCost } from '@parsers/class-specific/compass';

// Read from the running game on 2026-10-11 through the debug server, logged in as IAmTheHunterrr (Wind Walker).
// latest.json is that account's save (Compass levels and OptionsListAccount[340] match). A daily reset ran
// between the export and the reading: it adds Grid_Bonus(150) to OptionsListAccount[499] (88.92 -> 101.64),
// which only First3MC_CostRedux reads, so the cost checks swap the live value in.
const GAME = {
  // Windwalker("CompassBonus", i): plain, circle (x CompassBonus 39 + 80) and index 45 (x2 per 50 levels)
  bonus: {
    9: 1080,
    37: 3,
    41: 837,
    45: 3264,
    51: 30060,
    57: 42,
    107: 2304.63,
    164: 29558.250000000004
  },
  // Windwalker("CompassUpgCost", i) of upgrades below their max: the WWzCostRed groups (45/48/51/54/57) and plain ones
  cost: {
    9: 8362531376,
    36: 1.894825927e+40,
    45: 15141687.72,
    48: 3.336509051e+29,
    51: 8.928507398e+37,
    54: 3.378480511e+21,
    57: 1.001342969e+37,
    107: 5.821261068e+39,
    172: 386.5832782
  },
  // Windwalker("Compass_*") / ("TempestMultishotPCT") for the logged-in Wind Walker
  stats: {
    hp: 88996.99200000001,
    damage: 9189630825731.271,
    accuracy: 252112269289.92358,
    defence: 214237433.43290138,
    mastery: 0.7,
    critPct: 156.69892473118279,
    critDamage: 24.562200000000004,
    attackSpeed: 396,
    invulnerableTime: 9.1,
    range: 813,
    multiShotPct: 800
  },
  // the panel shows Math.floor(100 + Windwalker("Compass_MoveSpeed")) + "%"
  moveSpeedRaw: 1538.3000000000002,
  // Windwalker("StampDoublersLeft"), Windwalker("CompassUpgTotal")
  remainingExaltedStamps: 1,
  totalUpgradeLevels: 32343,
  costRedux499: 101.64
};
// the costs were read rounded to 10 significant digits
const COST_TOLERANCE = 1e-8;

const { account, characters } = parseFixture(latest);
const windWalker = characters.find(({ name }) => name === 'IAmTheHunterrr');
const liveCostAccount = {
  ...account,
  accountOptions: account.accountOptions.map((value, index) => index === 499 ? GAME.costRedux499 : value)
};
const upgradeAt = (index) => account.compass.upgrades.find((upgrade) => upgrade.index === index);

describe('compass verified against the live game', () => {
  it.each(Object.entries(GAME.bonus))('upgrade %s bonus', (index, value) => {
    within(getCompassBonus(account, Number(index)), value);
  });

  it.each(Object.entries(GAME.cost))('upgrade %s next level cost', (index, value) => {
    const upgrade = upgradeAt(Number(index));
    within(getCompassTotalUpgradeCost(liveCostAccount, upgrade, upgrade.level + 1), value, COST_TOLERANCE);
  });

  it.each(Object.entries(GAME.stats))('tempest %s', (stat, value) => {
    within(getCompassStats(windWalker, account)[stat], value);
  });

  it('move speed is the panel value, floor(100 + Compass_MoveSpeed)', () => {
    expect(getCompassStats(windWalker, account).moveSpeed).toBe(Math.floor(100 + GAME.moveSpeedRaw));
  });

  it('exalted stamps left and total upgrade levels', () => {
    expect(account.compass.remainingExaltedStamps).toBe(GAME.remainingExaltedStamps);
    expect(account.compass.totalUpgradeLevels).toBe(GAME.totalUpgradeLevels);
  });
});
