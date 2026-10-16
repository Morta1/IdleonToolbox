import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { within } from '../helpers/live-verified';
import { ninjaExtraInfo } from '@website-data';

// Read from the running game on 2026-10-11 through the debug server, logged in as IAmTheHunterrr (Wind Walker).
// latest.json is that account's save (OptionsListAccount[340] matches). All three lists are indexed by tome
// line (CustomLists.Tome order); the level requirements by display order (NinjaInfo[32]).
const GAME = {
  // DNSM.TomeQTY
  quantities: [
    42168, 10726, 1402, 94489, 282, 13811, 416, 205,
    9.040726648675453e+23, 450189829, 11, 77663, 2, 2.7777777777777776e+74, 1.231372122592987e+28, 9780,
    0.43307916298770094, 42, 1808.2390945921095, 32, 94195, 85, 15106736, 855,
    102, 0, 83341, 1419, 289, 1094, 1000, 814565,
    242083901894.96942, 88293, 556153, 94720, 0, 579, 1036, 38,
    242, 1050, 2579, 1050000000, 253, 59, 1551716095.8220918, 1000,
    15972, 457, 10945, 148, 158, 262293249.3327415, 51, 61,
    20, 7119, 9, 128640, 201, 6650702304928.273, 23, 47,
    160398512.17005688, 1594, 5.716269029547335e+177, 33554432, 288, 25, 9840, 168,
    48, 332, 47, 392, 213, 6355, 61192.4791310244, 333,
    5513, 664, 10116.300000000101, 625, 382, 40, 40, 38,
    33, 0, 792524104150612.5, 13009710.60199616, 42, 158, 1, 40,
    24, 47, 280, 14951, 1874548642501606.2, 44481870181223.805, 8.046068634106136e+32, 29660,
    77, 2160, 0, 26, 12, 55, 23, 28,
    47, 12, 114, 261, 59, 292, 44, 51,
    459, 54
  ],
  // Summoning("TomePTS", t)
  points: [
    1250, 760, 1000, 801, 437, 1633, 416, 656, 395, 158, 350, 1504, 16, 508, 310, 248,
    403, 249, 500, 196, 107, 199, 1750, 534, 425, 0, 375, 131, 53, 116, 0, 273,
    345, 189, 202, 190, 0, 216, 607, 750, 493, 529, 678, 141, 628, 500, 142, 0,
    219, 184, 822, 60, 155, 151, 275, 450, 159, 157, 172, 194, 1000, 156, 130, 282,
    155, 1152, 392, 172, 350, 334, 178, 454, 250, 106, 658, 88, 64, 194, 287, 83,
    973, 664, 469, 721, 378, 302, 302, 202, 93, 0, 360, 202, 176, 214, 4, 160,
    254, 400, 352, 593, 362, 352, 261, 693, 257, 273, 0, 700, 224, 514, 345, 113,
    160, 12, 750, 153, 738, 443, 380, 510, 388, 600
  ],
  // Summoning("TomeLvReq", displayIndex)
  levelRequirements: [
    350, 390, 430, 470, 510, 550, 590, 630, 670, 710, 750, 790, 830, 870, 910, 950,
    990, 1030, 1070, 1110, 1150, 1190, 1230, 1270, 1310, 1350, 1390, 1430, 1470, 1510, 1550, 1590,
    1630, 1670, 1710, 1750, 1795, 1840, 1885, 1930, 1975, 2020, 2065, 2110, 2155, 2200, 2245, 2290,
    2335, 2380, 2425, 2470, 2515, 2560, 2605, 2650, 2695, 2740, 2785, 2830, 2875, 2930, 2985, 3040,
    3095, 3150, 3205, 3260, 3315, 3370, 3425, 3480, 3535, 3590, 3645, 3700, 3755, 3810, 3865, 3920,
    3975, 4040, 4105, 4170, 4235, 4300, 4365, 4430, 4495, 4560, 4625, 4690, 4755, 4820, 4885, 4950,
    5015, 5080, 5145, 5210, 5275, 5355, 5435, 5515, 5595, 5675, 5755, 5835, 5915, 5995, 6075, 6155,
    6235, 6315, 6395, 6475, 6555, 6635, 6715, 6795, 6875, 6955
  ],
  // Summoning("TomeBonus", 0..7) at the game's tome score 45893 (the toolbox scores 45894, same whole steps)
  bonuses: [
    2004.188327429342, 751.9969556212891, 350.43457571227555, 338.07537214001763,
    2495.9568616234396, 334.9654526299078, 50.42869048192136, 25.84744992824499
  ],
  // _GenInfo[86]
  rank: 1
};

