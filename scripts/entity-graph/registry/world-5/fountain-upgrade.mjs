import { tidy } from '../text.mjs';
import { COIN_NAMES } from './schematic.mjs';

// UPKEEP: water t of HoleFountUPG, named by the colour it runs on (the-fountain.ts dynamicName).
const WATERS = ['Blue', 'Yellow', 'Green'];
// UPKEEP: own-level `$` in ten texts (the-fountain.ts helpers); every other `$ # ^` is an account readout and its `@` segment is dropped.
const OWN_DOLLAR = {
  '0_8': { formula: 'affineDecay', args: { base: 10, scale: 50, offset: 100 } },
  // UPKEEP: getSpacesOwned (the-fountain.ts:164) is min(16, 1 + L).
  '0_10': { formula: 'affineCapped', args: { base: 1, perLevel: 1, max: 16 } },
  // UPKEEP: getMaxStackSize (the-fountain.ts:166) is min(50, 3 + L + ...); the other terms are account bonuses.
  '0_11': { formula: 'affineCapped', args: { base: 3, perLevel: 1, max: 50 } },
  '0_12': { formula: 'growth', args: { func: 'bigBase', x1: 5, x2: 0.1 } },
  '1_8': { formula: 'inverseLinear', args: { base: 300, perLevel: 0.01 } },
  '1_9': { formula: 'growth', args: { func: 'bigBase', x1: 5, x2: 0.1 } },
  '1_10': { formula: 'growth', args: { func: 'bigBase', x1: 100, x2: 5 } },
  '2_8': { formula: 'inverseLinear', args: { base: 1000, perLevel: 0.01 } },
  '2_9': { formula: 'growth', args: { func: 'bigBase', x1: 25, x2: 1 } },
  '2_12': { formula: 'inverseLinear', args: { base: 3, perLevel: 0.05 } }
};
// UPKEEP: Fountain_UpgUnlocked (Holes2.js:171): the prereq at 10, or at 1 for water 0 slots 2 and 14.
const EARLY_UNLOCK = new Set(['0_2', '0_14']);

const id = (entry) => `${entry.water}_${entry.slot}`;
// Split on `@`, keep the segments with no account readout left in them. A label ending in ":" and a "(...)" aside belong to the
// readout after them ("Your total Currency multi: ^ (Affects value of all Fountain money)"), so they go too.
// UPKEEP: checked on all 60 texts; 15 change, and each keeps its first sentence.
const neutral = (entry) => String(entry.description).split(/_*@_*/)
  .filter((part) => part && !/Total_(Ducky_)?Bonus|Total_Currency|:\$/i.test(part))
  .filter((part) => !/[#^鉢]/.test(part) && (!part.includes('$') || OWN_DOLLAR[id(entry)]))
  .filter((part) => !/:$/.test(part) && !/^\(/.test(part))
  .join('@');

const NO_DISCOUNT = 'No discounts apply.';
// Every coin name is a plural ending in "s" (Coins, Bills, Stacks): dropping it gives the singular for a cost of 1.
const moneyOf = (entry) => ({ currency: COIN_NAMES[entry.currencyType], currencyOne: COIN_NAMES[entry.currencyType]?.replace(/s$/, '') });

export default {
  kind: 'fountainupgrade',
  section: (data) => (data.holeFountUpg || []).flatMap((water, t) => water.map((upgrade, i) => ({ ...upgrade, water: t, slot: i }))),
  key: (entry) => `Fountain${entry.water}_${entry.slot}`,
  icon: (entry) => `/data/HoleFountainUpg${entry.water}_${entry.slot}.png`,
  fallbackIcon: '/etc/Cavern_15.png',
  describe: (entry) => neutral(entry),
  // No cap: the game's cost has none, and level 10 only unlocks the next upgrades.
  effect: (entry) => ({
    levelLabel: 'Upgrade level',
    cap: null,
    terms: [
      { token: '{', formula: 'linear', args: { perLevel: entry.bonusPerLevel } },
      { token: '}', formula: 'growth', args: { func: 'bigBase', x1: 1, x2: entry.bonusPerLevel / 100 } },
      ...(OWN_DOLLAR[id(entry)] ? [{ token: '$', ...OWN_DOLLAR[id(entry)] }] : [])
    ]
  }),
  // UPKEEP: Cost_FountainUPG (Holes2.js:179): a base cost of 1 means (L + 1) * costMulti^L, else baseCost * costMulti^L.
  cost: (entry) => (entry.baseCost === 1
    ? { formula: 'linearPowFromOne', args: { base: 1, rate: entry.costMulti }, ...moneyOf(entry), note: NO_DISCOUNT }
    : { formula: 'pow', args: { base: entry.baseCost, rate: entry.costMulti }, ...moneyOf(entry), note: NO_DISCOUNT }),
  fields: (entry, index, data) => {
    const prereq = data.holeFountUpg?.[entry.water]?.[entry.prereqIndex];
    return [
      { label: 'Water', value: `${WATERS[entry.water]} water` },
      ...(prereq ? [{ label: 'Unlocked by', value: `${tidy(prereq.name).replace(/_/g, ' ')} at level ${EARLY_UNLOCK.has(id(entry)) ? 1 : 10}` }] : [])
    ];
  }
};
