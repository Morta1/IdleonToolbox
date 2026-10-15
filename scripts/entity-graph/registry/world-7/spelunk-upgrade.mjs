import { formatAmount } from '../../../../utility/wiki/effects.mjs';
import { linked } from '../../../../utility/wiki/field-links.mjs';
import { nodeId } from '../links.mjs';
import { dropReadout, spaced } from '../text.mjs';

// UPKEEP: ShopUpgCost (Spelunk.js:234): columns x7/x8 are the shop column and row, and cost factors 9.5^x7 x 6.3^x8.
const COLUMN_FACTOR = 9.5;
const ROW_FACTOR = 6.3;
// UPKEEP: rows from 52 cost 1e7x more, rows from 66 another 1e9x (Spelunk.js:234-268).
const tierOf = (index) => (index >= 52 ? 1e7 : 1) * (index >= 66 ? 1e9 : 1);
const baseOf = (entry, index) => entry.x1 * Math.pow(COLUMN_FACTOR, entry.x7) * Math.pow(ROW_FACTOR, entry.x8) * tierOf(index);
// UPKEEP: the shop prints the price rounded up while both it and the Amber owned are below 1e5, else NotateNumber "Big" (N.js:118794); the wiki shows the low-Amber reading.
const CEIL_BELOW = 1e5;
// UPKEEP: the unlock (level -1) costs (10 - 1) x base (Spelunk.js:265), printed like any cost.
const UNLOCK_FACTOR = 9;
// UPKEEP: the account readouts the panel fills in (N.js:118774-118794); each cut keeps the sentence's own punctuation.
const CUTS = [
  [/_*\(You_have_\^_[^)]*\)/, ''],
  [/_*\(\^_Depths\)/, ''],
  [/,_which_is_currently_\^/, ''],
  [/_*@_*The_current_regen_rate_is_\$\/hr/, ''],
  [/_*@_*You've_found_#_of_these_so_far\./, ''],
  [/,_which_is_the_\$_that_does_#x_Damage!/, '.']
];
const cleaned = (text) => CUTS.reduce((out, [re, replacement]) => out.replace(re, replacement), dropReadout(text));
// UPKEEP: the `$` / `~` values that are a pure function of the level, by table index (N.js:118794, Spelunk.js:276-372).
const SPECIAL = {
  6: { token: '$', formula: 'growth', args: { func: 'bigBase', x1: 30, x2: 1 } },
  7: { token: '~', formula: 'decayPowTenths', args: { base: 15, scale: 45, offset: 10 } },
  19: { token: '$', formula: 'growth', args: { func: 'reduce', x1: 50, x2: 2 } },
  21: { token: '$', formula: 'growth', args: { func: 'bigBase', x1: 1, x2: 0.07 } },
  25: { token: '$', formula: 'growth', args: { func: 'bigBase', x1: 1, x2: 1 } },
  27: { token: '$', formula: 'inverseLinear', args: { base: 60, perLevel: 0.02 } },
  28: { token: '$', formula: 'inverseLinear', args: { base: 100, perLevel: 0.02 } },
  38: { token: '$', formula: 'growth', args: { func: 'bigBase', x1: 20, x2: 1 } },
  43: { token: '$', formula: 'inverseLinear', args: { base: 25000, perLevel: 0.01 } }
};
// UPKEEP: the odds notes for the two finds that grow rarer per find and the Grand Discovery base (Spelunk.js:351-369, 542).
const ODDS = {
  27: 'Each fragment found makes the next 8x rarer',
  28: 'Each bubble found makes the next 1.5x rarer',
  43: 'Before other Grand Discovery chance bonuses'
};
// UPKEEP: row 30's name is font glyphs (由[申由?-由申~[申), not text.
const GLYPH_NAMED = 30;

const row = {
  kind: 'spelunkupgrade',
  section: 'spelunkingUpgrades',
  // UPKEEP: keyed by table position, the save's Spelunk[5] slot and the CaveShopUpg<i> art.
  key: (entry, index) => `SpelunkUpg${index}`,
  icon: (entry, index) => `/data/CaveShopUpg${index}.png`,
  fallbackIcon: '/etc/Spelunking.png',
  skip: (entry, index) => (index === GLYPH_NAMED ? 'placeholder: name is glyph art' : false),
  describe: (entry) => cleaned(entry.description),
  effect: (entry, index) => ({
    levelLabel: 'Upgrade level',
    // UPKEEP: the buy check is level < ShopUpgMaxLV, which is x3 (ShopUpgBuyable, N.js:107384, 107378), so 99999 is a real cap even
    // though the shop prints "/max" only below 9999 (N.js:118773).
    cap: entry.x3,
    // UPKEEP: `{` is CommaNotation(x4 x L) and `}` MultiplierInfo(1 + x4 x L / 100) (N.js:118773).
    terms: [
      { token: '{', formula: 'linear', args: { perLevel: entry.x4 } },
      { token: '}', formula: 'growth', args: { func: 'bigBase', x1: 1, x2: entry.x4 / 100 } },
      ...(SPECIAL[index] ? [SPECIAL[index]] : [])
    ]
  }),
  // UPKEEP: AmberDenominator is 1, 1e3, 1e9, 1e21 or 1e36 once rows 20, 41, 51, 66 are owned (Spelunk.js:410-419).
  cost: (entry, index) => ({
    formula: 'spelunkShopCost',
    args: { base: baseOf(entry, index), rate: entry.x2, below: CEIL_BELOW },
    currency: 'Amber',
    note: 'Base cost in orange Amber, before discounts. Once you deal in Blue, Green, Red or Pink Amber, the shop shows the price divided by that colour\'s worth: 1,000, 1e9, 1e21 or 1e36 orange. The total to max leaves out the unlock cost.'
  }),
  fields: (entry, index, data) => {
    const unlock = UNLOCK_FACTOR * baseOf(entry, index);
    return [
      { label: 'Unlock cost', value: `${formatAmount(unlock < CEIL_BELOW ? Math.ceil(unlock) : unlock)} Amber` },
      // UPKEEP: row 0 always shows; any other shows once its x6 prerequisite is unlocked (Spelunk.js:228-229).
      index > 0
        ? linked({ label: 'Shown after unlocking', value: spaced(data.spelunkingUpgrades[entry.x6]?.name) }, 'unlockedBy', nodeId(row, null, entry.x6))
        : null,
      ODDS[index] ? { label: 'Odds', value: ODDS[index] } : null
    ].filter(Boolean);
  }
};

export default row;
