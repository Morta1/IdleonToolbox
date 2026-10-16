import { linked } from '../../../../utility/wiki/field-links.mjs';
import { gameTable, listAt } from '../data.mjs';
import { nodeId } from '../links.mjs';
import { levelCap } from '../cap.mjs';
import { dropReadout, spaced } from '../text.mjs';
import { panelFill } from './panel-fills.mjs';

// The jellyCanBuy table, JellyOperation:CanWeBuyUpg (N.js:72889): the buy check skips a max above `above`, so 9999 never stops
// a purchase; only the price, which overflows to ∞ at a level of its own, does. No table, no cap.
const capOf = (max, data) => {
  const canBuy = gameTable(data, 'jellyCanBuy');
  return canBuy ? levelCap(max, max > canBuy.above) : {};
};
// The jellyUpgradeCost table, JellyOperation:UpgCost (N.js:72888): the cost base by shop position. Position 0 is free; a
// costMulti of 0 means the default.
const baseOf = (position, costMulti, price) => (position === 0
  ? 0
  : Math.max(price.minCostMulti, Number(costMulti) || price.defaultCostMulti)
    * (1 + position / price.positionDivisor)
    * (price.base + price.perPosition * position + Math.pow(position, price.squarePower))
    * Math.pow(price.rateBase + Math.max(0, position - price.rateFrom) / price.rateDivisor, Math.max(0, position - price.powFrom))
    * Math.pow(price.lateRate, Math.max(0, position - price.lateFrom)));
// The jellyUpgradeLevelReq table, JellyOperation:UpgLvREQ (N.js:72886): the Research level the shop position needs.
const researchLevelOf = (p, data) => {
  const req = gameTable(data, 'jellyUpgradeLevelReq');
  return req ? req.base + req.perPosition * p + Math.floor(p / req.bonusDivisor) - Math.floor(p / req.penaltyDivisor) : null;
};

// UPKEEP: N.js:122502 fills these `$` with account readouts: the slot unlocks left (9) and the "+$ " amounts of Cell Biology's EXP
// (10), Bloodcell Coagulation's per-damage Bloodcells (23) and Daily Transfusion's daily Bloodcells (38). The first drops its
// line, the others the "+$ " so the sentence reads without the number.
const CUTS = [/_*@_*You_currently_have_\$_slot_unlocks_left,_use_them_wisely!/, /\+\$_/];
const textOf = ({ description }) => CUTS.reduce((out, re) => out.replace(re, ''), dropReadout(description));

// The levelled `$` the panel computes per id: the jellyPanelFills table, the panel's `$` branches (N.js:122502) and their
// JellyOperation handlers. Cell Metabolism (32) and Cell Dialysis (33) print only a Total bonus tail, which dropReadout removes.
const dollarOf = (id, data) => panelFill(gameTable(data, 'jellyPanelFills')?.[id]);

const row = {
  kind: 'jellyupgrade',
  // The shop order is listIndexes.jellyShopOrder (JellyOperation:UpgCost, N.js:72886); cost and Research level follow the position,
  // art the id.
  section: (data) => {
    const ids = (listAt(data.research, data, 'jellyShopOrder') || []).map(Number).filter((id) => data.jellyUpgrades[id]);
    return ids.map((id, position) => {
      const [name, max, rate, perLevel, costMulti, description] = data.jellyUpgrades[id];
      return {
        name,
        max: Number(max),
        rate: Number(rate),
        perLevel: Number(perLevel),
        costMulti,
        description,
        id,
        position,
        previous: position > 0 ? data.jellyUpgrades[ids[position - 1]][0] : null,
        previousId: position > 0 ? ids[position - 1] : null
      };
    });
  },
  key: (entry) => `JellyUpg${entry.id}`,
  icon: (entry) => `/data/JellyUpg${entry.id}.png`,
  fallbackIcon: '/data/JellyUnit0.png',
  // Rift Guy's own upgrade: the game sells no levels of it.
  skip: (entry) => (entry.max === 0 ? 'max level 0: not for sale' : false),
  describe: textOf,
  effect: (entry, index, data) => ({
    levelLabel: 'Upgrade level',
    ...capOf(entry.max, data),
    // UPKEEP: `{` is CommaNotation(perLevel x L) and `}` MultiplierInfo(1 + perLevel x L / 100) (N.js:122502). Not extracted: the
    // token print rule is panel draw code (owner list: panel print rules).
    terms: [
      { token: '{', formula: 'linear', args: { perLevel: entry.perLevel } },
      { token: '}', formula: 'growth', args: { func: 'bigBase', x1: 1, x2: entry.perLevel / 100 } },
      ...(dollarOf(entry.id, data) ? [{ token: '$', ...dollarOf(entry.id, data) }] : [])
    ]
  }),
  // The panel prints NotateNumber(cost, "Big") (N.js:122503). Lower Cholesterol discounts it, so the default note stands only as
  // the base price. No table, no price.
  cost: (entry, index, data) => {
    const price = gameTable(data, 'jellyUpgradeCost');
    return price
      ? {
        formula: 'notateBig',
        args: { formula: 'pow', args: { base: baseOf(entry.position, entry.costMulti, price), rate: entry.rate } },
        currency: 'Bloodcells',
        // A font glyph in the game; the site's own art, as the Jelly Operator page shows it.
        currencyIcon: '/etc/Bloodcell.png'
      }
      : null;
  },
  fields: (entry, index, data) => [
    { label: 'Research level needed', value: researchLevelOf(entry.position, data) },
    // The shop unlocks each position once the one before it is bought.
    ...(entry.previous
      ? [linked({ label: 'Unlocked by', value: `${spaced(entry.previous)} at level 1` }, 'unlockedBy', nodeId(row, { id: entry.previousId }))]
      : [])
  ]
};

export default row;
