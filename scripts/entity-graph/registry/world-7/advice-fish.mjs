import { formatAmount } from '../../../../utility/wiki/effects.mjs';

// UPKEEP: the packed string is "Name,text,value,costExp,filler"; no text holds a comma today (generalSpelunky[18]).
const fishOf = (packed) => {
  const [name, description, value, costExp] = packed.split(',');
  return { name, description, value: Number(value), costExp: Number(costExp) };
};
// UPKEEP: BigFishUpgLVREQ is 4000 + (300 + 50 max(0, t - 2)) t (Spelunk.js:700); the panel prints "Account LV N Required" (N.js:218018).
const levelRequired = (t) => 4000 + (300 + 50 * Math.max(0, t - 2)) * t;
// UPKEEP: BigFishBonus ceils to hundredths (N.js:218019, Spelunk.js:673-686). The game multiplies L / (100 + L) by the value where
// `growth` divides value x L, so the ceiling differs by 0.01 at a handful of levels (L1150 on Life and Death: game 9.21, wiki 9.2).
const HUNDREDTHS = 2;
const DECAY_HALF = 100;
// UPKEEP: BigFishCost is 1.15^L x 10.01^costExp coins, with no discounts (Spelunk.js:687-690).
const COST_RATE = 1.15;
const COST_BASE = 10.01;

export default {
  kind: 'advicefish',
  section: (data) => data.generalSpelunky[18].map(fishOf),
  key: (entry, index) => `AdviceFish${index}`,
  // No per-fish art exists: the Advice Fish tile stands in.
  fallbackIcon: '/data/W7_fish.png',
  effect: (entry) => ({
    levelLabel: 'Upgrade level',
    cap: null,
    terms: [
      { token: '{', formula: 'rounded', args: { formula: 'growth', args: { func: 'decay', x1: entry.value, x2: DECAY_HALF }, mode: 'ceil', digits: HUNDREDTHS } },
      { token: '}', formula: 'rounded', args: { formula: 'growth', args: { func: 'decayMulti', x1: entry.value / 100, x2: DECAY_HALF }, mode: 'ceil', digits: HUNDREDTHS } }
    ]
  }),
  cost: (entry) => ({
    formula: 'pow',
    args: { base: Math.pow(COST_BASE, entry.costExp), rate: COST_RATE },
    currency: 'Coins',
    note: 'No discounts apply.'
  }),
  // UPKEEP: the first fish has no account level gate (isBigFishUpgUnlocked, Spelunk.js:698: 0 == t).
  fields: (entry, index) => (index > 0 ? [{ label: 'Account level needed', value: formatAmount(levelRequired(index)) }] : [])
};
