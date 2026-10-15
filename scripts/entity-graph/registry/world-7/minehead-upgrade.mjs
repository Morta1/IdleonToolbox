import { levelCap } from '../cap.mjs';
// UPKEEP: server variable A_MineCost (u.getServerVarLoad("A_MineCost"), Minehead.js:7-23) prices upgrades from index 10 on; website-data
// has no server vars, so the value is read from the fixture saves' serverVars (__test__/fixtures/latest.json, fresh.json, highend.json:
// 1.31 on 2026-10-14). Re-check it on a game patch.
const A_MINE_COST = 1.31;
// UPKEEP: UpgCost's base (Minehead.js:7-15): 5 + t + max(0, t - 2)^1.3, doubled per index from 5, x A_MineCost per index from 10.
const baseOf = (t) => (5 + t + Math.pow(Math.max(0, t - 2), 1.3)) * Math.pow(2, Math.max(0, t - 4)) * Math.pow(A_MINE_COST, Math.max(0, t - 9));
// UPKEEP: the buy check skips the max when it is above 998 (N.js:107683), so 9999 never stops a purchase; only the price, which
// overflows to ∞ at a level of its own, does. The panel prints "/max" only below 999 (N.js:121566).
const UNCAPPED_FROM = 999;
// UPKEEP: the Research level an upgrade needs is 1 + 3t + floor(t / 3) + floor(t / 11) (N.js:107677).
const researchLevelOf = (t) => 1 + 3 * t + Math.floor(t / 3) + Math.floor(t / 11);
// UPKEEP: the extractor mislabels MineheadUPG (N.js:107683, 107701): `baseCost` is the max level, `exponent` the cost growth per level
// and `levelReq` the bonus per level. Rename them in the extractor and minehead.ts together.
const maxLevelOf = (entry) => entry.baseCost;
const bonusPerLevelOf = (entry) => entry.levelReq;

// UPKEEP: Grid Expansion's sizes are "columns,rows" by level (research[9]).
const gridOf = (data) => data.research[9].map((cell) => cell.split(',').map(Number));
// UPKEEP: the panel's per-index `$` (N.js:121561). Each list replaces the default `{` / `}` pair, so Grid Expansion's
// columns and rows are filled once.
const SPECIAL = {
  1: () => [{ token: '$', formula: 'affineStep', args: { base: 1, perLevel: 1, at: 9, step: 1 } }],
  2: (data) => [
    { token: '{', formula: 'lookup', args: { values: gridOf(data).map(([columns]) => columns) } },
    { token: '}', formula: 'lookup', args: { values: gridOf(data).map(([, rows]) => rows) } },
    { token: '$', formula: 'lookup', args: { values: gridOf(data).map(([columns, rows]) => columns * rows) } }
  ],
  12: (data) => [{ token: '$', formula: 'lookup', args: { values: data.gameTables.mineheadUpgradeTables[12].map(Number) } }],
  14: () => [{ token: '$', formula: 'growth', args: { func: 'bigBase', x1: 1.5, x2: 0.01 } }],
  17: (data) => [{ token: '$', formula: 'lookup', args: { values: data.gameTables.mineheadUpgradeTables[17].map(Number) } }],
  23: () => [{ token: '$', formula: 'inverseLinearCeil', args: { base: 100, perLevel: 0.01 } }],
  24: () => [{ token: '$', formula: 'growth', args: { func: 'bigBase', x1: 3, x2: 1 } }],
  26: () => [{ token: '$', formula: 'diminishingPercentRounded', args: { perLevel: 1 } }]
};
// UPKEEP: N.js:121561 writes Grid Expansion and Miney Damagey Synergy whole (their data text is a bare `$`); the Synergy line drops its
// ", so +X% total" readout and Grid Expansion its "Way more than your current grid" tail, which read the save.
// UPKEEP: N.js:121561 appends "x" to the `$` of 12 and 14 and "%" to 17's; the data text does not carry the suffix.
const DESCRIBE = {
  2: () => 'Expands_your_grid_to_{x}_tiles,_that\'s_$_total_tiles!',
  12: (text) => text.replace('$', '$x'),
  14: (text) => text.replace('$', '$x'),
  17: (text) => text.replace('$', '$%'),
  28: () => '+{%_Mine_Currency_per_POW_10_of_your_best_ever_hit'
};

export default {
  kind: 'mineheadupgrade',
  section: 'mineheadUpgrades',
  key: (entry, index) => `MineheadUpg${index}`,
  icon: (entry, index) => `/data/MineUpg${index}.png`,
  fallbackIcon: '/data/MineHead0.png',
  // Rift Guy's own upgrade: the game sells no levels of it.
  skip: (entry) => (maxLevelOf(entry) === 0 ? 'max level 0: not for sale' : false),
  describe: (entry, index) => (DESCRIBE[index] ? DESCRIBE[index](entry.description) : entry.description),
  effect: (entry, index, data) => ({
    levelLabel: 'Upgrade level',
    ...levelCap(maxLevelOf(entry), maxLevelOf(entry) >= UNCAPPED_FROM),
    // UPKEEP: `{` is CommaNotation(bonus x L) and `}` MultiplierInfo(1 + bonus x L / 100) (N.js:121561).
    terms: SPECIAL[index]
      ? SPECIAL[index](data)
      : [
        { token: '{', formula: 'linear', args: { perLevel: bonusPerLevelOf(entry) } },
        { token: '}', formula: 'growth', args: { func: 'bigBase', x1: 1, x2: bonusPerLevelOf(entry) / 100 } }
      ]
  }),
  // The panel prints NotateNumber(cost, "Big") (N.js:121566); El' Cheapo and the sushi bonuses discount it.
  cost: (entry, index) => ({
    formula: 'notateBig',
    args: { formula: 'pow', args: { base: baseOf(index), rate: entry.exponent } },
    currency: 'Minehead Currency'
  }),
  fields: (entry, index) => [{ label: 'Research level needed', value: researchLevelOf(index) }]
};
