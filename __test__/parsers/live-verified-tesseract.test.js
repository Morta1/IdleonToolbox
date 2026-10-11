import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { within } from '../helpers/live-verified';
import { getTalentBonus } from '@parsers/talents';
import { getDoubleGoldenFoodDrop, getDoubleStatueDrop } from '@parsers/misc';
import {
  getArcanistStats,
  getMaps,
  getTesseract,
  getTesseractBonus,
  getTesseractTotalUpgradeCost
} from '@parsers/class-specific/tesseract';

// Read from the running game on 2026-10-11 through the debug server, logged in as IAmTheHunterrr (Wind Walker).
// latest.json is that account's save (OptionsListAccount[340] matches). Caches were rebuilt first
// (calcEtcBonuses, TalentCalc(-2), OverkillQTY(-1)). A daily reset ran between the export and the
// reading: it raised OptionsListAccount[499] (First3MC_CostRedux) from 88.92 to 101.64, so the cost
// checks swap the live value in.
const GAME = {
  // ArcaneType("DoubleItemDropz", 0 | 1)
  doubleStatueDrop: 86.07142857142857,
  doubleGoldenFoodDrop: 93.29573121246551,
  // ArcaneType("ArcaneUpgBonus", i): the flat list (3, 7, 13, 39, 58) and the rest, scaled by upgrade 39
  bonus: {
    0: 1494,
    3: 1,
    5: 5190,
    7: 100,
    13: 100,
    17: 1083,
    39: 50,
    50: 12375,
    58: 10,
    59: 1.5
  },
  // ArcaneType("ArcaneUpgCost", i) of upgrades below their max
  cost: {
    0: 4.735768411611025e+36,
    17: 4.930836400883356e+33,
    49: 3.895832536809781e+55,
    56: 1.773987388993878e+57
  },
  // ArcaneType("Arcane_*") for the logged-in Wind Walker
  stats: {
    damage: 14943910.438254593,
    accuracy: 718103245.0833681,
    defence: 508436244.2406872,
    mastery: 0.25,
    critPct: 75,
    critDamage: 3.315,
    attackSpeed: 861
  },
  // ArcaneType("ArcaneMapMulti", MapBon[map][0..2]), all under the ArcaneMapMulti_bonMAX cap of 57.03
  mapMultis: {
    151: [3.5980997201724314, 0.43, 3.531477850614211],
    201: [2, 0, 9.618890772975682],
    212: [10.636753984890511, 0, 0],
    251: [6.3283362245201955, 4.421704039282414, 0]
  },
  costRedux499: 101.64
};

// ArcaneType("KillsReq") and ("TimeLeft") read CurrentMap, so they can't be swept live; these are the game's own
// tables (N.js), applied to each world's maps
const GAME_KILLS_REQ = (map) => 25 > map ? 5 : 159 === map ? 30 : 151 === map ? 45
  : Number('10 20 40 70 80 100 250 250'.split(' ')[Math.floor(map / 50)]);
const GAME_TIME_LEFT = (map) => Number('360 270 230 210 200 190 180 180'.split(' ')[Math.floor(map / 50)]);
// ArcaneType("WepDropChance" / "RingDropChance")
const GAME_WEAPON_DROP = (options) => 1 / (300 * (1 + options[396] / 100));
const GAME_RING_DROP = (options) => 1 / (500 * (1 + options[397] / 100));

const { account, characters } = parseFixture(latest);
const windWalker = characters.find(({ name }) => name === 'IAmTheHunterrr');
const liveCostAccount = {
  ...account,
  accountOptions: account.accountOptions.map((value, index) => index === 499 ? GAME.costRedux499 : value)
};
const upgradeAt = (index) => account.tesseract.upgrades.find((upgrade) => upgrade.index === index);
const maps = getMaps(account, characters, windWalker);

describe('tesseract verified against the live game', () => {
  it('double statue and golden food drop chance', () => {
    within(getDoubleStatueDrop(account, windWalker, characters).value, GAME.doubleStatueDrop);
    within(getDoubleGoldenFoodDrop(account).value, GAME.doubleGoldenFoodDrop);
  });

  it('crystal charge requirement uses BACKUP_ENERGY\'s y bonus (the charge half)', () => {
    const arcane = characters.find((c) => c.class === 'Arcane_Cultist');
    const y = getTalentBonus(arcane.flatTalents, 'BACKUP_ENERGY', true);
    expect(y).toBeGreaterThan(2);
    // the game's charge requirement expression
    expect(account.tesseract.crystalChargeReq).toBe(Math.ceil(Math.max(50, 200 - (100 + Math.min(10, y)))));
  });

  it.each(Object.entries(GAME.bonus))('upgrade %s bonus', (index, value) => {
    within(getTesseractBonus(account, Number(index)), value);
  });

  it.each(Object.entries(GAME.cost))('upgrade %s next level cost', (index, value) => {
    const upgrade = upgradeAt(Number(index));
    within(getTesseractTotalUpgradeCost(liveCostAccount, upgrade, upgrade.level + 1), value);
  });

  it.each(Object.entries(GAME.stats))('arcanist %s', (stat, value) => {
    within(getArcanistStats(account.tesseract.upgrades, account.tesseract.totalUpgradeLevels, windWalker, account)[stat], value);
  });

  it.each(Object.entries(GAME.mapMultis))('map %s DR / EXP / AFK multis', (mapIndex, values) => {
    const map = maps.find((entry) => Number(entry.mapIndex) === Number(mapIndex));
    map.mapBonuses.forEach(({ value }, index) => within(value, values[index]));
  });

  it('charge kills and time left follow the game\'s per-world tables and map overrides', () => {
    expect(maps.map(({ mapIndex, reqKills, timeLeft }) => [Number(mapIndex), reqKills, timeLeft]))
      .toEqual(maps.map(({ mapIndex }) => [Number(mapIndex), GAME_KILLS_REQ(Number(mapIndex)), GAME_TIME_LEFT(Number(mapIndex))]));
  });

  it('wand and ring drop chances slow by +1% per drop counter, not x1.2', () => {
    const options = account.accountOptions.map((value, index) => index === 396 ? 50 : index === 397 ? 120 : value);
    const tesseract = getTesseract(latest.data, characters, { ...account, accountOptions: options });
    within(tesseract.weaponDropChance, GAME_WEAPON_DROP(options));
    within(tesseract.ringDropChance, GAME_RING_DROP(options));
  });
});
