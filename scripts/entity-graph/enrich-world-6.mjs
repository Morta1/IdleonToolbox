// World 6 details that belong on pages which already exist: the Jade Emporium's prices and the
// Emperor's showdown rewards. Neither earns a kind of its own.
import { formatAmount } from '../../utility/wiki/effects.mjs';
import { spaced, tidy } from './registry/text.mjs';

const addFields = (node, fields) => {
  node.fields = [...(node.fields || []), ...fields];
};

// Jade Emporium ---------------------------------------------------------------------------------

// UPKEEP: Ninja("EmporiumCost", row) (Ninja.js:24-30) prices by shop row, with two steeper tiers from rows 28 and 38; the row order is ninjaExtraInfo[24] (sneaking.ts:178).
const emporiumCost = (row) => (300 + 500 * row + row ** 3) * 2.52 ** row * 3.07 ** Math.max(0, row - 28) * 160 ** Math.max(0, row - 38);
// UPKEEP: EmporiumOptions offers `bought + 3` rows (Ninja.js:31-35, N.js:110097), so row r needs r - 2 purchases first.
const ROWS_AHEAD = 3;
// UPKEEP: ninjaExtraInfo[24] is the Emporium's display order, a permutation of the upgrades' x3 ids.
const SHOP_ORDER = 24;

const purchases = (count) => `${count} ${count === 1 ? 'purchase' : 'purchases'}`;

const enrichJade = (nodes, jadeUpgrades, ninjaExtraInfo) => {
  const order = (ninjaExtraInfo?.[SHOP_ORDER] || []).map(Number);
  (jadeUpgrades || []).forEach((upgrade) => {
    const node = nodes[`jade:NjJupg${upgrade?.x3}`];
    const row = order.indexOf(upgrade?.x3);
    if (!node || row < 0) return;
    addFields(node, [
      { label: 'Cost', value: `${formatAmount(emporiumCost(row))} Jade Coins` },
      { label: 'Shop row', value: row + 1 },
      ...(row >= ROWS_AHEAD ? [{ label: 'Offered after', value: purchases(row - ROWS_AHEAD + 1) }] : [])
    ]);
  });
};

// The Emperor ------------------------------------------------------------------------------------

// UPKEEP: Boss6A is the showdown Emperor, whose HP is Thingies("Boss6HP") (N.js:106713).
const EMPEROR = 'monster:Boss6A';
// UPKEEP: bonuses 9 and 10 of EmperorBon are placeholders, "+{%_something_World_7ish" (N.js:106717).
const PLACEHOLDER = /World_7ish/;

// The game adds each win's value to one total and prints `}` as `1 + total / 100` (N.js:118257),
// so a per-win line states the step, never a multiplier that would read as compounding.
// UPKEEP: N.js:118257 shows `$` as floor((x + 4) / (x + 100) * 1000) / 10, replaced before `{`, so one win reads this percentage.
const cheaperAfterOneWin = (value) => Math.floor(((value + 4) / (value + 100)) * 1000) / 10;

// UPKEEP: the market cost multiplies by 1 - x / (x + 100) (N.js:106213), less than the panel's figure.
const priceDrop = (value) => Math.round((1000 * value) / (value + 100)) / 10;

const perWin = (name, value) => {
  if (name.includes('$')) return `${spaced(tidy(name.replace('$', cheaperAfterOneWin(value))))} after one win (the price itself drops ${priceDrop(value)}%)`;
  if (name.includes('}')) return `+${spaced(tidy(name.replace('}', value / 100)))} per win`;
  return `${spaced(tidy(name.replace('{', value)))} per win`;
};

const enrichEmperor = (nodes, emperorBonuses) => {
  const node = nodes[EMPEROR];
  if (!node || !emperorBonuses?.length) return;
  const byBonus = new Map();
  const unreleased = [];
  emperorBonuses.forEach(({ name, value, index }, position) => {
    if (PLACEHOLDER.test(name)) {
      unreleased.push(position + 1);
      return;
    }
    if (!byBonus.has(index)) byBonus.set(index, { line: perWin(name, value), wins: [] });
    byBonus.get(index).wins.push(position + 1);
  });
  addFields(node, [
    {
      label: `Showdown rewards (the cycle repeats every ${emperorBonuses.length} wins)`,
      value: [
        ...[...byBonus.values()].map(({ line, wins }) => `${line}, at ${wins.length === 1 ? 'win' : 'wins'} ${wins.join(', ')}`),
        ...(unreleased.length ? [`${unreleased.length === 1 ? 'Win' : 'Wins'} ${unreleased.join(', ')}: a bonus not released yet`] : [])
      ]
    },
    // UPKEEP: Thingies("Boss6HP") is 135e12 * 1.52 ^ showdowns won (N.js:106713); the app's emperor.ts uses 1.54, the game does not.
    { label: 'Showdown HP', value: '1.35e14, x1.52 per showdown won' }
  ]);
};

export const enrichWorld6 = (nodes, { jadeUpgrades, ninjaExtraInfo, emperorBonuses }) => {
  enrichJade(nodes, jadeUpgrades, ninjaExtraInfo);
  enrichEmperor(nodes, emperorBonuses);
};
