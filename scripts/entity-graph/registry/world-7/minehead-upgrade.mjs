import { levelCap } from '../cap.mjs';
import { gameTable } from '../data.mjs';
import { panelFill } from './panel-fills.mjs';
// UPKEEP: server variable A_MineCost (u.getServerVarLoad("A_MineCost"), Minehead.js:7-23) prices upgrades from index 10 on; website-data
// has no server vars, so the value is read from the fixture saves' serverVars (__test__/fixtures/latest.json, fresh.json, highend.json:
// 1.31 on 2026-10-14). Re-check it on a game patch. Not extracted: it is a server variable; N.js holds only its max(1, ...) floor.
const A_MINE_COST = 1.31;
// The mineheadUpgradeCost table, Minehead:UpgCost (N.js:107678): base + t + max(0, t - powFrom)^power, doubled per index past
// doublingFrom, x A_MineCost per index past serverFrom.
const baseOf = (t, price) => (price.base + t + Math.pow(Math.max(0, t - price.powFrom), price.power))
  * Math.pow(price.doubling, Math.max(0, t - price.doublingFrom))
  * Math.pow(A_MINE_COST, Math.max(0, t - price.serverFrom));
// The mineheadCanBuy table, Minehead:CanWeBuyUpg (N.js:107683): the buy check skips a max above `above`, so 9999 never stops a
// purchase; only the price, which overflows to ∞ at a level of its own, does. No table, no cap.
const capOf = (max, data) => {
  const canBuy = gameTable(data, 'mineheadCanBuy');
  return canBuy ? levelCap(max, max > canBuy.above) : {};
};
// The mineheadUpgradeLevelReq table, Minehead:UpgLvREQ (N.js:107677): the Research level an upgrade needs.
const researchLevelOf = (t, data) => {
  const req = gameTable(data, 'mineheadUpgradeLevelReq');
  return req ? req.base + req.perIndex * t + Math.floor(t / req.firstDivisor) + Math.floor(t / req.secondDivisor) : null;
};
// UPKEEP: the extractor mislabels MineheadUPG (N.js:107683, 107701): `baseCost` is the max level, `exponent` the cost growth per level
// and `levelReq` the bonus per level. Rename them in the extractor and minehead.ts together.
const maxLevelOf = (entry) => entry.baseCost;
const bonusPerLevelOf = (entry) => entry.levelReq;

// UPKEEP: Grid Expansion's sizes are "columns,rows" by level (research[9]).
const gridOf = (data) => data.research[9].map((cell) => cell.split(',').map(Number));
// The lookup `$` of 12 and 17 reads the mineheadUpgradeTables table; with it absent the `$` is left as written.
const tableTerm = (data, index) => {
  const values = gameTable(data, 'mineheadUpgradeTables')?.[index];
  return values ? [{ token: '$', formula: 'lookup', args: { values: values.map(Number) } }] : [];
};
// The levelled `$` of 1, 14, 23, 24 and 26: the mineheadPanelFills table, the panel's `$` branches (N.js:121561) with
// BluecrownMulti, JackpotOdds and JackpotTiles. With it absent the `$` is left as written.
const fillTerm = (data, index) => {
  const fill = panelFill(gameTable(data, 'mineheadPanelFills')?.[index]);
  return fill ? [{ token: '$', ...fill }] : [];
};
// The panel's per-index `$` (N.js:121561). Each list replaces the default `{` / `}` pair, so Grid Expansion's columns and rows
// are filled once.
const SPECIAL = {
  1: (data) => fillTerm(data, 1),
  2: (data) => [
    { token: '{', formula: 'lookup', args: { values: gridOf(data).map(([columns]) => columns) } },
    { token: '}', formula: 'lookup', args: { values: gridOf(data).map(([, rows]) => rows) } },
    { token: '$', formula: 'lookup', args: { values: gridOf(data).map(([columns, rows]) => columns * rows) } }
  ],
  12: (data) => tableTerm(data, 12),
  14: (data) => fillTerm(data, 14),
  17: (data) => tableTerm(data, 17),
  23: (data) => fillTerm(data, 23),
  24: (data) => fillTerm(data, 24),
  26: (data) => fillTerm(data, 26)
};
// UPKEEP: N.js:121561 writes Grid Expansion and Miney Damagey Synergy whole (their data text is a bare `$`); the Synergy line drops its
// ", so +X% total" readout and Grid Expansion its "Way more than your current grid" tail, which read the save. Not extracted: the
// whole texts are composed in panel draw code.
// UPKEEP: N.js:121561 appends "x" to the `$` of 12 and 14 and "%" to 17's; the data text does not carry the suffix. Not extracted:
// the suffixes are panel draw code.
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
    ...capOf(maxLevelOf(entry), data),
    // UPKEEP: `{` is CommaNotation(bonus x L) and `}` MultiplierInfo(1 + bonus x L / 100) (N.js:121561). Not extracted: the token
    // print rule is panel draw code (owner list: panel print rules).
    terms: SPECIAL[index]
      ? SPECIAL[index](data)
      : [
        { token: '{', formula: 'linear', args: { perLevel: bonusPerLevelOf(entry) } },
        { token: '}', formula: 'growth', args: { func: 'bigBase', x1: 1, x2: bonusPerLevelOf(entry) / 100 } }
      ]
  }),
  // The panel prints NotateNumber(cost, "Big") (N.js:121566); El' Cheapo and the sushi bonuses discount it. No table, no price.
  cost: (entry, index, data) => {
    const price = gameTable(data, 'mineheadUpgradeCost');
    return price
      ? {
        formula: 'notateBig',
        args: { formula: 'pow', args: { base: baseOf(index, price), rate: entry.exponent } },
        currency: 'Minehead Currency'
      }
      : null;
  },
  fields: (entry, index, data) => [{ label: 'Research level needed', value: researchLevelOf(index, data) }]
};
