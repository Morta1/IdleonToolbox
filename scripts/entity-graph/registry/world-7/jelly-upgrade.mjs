import { linked } from '../../../../utility/wiki/field-links.mjs';
import { nodeId } from '../links.mjs';
import { dropReadout, spaced } from '../text.mjs';

// UPKEEP: the panel prints "/max" only below 999 (N.js:122502); 9999 means uncapped.
const UNCAPPED_FROM = 999;
// UPKEEP: the jelly upgrade cost base by shop position (JellyOperation.js:52-70, N.js:72888): position 0 is free, every other
// constant is the game's; a costMulti of 0 means 1.
const baseOf = (position, costMulti) => (position === 0
  ? 0
  : Math.max(0.1, Number(costMulti) || 1)
    * (1 + position / 7)
    * (6 + 5 * position + position * position)
    * Math.pow(1.4 + Math.max(0, position - 3) / 30, Math.max(0, position - 4))
    * Math.pow(1.3, Math.max(0, position - 20)));
// UPKEEP: the Research level the shop position needs (JellyOperation.js:50, N.js:72886).
const researchLevelOf = (p) => 15 + 2 * p + Math.floor(p / 15) - Math.floor(p / 11);

// UPKEEP: N.js:122502 fills these `$` with account readouts: the slot unlocks left (9) and the "+$ " amounts of Cell Biology's EXP
// (10), Bloodcell Coagulation's per-damage Bloodcells (23) and Daily Transfusion's daily Bloodcells (38). The first drops its
// line, the others the "+$ " so the sentence reads without the number.
const CUTS = [/_*@_*You_currently_have_\$_slot_unlocks_left,_use_them_wisely!/, /\+\$_/];
const textOf = ({ description }) => CUTS.reduce((out, re) => out.replace(re, ''), dropReadout(description));

// UPKEEP: the levelled `$` the panel computes per id (N.js:122502, JellyOperation.js:228-229): Viral Injection (15) and Cell
// Mutilation (17) round(1 + L), Stronkroid (29) 1 + (50 + L) / 100, Lower Cholesterol (34) the cost discount. Cell Metabolism (32)
// and Cell Dialysis (33) print only a Total bonus tail, which dropReadout removes.
const DOLLAR = {
  15: { formula: 'growth', args: { func: 'bigBase', x1: 1, x2: 1 } },
  17: { formula: 'growth', args: { func: 'bigBase', x1: 1, x2: 1 } },
  29: { formula: 'growth', args: { func: 'bigBase', x1: 1.5, x2: 0.01 } },
  34: { formula: 'diminishingPercentRounded', args: { perLevel: 1 } }
};

const row = {
  kind: 'jellyupgrade',
  // UPKEEP: research[44] is the shop order (N.js:72886); cost and Research level follow the position, art the id.
  section: (data) => {
    const ids = data.research[44].map(Number).filter((id) => data.jellyUpgrades[id]);
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
  effect: (entry) => ({
    levelLabel: 'Upgrade level',
    cap: entry.max < UNCAPPED_FROM ? entry.max : null,
    // UPKEEP: `{` is CommaNotation(perLevel x L) and `}` MultiplierInfo(1 + perLevel x L / 100) (N.js:122502).
    terms: [
      { token: '{', formula: 'linear', args: { perLevel: entry.perLevel } },
      { token: '}', formula: 'growth', args: { func: 'bigBase', x1: 1, x2: entry.perLevel / 100 } },
      ...(DOLLAR[entry.id] ? [{ token: '$', ...DOLLAR[entry.id] }] : [])
    ]
  }),
  // The panel prints NotateNumber(cost, "Big") (N.js:122503). Lower Cholesterol discounts it, so the default note stands only as
  // the base price.
  cost: (entry) => ({
    formula: 'notateBig',
    args: { formula: 'pow', args: { base: baseOf(entry.position, entry.costMulti), rate: entry.rate } },
    currency: 'Bloodcells'
  }),
  fields: (entry) => [
    { label: 'Research level needed', value: researchLevelOf(entry.position) },
    // The shop unlocks each position once the one before it is bought.
    ...(entry.previous
      ? [linked({ label: 'Unlocked by', value: `${spaced(entry.previous)} at level 1` }, 'unlockedBy', nodeId(row, { id: entry.previousId }))]
      : [])
  ]
};

export default row;
