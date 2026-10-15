import { linked } from '../../../../utility/wiki/field-links.mjs';
import { nodeId } from '../links.mjs';
import { levelCap } from '../cap.mjs';

// UPKEEP: buying Megaflesh zeroes every upgrade except Bubba Boon (3), Megaflesh (8) and Fun Gifts (9) (N.js:120129).
const MEGAFLESH = 8;
const KEEPS = new Set([3, MEGAFLESH, 9]);
// UPKEEP: the buy check skips a max of exactly 999 (`999 ==`, N.js:120111), so it never stops a purchase; only the price, which
// overflows to ∞ at a level of its own, does.
const NO_MAX = 999;
// UPKEEP: the panel's account readouts and timers (N.js:119651): Happi Boi's pats per hour and next-pat timer (1), Dice Roll's
// price reset timer (12), the Smoker's smoking time (15), and More Sides' highest roll, a `$` the panel never fills (16).
const CUTS = [
  /_\$_times_per_hour(?=,)/,
  /_*@_*Your_next_pats_come_in_~/,
  /_*@_*Price_resets_in_~/,
  /_*@_*Your_smoker_has_been_smoking_for_~/,
  /,_so_your_highest_possible_dice_roll_is_now_\$/
];
// UPKEEP: the upgrades whose `$` is the cheaper-upgrades percent, Bargain (4), Cost Saver (18) and Perma Sale (26) (N.js:119651).
const DISCOUNTS = new Set([4, 18, 26]);
// UPKEEP: Buyer Grin's `$` (5) is DailyPet_HappinessFromUpg, min(1, b) + 2b / (b + 200) (Bubbastuff.js:83-90), before the Real Love,
// Charisma and gift happiness multipliers; min(1, b) is 1 from level 1.
const BUYER_GRIN = { formula: 'affineDecay', args: { base: 1, scale: 2, offset: 200 } };

const dollarOf = (id, perLevel) => {
  if (DISCOUNTS.has(id)) return { formula: 'diminishingPercent', args: { perLevel } };
  return id === 5 ? BUYER_GRIN : null;
};

const row = {
  kind: 'bubbaupgrade',
  section: 'bubbaUpgrades',
  key: (entry, index) => `BubbaUpg${index}`,
  icon: (entry, index) => `/etc/Bubbo_Upgrade_${index}.png`,
  fallbackIcon: '/etc/Bubba_0.png',
  describe: (entry) => CUTS.reduce((out, re) => out.replace(re, ''), entry.description),
  effect: (entry, index) => {
    const dollar = dollarOf(index, entry.x3);
    return {
      levelLabel: 'Upgrade level',
      ...levelCap(entry.x4, entry.x4 === NO_MAX),
      // UPKEEP: `{` is CommaNotation(x3 x L) and `}` MultiplierInfo(1 + x3 x L / 100) (N.js:119651).
      terms: [
        { token: '{', formula: 'linear', args: { perLevel: entry.x3 } },
        { token: '}', formula: 'growth', args: { func: 'bigBase', x1: 1, x2: entry.x3 / 100 } },
        ...(dollar ? [{ token: '$', ...dollar }] : [])
      ]
    };
  },
  // UPKEEP: Bubbastuff.js:47-57 prices upgrade t at x1 x ((t + 1)^2 L + (2.4 + t / 3.65)^t x2^L); Bargain, Cost Saver, Perma Sale,
  // a Minehead opponent and Charisma discount it.
  cost: (entry, index) => ({
    formula: 'linearPlusPow',
    args: { scale: entry.x1, perLevel: (index + 1) ** 2, base: (2.4 + index / 3.65) ** index, rate: entry.x2 },
    currency: 'Meat Slices',
    currencyOne: 'Meat Slice'
  }),
  fields: (entry, index) => (KEEPS.has(index)
    ? []
    : [linked({ label: 'Megaflesh', value: 'Resets to level 0 when you buy Megaflesh' }, 'resetBy', nodeId(row, null, MEGAFLESH))])
};

export default row;
