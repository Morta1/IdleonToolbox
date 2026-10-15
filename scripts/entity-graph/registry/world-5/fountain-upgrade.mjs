import { linked } from '../../../../utility/wiki/field-links.mjs';
import { nodeId } from '../links.mjs';
import { tidy } from '../text.mjs';
import { gameTable } from '../data.mjs';
import { coinNames } from './schematic.mjs';

// UPKEEP: water t of HoleFountUPG, named by the colour it runs on (the-fountain.ts dynamicName). Not extracted: the game
// never writes the colour words as text; each water is told apart by its art.
const WATERS = ['Blue', 'Yellow', 'Green'];
// Own-level `$` in ten texts, from the fountainBonuses, fountainSpaces and fountainStack tables (the Holes2 helpers named
// in each), keyed water_slot; every other `$ # ^` is an account readout and its `@` segment is dropped. Each helper's
// Fountain_BonTOT is L * bonusPerLevel, so the per-level arg folds it in.
const HELPERS = {
  // 0.1 + 0.5 B / (100 + B), as a percent: the offset over bonusPerLevel keeps L as the level.
  Fount_CurrencyKEEP: ({ base, scale, offset }, per) => ({ formula: 'affineDecay', args: { base: base * 100, scale: scale * 100, offset: offset / per } }),
  // 1 + min(cap, capScale B) + B / divisor: read as base + cap from level 1, so only when level 1 already reaches the cap.
  FountainBar_ActiveSpdMulti: ({ base, cap, capScale, divisor }, per) => (capScale * per >= cap
    ? { formula: 'growth', args: { func: 'bigBase', x1: base + cap, x2: per / divisor } }
    : null),
  Fount_RoyalChance: ({ chance, divisor }, per) => ({ formula: 'inverseLinear', args: { base: 1 / chance, perLevel: per / divisor } }),
  Fount_RoyalMulti: ({ base, divisor }, per) => ({ formula: 'growth', args: { func: 'bigBase', x1: base, x2: per / divisor } }),
  Fount_MarblePerFill: ({ base, divisor }, per) => ({ formula: 'growth', args: { func: 'bigBase', x1: base, x2: (base * per) / divisor } }),
  Fount_LuckyCoinChance: ({ chance, divisor }, per) => ({ formula: 'inverseLinear', args: { base: 1 / chance, perLevel: per / divisor } }),
  Fount_LuckyCoinValuePER: ({ base }, per) => ({ formula: 'growth', args: { func: 'bigBase', x1: base, x2: per } }),
  Fount_DuckChance: ({ chance, divisor }, per) => ({ formula: 'inverseLinear', args: { base: 1 / chance, perLevel: per / divisor } })
};
// min(max, base + B): the other MaxStackSize terms are account bonuses.
const capped = ({ base, max }, per) => ({ formula: 'affineCapped', args: { base, perLevel: per, max } });
const ownDollar = (entry, data) => {
  const at = (table) => table && table.water === entry.water && table.slot === entry.slot;
  const per = entry.bonusPerLevel;
  for (const [helper, table] of Object.entries(gameTable(data, 'fountainBonuses') || {})) {
    if (HELPERS[helper] && at(table)) return HELPERS[helper](table, per);
  }
  const spaces = gameTable(data, 'fountainSpaces');
  if (at(spaces)) return capped(spaces, per);
  const stack = gameTable(data, 'fountainStack');
  return at(stack) ? capped(stack, per) : null;
};
// The fountainUnlock table (Holes2 Fountain_UpgUnlocked): the prereq at `level`, or at the early level for the early slots.
const unlockLevel = (entry, data) => {
  const unlock = gameTable(data, 'fountainUnlock');
  if (!unlock) return null;
  const { early } = unlock;
  return early.water === entry.water && early.slots.includes(entry.slot) ? early.level : unlock.level;
};

// Split on `@`, keep the segments with no account readout left in them. A label ending in ":" and a "(...)" aside belong to the
// readout after them ("Your total Currency multi: ^ (Affects value of all Fountain money)"), so they go too.
// UPKEEP: checked on all 60 texts; 15 change, and each keeps its first sentence.
const neutral = (entry, data) => String(entry.description).split(/_*@_*/)
  .filter((part) => part && !/Total_(Ducky_)?Bonus|Total_Currency|:\$/i.test(part))
  .filter((part) => !/[#^鉢]/.test(part) && (!part.includes('$') || ownDollar(entry, data)))
  .filter((part) => !/:$/.test(part) && !/^\(/.test(part))
  .join('@');

const NO_DISCOUNT = 'No discounts apply.';
// UPKEEP: every coin name is a plural ending in "s" (Coins, Bills, Stacks): dropping it gives the singular for a cost of 1.
const moneyOf = (entry, data) => {
  const coin = coinNames(data)[entry.currencyType];
  return { currency: coin, currencyOne: coin?.replace(/s$/, '') };
};

const row = {
  kind: 'fountainupgrade',
  section: (data) => (data.holeFountUpg || []).flatMap((water, t) => water.map((upgrade, i) => ({ ...upgrade, water: t, slot: i }))),
  key: (entry) => `Fountain${entry.water}_${entry.slot}`,
  icon: (entry) => `/data/HoleFountainUpg${entry.water}_${entry.slot}.png`,
  fallbackIcon: '/etc/Cavern_15.png',
  describe: (entry, index, data) => neutral(entry, data),
  // No cap: the game's cost has none, and level 10 only unlocks the next upgrades.
  effect: (entry, index, data) => {
    const dollar = ownDollar(entry, data);
    return {
      levelLabel: 'Upgrade level',
      cap: null,
      terms: [
        { token: '{', formula: 'linear', args: { perLevel: entry.bonusPerLevel } },
        { token: '}', formula: 'growth', args: { func: 'bigBase', x1: 1, x2: entry.bonusPerLevel / 100 } },
        ...(dollar ? [{ token: '$', ...dollar }] : [])
      ]
    };
  },
  // The fountainCost table (Holes2 Cost_FountainUPG): a base cost of linearBaseCost means (L + 1) * costMulti^L, else
  // baseCost * costMulti^L. No table, no price.
  cost: (entry, index, data) => {
    const rule = gameTable(data, 'fountainCost');
    if (!rule) return null;
    return entry.baseCost === rule.linearBaseCost
      ? { formula: 'linearPowFromOne', args: { base: 1, rate: entry.costMulti }, ...moneyOf(entry, data), note: NO_DISCOUNT }
      : { formula: 'pow', args: { base: entry.baseCost, rate: entry.costMulti }, ...moneyOf(entry, data), note: NO_DISCOUNT };
  },
  fields: (entry, index, data) => {
    const prereq = data.holeFountUpg?.[entry.water]?.[entry.prereqIndex];
    const level = unlockLevel(entry, data);
    return [
      { label: 'Water', value: `${WATERS[entry.water]} water` },
      ...(prereq
        ? [linked(
          { label: 'Unlocked by', value: `${tidy(prereq.name).replace(/_/g, ' ')}${level === null ? '' : ` at level ${level}`}` },
          'unlockedBy',
          nodeId(row, { ...prereq, water: entry.water, slot: entry.prereqIndex })
        )]
        : [])
    ];
  }
};

export default row;
