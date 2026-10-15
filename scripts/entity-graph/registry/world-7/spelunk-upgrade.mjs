import { formatAmount } from '../../../../utility/wiki/effects.mjs';
import { linked } from '../../../../utility/wiki/field-links.mjs';
import { gameTable } from '../data.mjs';
import { nodeId } from '../links.mjs';
import { dropReadout, spaced } from '../text.mjs';

// The spelunkShopCost table (Spelunk ShopUpgCost): x7/x8 are the shop column and row, and cost columnFactor^x7 x rowFactor^x8;
// each tier from its row on multiplies by its factor.
const tierOf = (index, shop) => shop.tiers.reduce((factor, tier) => factor * (index >= tier.from ? tier.factor : 1), 1);
const baseOf = (entry, index, shop) => entry.x1 * Math.pow(shop.columnFactor, entry.x7) * Math.pow(shop.rowFactor, entry.x8) * tierOf(index, shop);
// The spelunkShopPanel table (N.js:118794): the shop prints the price rounded up while both it and the Amber owned are below
// costBelow and amberBelow, else NotateNumber "Big"; the wiki shows the low-Amber reading, so only costBelow applies.
// Without it no price is printed: a price without the round-up is not what the shop shows.
const ceilBelow = (data) => gameTable(data, 'spelunkShopPanel')?.costBelow ?? null;
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
// The `$` / `~` values that are a pure function of the level, by table index: the spelunkSpecialFills table (Spelunk
// ShopUpgBonus rewrites, OverstimBonus_PerLV, ExaltDropChance, PrismaDropChance, GrandDiscoveries_FindChance and the shop
// panel's `$` fills) holds the numbers, x4 the per-level step. The formula each row takes stays here.
const SPECIAL = {
  6: (fill, x4) => ({ token: '$', formula: 'growth', args: { func: 'bigBase', x1: fill.base, x2: x4 } }),
  7: (fill, x4) => ({ token: '~', formula: 'decayPowTenths', args: { base: fill.base, scale: fill.scale, offset: fill.half / x4 } }),
  // The game also floors at `floor`, which the cap keeps out of reach.
  19: (fill, x4) => ({ token: '$', formula: 'growth', args: { func: 'reduce', x1: fill.start, x2: x4 } }),
  21: (fill, x4) => ({ token: '$', formula: 'growth', args: { func: 'bigBase', x1: fill.base, x2: (fill.scale * x4) / fill.percent } }),
  25: (fill, x4) => ({ token: '$', formula: 'growth', args: { func: 'bigBase', x1: fill.base, x2: x4 } }),
  27: (fill, x4) => ({ token: '$', formula: 'inverseLinear', args: { base: fill.base, perLevel: x4 / 100 } }),
  28: (fill, x4) => ({ token: '$', formula: 'inverseLinear', args: { base: fill.base, perLevel: x4 / 100 } }),
  38: (fill, x4) => ({ token: '$', formula: 'growth', args: { func: 'bigBase', x1: fill.base, x2: x4 } }),
  // The panel prints CommaNotation(1 / chance); 1 / 4e-5 is 24999.999999999996 in JS, so the base is the level-0 odds rounded.
  43: (fill, x4) => ({ token: '$', formula: 'inverseLinear', args: { base: Math.round(1 / fill.chance), perLevel: x4 / 100 } })
};
const specialOf = (entry, index, data) => {
  const fill = SPECIAL[index] ? gameTable(data, 'spelunkSpecialFills')?.[index] : null;
  return fill ? [SPECIAL[index](fill, entry.x4)] : [];
};
// The spelunkOddsNotes table (Spelunk ExaltDropChance, PrismaDropChance): how much rarer each find makes the next.
// UPKEEP: the word for what each row's odds handler finds. Not extracted: the handlers hold only the odds, never a name
// for the find.
const RARER = { 27: 'fragment', 28: 'bubble' };
// UPKEEP: row 43's note. Not extracted: the sentence is prose with no number in it.
const GRAND_DISCOVERY_NOTE = 'Before other Grand Discovery chance bonuses';
const GRAND_DISCOVERY = 43;
const oddsOf = (index, data) => {
  if (index === GRAND_DISCOVERY) return GRAND_DISCOVERY_NOTE;
  const odds = RARER[index] ? gameTable(data, 'spelunkOddsNotes')?.[index] : null;
  return odds ? `Each ${RARER[index]} found makes the next ${odds.rarerPerFind}x rarer` : null;
};
// The amberDenominator table (Spelunk AmberDenominator): each Amber colour's worth in orange once its row is owned.
// UPKEEP: the colour names, lowest first. Not extracted: the handler holds only rows and worths, no names.
const AMBER_COLOURS = ['Blue', 'Green', 'Red', 'Pink'];
const worthText = (worth) => (worth < 1e9 ? formatAmount(worth) : worth.toExponential().replace('e+', 'e'));
const listed = (words) => `${words.slice(0, -1).join(', ')} or ${words.at(-1)}`;
const amberNote = (data) => {
  const tiers = gameTable(data, 'amberDenominator')?.tiers;
  return tiers?.length === AMBER_COLOURS.length
    ? ` Once you deal in ${listed(AMBER_COLOURS)} Amber, the shop shows the price divided by that colour's worth: ${listed(tiers.map(({ worth }) => worthText(worth)))} orange.`
    : '';
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
  effect: (entry, index, data) => ({
    levelLabel: 'Upgrade level',
    // UPKEEP: the buy check is level < ShopUpgMaxLV, which is x3 (ShopUpgBuyable, N.js:107384, 107378), so 99999 is a real cap even
    // though the shop prints "/max" only below 9999 (N.js:118773).
    cap: entry.x3,
    // UPKEEP: `{` is CommaNotation(x4 x L) and `}` MultiplierInfo(1 + x4 x L / 100) (N.js:118773).
    // Not extracted: the panel's print rule is draw code, which no locator may anchor on.
    terms: [
      { token: '{', formula: 'linear', args: { perLevel: entry.x4 } },
      { token: '}', formula: 'growth', args: { func: 'bigBase', x1: 1, x2: entry.x4 / 100 } },
      ...specialOf(entry, index, data)
    ]
  }),
  cost: (entry, index, data) => {
    const shop = gameTable(data, 'spelunkShopCost');
    const below = ceilBelow(data);
    return shop && below !== null
      ? {
        formula: 'spelunkShopCost',
        args: { base: baseOf(entry, index, shop), rate: entry.x2, below },
        currency: 'Amber',
        note: `Base cost in orange Amber, before discounts.${amberNote(data)} The total to max leaves out the unlock cost.`
      }
      : null;
  },
  fields: (entry, index, data) => {
    const shop = gameTable(data, 'spelunkShopCost');
    const below = ceilBelow(data);
    // The unlock is level unlockLevel, which costs (levelOffset + unlockLevel) x base, printed like any cost.
    const unlock = shop && below !== null ? (shop.levelOffset + shop.unlockLevel) * baseOf(entry, index, shop) : null;
    return [
      unlock === null ? null : { label: 'Unlock cost', value: `${formatAmount(unlock < below ? Math.ceil(unlock) : unlock)} Amber` },
      // UPKEEP: row 0 always shows; any other shows once its x6 prerequisite is unlocked (Spelunk.js:228-229).
      index > 0
        ? linked({ label: 'Shown after unlocking', value: spaced(data.spelunkingUpgrades[entry.x6]?.name) }, 'unlockedBy', nodeId(row, null, entry.x6))
        : null,
      { label: 'Odds', value: oddsOf(index, data) }
    ].filter(Boolean);
  }
};

export default row;
