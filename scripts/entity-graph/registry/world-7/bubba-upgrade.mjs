import { linked } from '../../../../utility/wiki/field-links.mjs';
import { gameTable } from '../data.mjs';
import { nodeId } from '../links.mjs';
import { levelCap } from '../cap.mjs';

// The bubbaReset table, _customEvent_Bubbathings: buying Megaflesh zeroes every upgrade except the keeps (N.js:120129), and the
// buy check skips a max of exactly noMax (N.js:120111), so it never stops a purchase; only the price, which overflows to ∞ at a
// level of its own, does. No table, no Megaflesh field and no cap.
const capOf = (max, data) => {
  const reset = gameTable(data, 'bubbaReset');
  return reset ? levelCap(max, max === reset.noMax) : {};
};
// UPKEEP: the panel's account readouts and timers (N.js:119651): Happi Boi's pats per hour and next-pat timer (1), Dice Roll's
// price reset timer (12), the Smoker's smoking time (15), and More Sides' highest roll, a `$` the panel never fills (16).
const CUTS = [
  /_\$_times_per_hour(?=,)/,
  /_*@_*Your_next_pats_come_in_~/,
  /_*@_*Price_resets_in_~/,
  /_*@_*Your_smoker_has_been_smoking_for_~/,
  /,_so_your_highest_possible_dice_roll_is_now_\$/
];
// The `$` of the upgrades the bubbaPanelDiscounts table names is the floored cheaper-upgrades percent (N.js:119651). Buyer
// Grin's (the bubbaHappinessFromUpgrade table's `upgrade`) is DailyPet_HappinessFromUpg, min(1, b) + scale b / (b + offset)
// (N.js:107554), before the Real Love, Charisma and gift happiness multipliers; min(1, b) is the base from level 1.
const dollarOf = (id, perLevel, data) => {
  if (gameTable(data, 'bubbaPanelDiscounts')?.includes(id)) return { formula: 'diminishingPercent', args: { perLevel } };
  const grin = gameTable(data, 'bubbaHappinessFromUpgrade');
  return grin && id === grin.upgrade ? { formula: 'affineDecay', args: { base: grin.base, scale: grin.scale, offset: grin.offset } } : null;
};

const row = {
  kind: 'bubbaupgrade',
  section: 'bubbaUpgrades',
  key: (entry, index) => `BubbaUpg${index}`,
  icon: (entry, index) => `/etc/Bubbo_Upgrade_${index}.png`,
  fallbackIcon: '/etc/Bubba_0.png',
  describe: (entry) => CUTS.reduce((out, re) => out.replace(re, ''), entry.description),
  effect: (entry, index, data) => {
    const dollar = dollarOf(index, entry.x3, data);
    return {
      levelLabel: 'Upgrade level',
      ...capOf(entry.x4, data),
      // UPKEEP: `{` is CommaNotation(x3 x L) and `}` MultiplierInfo(1 + x3 x L / 100) (N.js:119651). Not extracted: the token print
      // rule is panel draw code (owner list: panel print rules).
      terms: [
        { token: '{', formula: 'linear', args: { perLevel: entry.x3 } },
        { token: '}', formula: 'growth', args: { func: 'bigBase', x1: 1, x2: entry.x3 / 100 } },
        ...(dollar ? [{ token: '$', ...dollar }] : [])
      ]
    };
  },
  // The bubbaUpgradeCost table, Bubbastuff:UpgCost (N.js:107547): upgrade t costs x1 x ((t + indexOffset)^indexPower L
  // + (rateBase + t / rateDivisor)^t x2^L); Bargain, Cost Saver, Perma Sale, a Minehead opponent and Charisma discount it. No table,
  // no price.
  cost: (entry, index, data) => {
    const price = gameTable(data, 'bubbaUpgradeCost');
    return price
      ? {
        formula: 'linearPlusPow',
        args: {
          scale: entry.x1,
          perLevel: (index + price.indexOffset) ** price.indexPower,
          base: (price.rateBase + index / price.rateDivisor) ** index,
          rate: entry.x2
        },
        currency: 'Meat Slices',
        currencyOne: 'Meat Slice',
        // A font glyph in the game; the site's own meat slice, as the Bubba account page shows it.
        currencyIcon: '/etc/Bubba_0.png'
      }
      : null;
  },
  fields: (entry, index, data) => {
    const reset = gameTable(data, 'bubbaReset');
    return !reset || reset.keeps.includes(index)
      ? []
      : [linked({ label: 'Megaflesh', value: 'Resets to level 0 when you buy Megaflesh' }, 'resetBy', nodeId(row, null, reset.megaflesh))];
  }
};

export default row;