// TomeQTY is a session cache that lagged the save on these lines: the live inputs (stamps, talent max levels,
// skill levels, bubbles, kitchens, meals, royal resource grades) had moved past both, and line 15 was built
// while MortasNinth was logged in (the toolbox scores the save's last played character). Each matched the
// game formula rebuilt from the fixture's raw data instead.
const STALE_GAME_LINES = new Set([0, 3, 11, 15, 22, 48, 50, 120]);

const { account } = parseFixture(latest);
const displayOrder = ninjaExtraInfo[32];
const lines = account.tome.tome.map((line) => ({ ...line, tomeLine: Number(displayOrder[line.index]) }));
const comparableLines = lines.filter(({ tomeLine }) => !STALE_GAME_LINES.has(tomeLine));

describe('tome verified against the live game', () => {
  it.each(comparableLines.map((line) => [line.tomeLine, line]))('line %i: quantity and points', (tomeLine, line) => {
    within(line.quantity, GAME.quantities[tomeLine]);
    expect(line.points).toBe(GAME.points[tomeLine]);
  });

  it('level requirement of every line, in display order', () => {
    expect(account.tome.tome.map(({ tomeLvReq }) => tomeLvReq)).toEqual(GAME.levelRequirements);
  });

  it('rank tier', () => {
    expect(account.tome.top).toBe(GAME.rank);
  });

  // 3-5 are the Tome of STR/AGI/WIS bubbles: whole 2000-point steps past 5000, and the logged-in Wind Walker's
  // archer class multiplier on the AGI one
  it.each(GAME.bonuses.map((bonus, index) => [index, bonus]))('bonus %i', (index, bonus) => {
    within(account.tome.bonuses[index].bonus, bonus);
  });
});

// The quantity each bar colour needs sits exactly on the game's TomePCT boundary (oracle: the game's expression, with
// getLOG = log(max(q, 1)) / 2.30259): at the threshold the line reaches the colour, one step short of it does not.
// Curve 3 is lower-is-better, so its threshold is the most a line may hold.
describe('tome colour thresholds', () => {
  const getLOG = (q) => Math.log(Math.max(q, 1)) / 2.30259;
  const tomePct = ({ x1, x2 }, q) => [
    () => (q < 0 ? 0 : Math.pow((1.7 * q) / (q + x1), 0.7)),
    () => (2.4 * getLOG(q)) / (2 * getLOG(q) + x1),
    () => Math.min(1, q / x1),
    () => (q > 5 * x1 ? 0 : Math.pow((1.2 * (6 * x1 - q)) / (7 * x1 - q), 5)),
    () => Math.pow((2 * Math.min(x1, q)) / (Math.min(x1, q) + x1), 0.7)
  ][x2]();
  const targets = { silver: 0.4, gold: 0.75, blue: 0.999 };
  const { tome } = parseFixture(latest).account.tome;

  it('pins the lines a wrong rounding or log base once missed', () => {
    const by = (name) => tome.find((line) => line.name.startsWith(name)).requiredQuantities;
    expect([by('Average_kills_for_a_Crystal_Spawn').blue, by('Fastest_Time_to_kill_Chaotic_Efaunt'), by('Most_Money_held').silver])
      .toEqual([30, { silver: 37, gold: 23, blue: 10 }, 1778334]);
  });

  it('every threshold sits on the boundary', () => {
    const off = [];
    for (const line of tome) {
      for (const [tier, q] of Object.entries(line.requiredQuantities)) {
        if (q === null || q > Number.MAX_SAFE_INTEGER) continue;
        const short = line.x2 === 3 ? q + 1 : q - 1;
        const ok = tomePct(line, q) >= targets[tier] && (q === 0 || tomePct(line, short) < targets[tier]);
        if (!ok) off.push(`${line.name} ${tier} ${q}`);
      }
    }
    expect(off).toEqual([]);
  });
});
