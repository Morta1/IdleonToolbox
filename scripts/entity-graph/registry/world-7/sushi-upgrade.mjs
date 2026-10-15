import { linked } from '../../../../utility/wiki/field-links.mjs';
import { gameTable } from '../data.mjs';
import { nodeId } from '../links.mjs';
import { spaced } from '../text.mjs';
import { levelCap } from '../cap.mjs';

// UPKEEP: the buy check skips the max when it is above 998 (CanWeBuyUpg, N.js:107741), so 9999 never stops a purchase; only the
// price, which overflows to ∞ at a level of its own, does. The panel prints "/max" only below 999 (N.js:122220).
const UNCAPPED_FROM = 999;
// UPKEEP: UpgCost's base by shop position (SushiStuff.js:14-39): every constant is the game's; a costMulti of 0 means 1.
const baseOf = (position, costMulti) => Math.max(0.1, Number(costMulti) || 1)
  * (5 + position + Math.pow(Math.max(0, position - 1), 2))
  * Math.pow(1.5 + Math.max(0, position - 3) / 16, Math.max(0, position - 4))
  * Math.pow(1.3, Math.max(0, position - 20));
// UPKEEP: UpgLvREQ (SushiStuff.js:6-12), the Research level the shop position needs.
const researchLevelOf = (p) => Math.floor(1 + Math.min(2, p) + Math.min(4, p) + 3 * p - Math.max(0, p - 4) - Math.max(0, p - 8)
  + Math.floor(p / 6) + Math.floor(p / 17));

// The ids whose line breaks mid-phrase ("and_a_unique_@_$x_Fuel_Cap_bonus"), which tidy would turn into a sentence break, so the
// break is joined back (wikiTables.sushiJoinedIds, z-processing: the id list the SushiStuff panel tests Research[32][..] against).
const isJoined = (id, data) => Boolean(gameTable(data, 'sushiJoinedIds')?.includes(id));
// UPKEEP: N.js:122215 fills these `$` with account readouts: Fastburn Fuel I's fuel rate (8), the "You have: N" lines of
// Potassium Firelighter (25) and Overtuned Fuel (28), and Heat of the East Wind's tier limit (29). Each cut drops its line.
const READOUTS = {
  8: /_*@_*Your_current_rate_is_\$/,
  25: /_*@_*\$$/,
  28: /_*@_*\$$/,
  29: /_*@_*This_only_works_on_sushi_Tier_\$_and_lower\./
};
// UPKEEP: N.js:122215 fills these `$` from SlotEffect (SushiStuff.js:222-230) and FireplaceEffect (239-247), whose shared multi is
// 1 before Knowledge and fireplace sparks: Hot Slot 1 + 50/100, Cold Slot 0.2, Milktoast Slot 1, Lithium 1 + 100/100, Barium
// 1 + 150/100.
const BASE_FILLS = { 14: '1.5', 15: '0.2', 16: '1', 26: '2', 27: '2.5' };
const textOf = ({ id, description }, index, data) => {
  let text = isJoined(id, data) ? description.replace('_@_', '_') : description;
  if (READOUTS[id]) text = text.replace(READOUTS[id], '');
  return BASE_FILLS[id] ? text.split('$').join(BASE_FILLS[id]) : text;
};

// UPKEEP: the levelled `$` the panel computes per id (N.js:122215): the unique Fuel bonuses round(100 (1 + L/100)) / 100, Superior
// Sushi Skillz MaxCookTier + 1, Sasaphrax Saffron SaffronHRS (1 + L), Wholesale Pricing's discount, 2nd Degree Searing
// KnowledgeXP_base (1 + L/10).
const DOLLAR = {
  6: { formula: 'growth', args: { func: 'bigBase', x1: 1, x2: 1 } },
  22: { formula: 'growth', args: { func: 'bigBase', x1: 1, x2: 1 } },
  36: { formula: 'diminishingPercentRounded', args: { perLevel: 1 } },
  37: { formula: 'growth', args: { func: 'bigBase', x1: 1, x2: 0.1 } }
};
const dollarOf = (id, data) => (isJoined(id, data) ? { formula: 'growth', args: { func: 'bigBase', x1: 1, x2: 0.01 } } : DOLLAR[id]);

const row = {
  kind: 'sushiupgrade',
  // UPKEEP: research[32] is the shop order (N.js:107731, 122215); cost and Research level follow the position, art the id.
  section: (data) => {
    const ids = data.research[32].map(Number).filter((id) => data.sushiUpgrades[id]);
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
    ...levelCap(entry.max, entry.max >= UNCAPPED_FROM),
    // UPKEEP: `{` is CommaNotation(perLevel x L) and `}` MultiplierInfo(1 + perLevel x L / 100) (N.js:122215).
    terms: [
      { token: '{', formula: 'linear', args: { perLevel: entry.perLevel } },
      { token: '}', formula: 'growth', args: { func: 'bigBase', x1: 1, x2: entry.perLevel / 100 } },
      ...(dollarOf(entry.id, data) ? [{ token: '$', ...dollarOf(entry.id, data) }] : [])
    ]
  }),
  // The panel prints NotateNumber(cost, "Big") (N.js:122220); Wholesale Pricing, the sushi and jelly bonuses and Knowledge discount it.
  cost: (entry) => ({
    formula: 'notateBig',
    args: { formula: 'pow', args: { base: baseOf(entry.position, entry.costMulti), rate: entry.rate } },
    currency: 'Bucks'
  }),
  fields: (entry) => [
    { label: 'Research level needed', value: researchLevelOf(entry.position) },
    // CanWeBuyUpg (SushiStuff.js:40-48): every position after the first needs the one before it bought.
    ...(entry.previous
      ? [linked({ label: 'Unlocked by', value: `${spaced(entry.previous)} at level 1` }, 'unlockedBy', nodeId(row, { id: entry.previousId }))]
      : [])
  ]
};

export default row;
