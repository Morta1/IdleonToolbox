import { linked } from '../../../../utility/wiki/field-links.mjs';
import { gameTable, listAt } from '../data.mjs';
import { nodeId } from '../links.mjs';
import { spaced } from '../text.mjs';
import { levelCap } from '../cap.mjs';
import { panelFill } from './panel-fills.mjs';

// The sushiCanBuy table, SushiStuff:CanWeBuyUpg (N.js:107741): the buy check skips a max above `above`, so 9999 never stops a
// purchase; only the price, which overflows to ∞ at a level of its own, does. No table, no cap.
const capOf = (max, data) => {
  const canBuy = gameTable(data, 'sushiCanBuy');
  return canBuy ? levelCap(max, max > canBuy.above) : {};
};
// The sushiUpgradeCost table, SushiStuff:UpgCost (N.js:107733): the cost base by shop position; a costMulti of 0 means the default.
const baseOf = (position, costMulti, price) => Math.max(price.minCostMulti, Number(costMulti) || price.defaultCostMulti)
  * (price.base + position + Math.pow(Math.max(0, position - price.squareFrom), price.squarePower))
  * Math.pow(price.rateBase + Math.max(0, position - price.rateFrom) / price.rateDivisor, Math.max(0, position - price.powFrom))
  * Math.pow(price.lateRate, Math.max(0, position - price.lateFrom));
// The sushiUpgradeLevelReq table, SushiStuff:UpgLvREQ (N.js:107731): the Research level the shop position needs.
const researchLevelOf = (p, data) => {
  const req = gameTable(data, 'sushiUpgradeLevelReq');
  return req
    ? Math.floor(req.base + Math.min(req.firstCap, p) + Math.min(req.secondCap, p) + req.perPosition * p - Math.max(0, p - req.firstDropFrom)
      - Math.max(0, p - req.secondDropFrom) + Math.floor(p / req.firstDivisor) + Math.floor(p / req.secondDivisor))
    : null;
};

// The ids whose line breaks mid-phrase ("and_a_unique_@_$x_Fuel_Cap_bonus"), which tidy would turn into a sentence break, so the
// break is joined back (the sushiJoinedIds table, z-processing: the id list the SushiStuff panel tests the shop order against).
const isJoined = (id, data) => Boolean(gameTable(data, 'sushiJoinedIds')?.includes(id));
// UPKEEP: N.js:122215 fills these `$` with account readouts: Fastburn Fuel I's fuel rate (8), the "You have: N" lines of
// Potassium Firelighter (25) and Overtuned Fuel (28), and Heat of the East Wind's tier limit (29). Each cut drops its line.
const READOUTS = {
  8: /_*@_*Your_current_rate_is_\$/,
  25: /_*@_*\$$/,
  28: /_*@_*\$$/,
  29: /_*@_*This_only_works_on_sushi_Tier_\$_and_lower\./
};
// The `$` the panel fills from SlotEffect and FireplaceEffect, whose shared multi is 1 before Knowledge and fireplace sparks:
// the sushiBaseFills table (N.js:122215), printed to two decimals. No table, no fill.
const baseFillOf = (id, data) => {
  const fill = gameTable(data, 'sushiBaseFills')?.[id];
  return fill ? String(Math.round(100 * (fill.base + fill.scale / fill.divisor)) / 100) : null;
};
const textOf = ({ id, description }, index, data) => {
  let text = isJoined(id, data) ? description.replace('_@_', '_') : description;
  if (READOUTS[id]) text = text.replace(READOUTS[id], '');
  const fill = baseFillOf(id, data);
  return fill ? text.split('$').join(fill) : text;
};

// The levelled `$` the panel computes per id: the sushiDollarFills table, the panel's `$` branches (N.js:122215) with
// MaxCookTier, SaffronHRS and KnowledgeXP_base.
const dollarOf = (id, data) => panelFill(gameTable(data, 'sushiDollarFills')?.[id]);

const row = {
  kind: 'sushiupgrade',
  // The shop order is listIndexes.sushiShopOrder (SushiStuff:UpgCost, N.js:107731, 122215); cost and Research level follow the
  // position, art the id.
  section: (data) => {
    const ids = (listAt(data.research, data, 'sushiShopOrder') || []).map(Number).filter((id) => data.sushiUpgrades[id]);
    return ids.map((id, position) => {
      const [name, max, rate, perLevel, costMulti, description] = data.sushiUpgrades[id];
      return {
        name,
        max: Number(max),
        rate: Number(rate),
        perLevel: Number(perLevel),
        costMulti,
        description,
        id,
        position,
        previous: position > 0 ? data.sushiUpgrades[ids[position - 1]][0] : null,
        previousId: position > 0 ? ids[position - 1] : null
      };
    });
  },
  key: (entry) => `SushiUpg${entry.id}`,
  icon: (entry) => `/data/SushiUpg${entry.id}.png`,
  fallbackIcon: '/data/Sushi6.png',
  // Rift Guy's own upgrade: the game sells no levels of it.
  skip: (entry) => (entry.max === 0 ? 'max level 0: not for sale' : false),
  describe: textOf,
  effect: (entry, index, data) => ({
    levelLabel: 'Upgrade level',
    ...capOf(entry.max, data),
    // UPKEEP: `{` is CommaNotation(perLevel x L) and `}` MultiplierInfo(1 + perLevel x L / 100) (N.js:122215). Not extracted: the
    // token print rule is panel draw code (owner list: panel print rules).
    terms: [
      { token: '{', formula: 'linear', args: { perLevel: entry.perLevel } },
      { token: '}', formula: 'growth', args: { func: 'bigBase', x1: 1, x2: entry.perLevel / 100 } },
      ...(dollarOf(entry.id, data) ? [{ token: '$', ...dollarOf(entry.id, data) }] : [])
    ]
  }),
  // The panel prints NotateNumber(cost, "Big") (N.js:122220); Wholesale Pricing, the sushi and jelly bonuses and Knowledge discount it.
  // No table, no price.
  cost: (entry, index, data) => {
    const price = gameTable(data, 'sushiUpgradeCost');
    return price
      ? {
        formula: 'notateBig',
        args: { formula: 'pow', args: { base: baseOf(entry.position, entry.costMulti, price), rate: entry.rate } },
        currency: 'Bucks',
        // A font glyph in the game; the site's own art.
        currencyIcon: '/etc/Bucks.png'
      }
      : null;
  },
  fields: (entry, index, data) => [
    { label: 'Research level needed', value: researchLevelOf(entry.position, data) },
    // CanWeBuyUpg (SushiStuff.js:40-48): every position after the first needs the one before it bought.
    ...(entry.previous
      ? [linked({ label: 'Unlocked by', value: `${spaced(entry.previous)} at level 1` }, 'unlockedBy', nodeId(row, { id: entry.previousId }))]
      : [])
  ]
};

export default row;
