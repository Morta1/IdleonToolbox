// World 6 details that belong on pages which already exist: the Jade Emporium's prices and the
// Emperor's showdown rewards. Neither earns a kind of its own.
import { formatAmount } from '../../utility/wiki/effects.mjs';
import { gameTable, listAt } from './registry/data.mjs';
import { spaced, tidy } from './registry/text.mjs';

const addFields = (node, fields) => {
  node.fields = [...(node.fields || []), ...fields];
};

// Jade Emporium ---------------------------------------------------------------------------------

// The emporiumCost table, Ninja("EmporiumCost", row) (Ninja.js:24-30): prices by shop row, with three steeper tiers (the
// steepest since 2.3.540); the row order is listIndexes.emporiumShopOrder (sneaking.ts:178).
const emporiumCost = (row, cost) => (cost.base + cost.perRow * row + row ** cost.power) * cost.rate ** row
  * cost.steepRate ** Math.max(0, row - cost.steepFrom) * cost.steeperRate ** Math.max(0, row - cost.steeperFrom)
  * (cost.steepestRate ?? 1) ** Math.max(0, row - (cost.steepestFrom ?? row));
const purchases = (count) => `${count} ${count === 1 ? 'purchase' : 'purchases'}`;

// The emporiumRowsAhead table: EmporiumOptions offers `bought + rowsAhead` rows (Ninja.js:31-35, N.js:110097), so a row
// needs that many fewer purchases first.
const enrichJade = (nodes, data) => {
  // The Emporium's display order (listIndexes.emporiumShopOrder), a permutation of the upgrades' x3 ids.
  const order = (listAt(data.ninjaExtraInfo, data, 'emporiumShopOrder') || []).map(Number);
  const cost = gameTable(data, 'emporiumCost');
  const ahead = gameTable(data, 'emporiumRowsAhead')?.rowsAhead;
  (data.jadeUpgrades || []).forEach((upgrade) => {
    const node = nodes[`jade:NjJupg${upgrade?.x3}`];
    const row = order.indexOf(upgrade?.x3);
    if (!node || row < 0) return;
    addFields(node, [
      ...(cost ? [{ label: 'Cost', value: `${formatAmount(emporiumCost(row, cost))} Jade Coins` }] : []),
      { label: 'Shop row', value: row + 1 },
      ...(ahead !== undefined && row >= ahead ? [{ label: 'Offered after', value: purchases(row - ahead + 1) }] : [])
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
// The emperorCheaper table: N.js:118257 shows `$` as floor((x + add) / (x + offset) * scale) / divisor, replaced before
// `{`, so one win reads this percentage.
const cheaperAfterOneWin = (value, cheaper) => Math.floor(((value + cheaper.add) / (value + cheaper.offset)) * cheaper.scale) / cheaper.divisor;

// The marketCostQty table: the market cost of its EmperorBon row multiplies by 1 - x / (x + discountOffset)
// (N.js:106213), less than the panel's figure.
const priceDrop = (index, value, data) => {
  const qty = gameTable(data, 'marketCostQty');
  return qty && index === qty.emperorBonus ? ` (the price itself drops ${Math.round((1000 * value) / (value + qty.discountOffset)) / 10}%)` : '';
};

const perWin = (name, value, index, data) => {
  if (name.includes('$')) {
    const cheaper = gameTable(data, 'emperorCheaper');
    return cheaper
      ? `${spaced(tidy(name.replace('$', cheaperAfterOneWin(value, cheaper))))} after one win${priceDrop(index, value, data)}`
      : null;
  }
  if (name.includes('}')) return `+${spaced(tidy(name.replace('}', value / 100)))} per win`;
  return `${spaced(tidy(name.replace('{', value)))} per win`;
};

// The boss6HP table, Thingies("Boss6HP"): base x growth ^ showdowns won (N.js:106713); the app's emperor.ts uses 1.54,
// the game does not.
const hpField = (data) => {
  const hp = gameTable(data, 'boss6HP');
  return hp ? [{ label: 'Showdown HP', value: `${formatAmount(hp.base)}, x${hp.growth} per showdown won` }] : [];
};

const enrichEmperor = (nodes, data) => {
  const emperorBonuses = data.emperorBonuses;
  const node = nodes[EMPEROR];
  if (!node || !emperorBonuses?.length) return;
  const byBonus = new Map();
  const unreleased = [];
  emperorBonuses.forEach(({ name, value, index }, position) => {
    if (PLACEHOLDER.test(name)) {
      unreleased.push(position + 1);
      return;
    }
    if (!byBonus.has(index)) byBonus.set(index, { line: perWin(name, value, index, data), wins: [] });
    byBonus.get(index).wins.push(position + 1);
  });
  addFields(node, [
    {
      label: `Showdown rewards (the cycle repeats every ${emperorBonuses.length} wins)`,
      value: [
        ...[...byBonus.values()].filter(({ line }) => line !== null)
          .map(({ line, wins }) => `${line}, at ${wins.length === 1 ? 'win' : 'wins'} ${wins.join(', ')}`),
        ...(unreleased.length ? [`${unreleased.length === 1 ? 'Win' : 'Wins'} ${unreleased.join(', ')}: a bonus not released yet`] : [])
      ]
    },
    ...hpField(data)
  ]);
};

export const enrichWorld6 = (nodes, data) => {
  enrichJade(nodes, data);
  enrichEmperor(nodes, data);
};
