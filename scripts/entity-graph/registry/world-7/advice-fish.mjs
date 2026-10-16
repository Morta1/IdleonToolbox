import { gameTable, listAt } from '../data.mjs';

// UPKEEP: the packed string is "Name,text,value,costExp,filler"; no text holds a comma today (listIndexes.bigFish).
const fishOf = (packed) => {
  const [name, description, value, costExp] = packed.split(',');
  return { name, description, value: Number(value), costExp: Number(costExp) };
};
// The bigFishLevelReq table (Spelunk BigFishUpgLVREQ): base + (perFish + extraPerFish max(0, t - extraFrom)) t; the panel
// prints "Account LV N Required" (N.js:218018).
const levelRequired = (t, req) => req.base + (req.perFish + req.extraPerFish * Math.max(0, t - req.extraFrom)) * t;
// The bigFishBonus table (Spelunk BigFishBonuses and the panel's `{` / `}` fills): the panel ceils to 1 / printScale. The
// game multiplies L / (decayHalf + L) by the value where `growth` divides value x L, so the ceiling differs by 0.01 at a
// handful of levels (L1150 on Life and Death: game 9.21, wiki 9.2).
const bonusTerms = (entry, bonus) => {
  const digits = Math.log10(bonus.printScale);
  return [
    { token: '{', formula: 'rounded', args: { formula: 'growth', args: { func: 'decay', x1: entry.value, x2: bonus.decayHalf }, mode: 'ceil', digits } },
    { token: '}', formula: 'rounded', args: { formula: 'growth', args: { func: 'decayMulti', x1: entry.value / bonus.percent, x2: bonus.decayHalf }, mode: 'ceil', digits } }
  ];
};

export default {
  kind: 'advicefish',
  // The fish list is listIndexes.bigFish (Spelunk:BigFishBonuses).
  section: (data) => (listAt(data.generalSpelunky, data, 'bigFish') || []).map(fishOf),
  key: (entry, index) => `AdviceFish${index}`,
  // No per-fish art exists: the Advice Fish tile stands in.
  // The game draws no art for these upgrades; a stand-in picture would only suggest one.
  fallbackIcon: null,
  effect: (entry, index, data) => {
    const bonus = gameTable(data, 'bigFishBonus');
    return { levelLabel: 'Upgrade level', cap: null, terms: bonus ? bonusTerms(entry, bonus) : [] };
  },
  // The bigFishCost table (Spelunk BigFishCost): rate^L x base^costExp coins, with no discounts.
  cost: (entry, index, data) => {
    const price = gameTable(data, 'bigFishCost');
    return price
      ? {
        formula: 'pow',
        args: { base: Math.pow(price.base, entry.costExp), rate: price.rate },
        currency: 'Coins',
        note: 'No discounts apply.'
      }
      : null;
  },
  // The bigFishFirstFree table (Spelunk isBigFishUpgUnlocked): the one fish with no account level gate.
  fields: (entry, index, data) => {
    const free = gameTable(data, 'bigFishFirstFree');
    const req = gameTable(data, 'bigFishLevelReq');
    return free && req && index !== free.ungated ? [{ label: 'Account level needed', value: levelRequired(index, req), format: 'amount' }] : [];
  }
};
