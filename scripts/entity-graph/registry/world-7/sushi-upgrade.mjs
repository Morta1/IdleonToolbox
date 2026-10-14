// UPKEEP: the panel prints "/max" only below 999 (CanWeBuyUpg, SushiStuff.js:40-48); 9999 means uncapped.
const UNCAPPED_FROM = 999;
// UPKEEP: UpgCost's base by shop position (SushiStuff.js:14-39): every constant is the game's; a costMulti of 0 means 1.
const baseOf = (position, costMulti) => Math.max(0.1, Number(costMulti) || 1)
  * (5 + position + Math.pow(Math.max(0, position - 1), 2))
  * Math.pow(1.5 + Math.max(0, position - 3) / 16, Math.max(0, position - 4))
  * Math.pow(1.3, Math.max(0, position - 20));
// UPKEEP: UpgLvREQ (SushiStuff.js:6-12), the Research level the shop position needs.
const researchLevelOf = (p) => Math.floor(1 + Math.min(2, p) + Math.min(4, p) + 3 * p - Math.max(0, p - 4) - Math.max(0, p - 8)
  + Math.floor(p / 6) + Math.floor(p / 17));

// UPKEEP: the panel's per-id text handling (N.js:122215). These ids break their line mid-phrase ("and_a_unique_@_$x_Fuel_Cap_bonus"),
// which tidy would turn into a sentence break, so the break is joined back.
const JOINED = new Set([2, 3, 4, 5, 9, 10, 11, 12]);
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
const textOf = ({ id, description }) => {
  let text = JOINED.has(id) ? description.replace('_@_', '_') : description;
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
const dollarOf = (id) => (JOINED.has(id) ? { formula: 'growth', args: { func: 'bigBase', x1: 1, x2: 0.01 } } : DOLLAR[id]);

const spaced = (text) => String(text || '').replace(/_/g, ' ');

export default {
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
        previous: position > 0 ? data.sushiUpgrades[ids[position - 1]][0] : null
      };
    });
  },
  key: (entry) => `SushiUpg${entry.id}`,
  icon: (entry) => `/data/SushiUpg${entry.id}.png`,
  fallbackIcon: '/data/Sushi6.png',
  // Rift Guy's own upgrade: the game sells no levels of it.
  skip: (entry) => (entry.max === 0 ? 'max level 0: not for sale' : false),
  describe: textOf,
  effect: (entry) => ({
    levelLabel: 'Upgrade level',
    cap: entry.max < UNCAPPED_FROM ? entry.max : null,
    // UPKEEP: `{` is CommaNotation(perLevel x L) and `}` MultiplierInfo(1 + perLevel x L / 100) (N.js:122215).
    terms: [
      { token: '{', formula: 'linear', args: { perLevel: entry.perLevel } },
      { token: '}', formula: 'growth', args: { func: 'bigBase', x1: 1, x2: entry.perLevel / 100 } },
      ...(dollarOf(entry.id) ? [{ token: '$', ...dollarOf(entry.id) }] : [])
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
    ...(entry.previous ? [{ label: 'Unlocked by', value: `${spaced(entry.previous)} at level 1` }] : [])
  ]
};
