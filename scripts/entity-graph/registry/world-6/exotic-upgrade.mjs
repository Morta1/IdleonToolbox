import { gameTable } from '../data.mjs';
import { titleCase } from '../text.mjs';
import { cropName } from './market-upgrade.mjs';

// The exoticBonus table, ExoticBonusQTY (FarmingStuffs.js:257): the decay type is baseValue * L / (offset + L), the
// other baseValue * L. No table, no terms: the type cannot be told apart. Since 2.3.540 a Menagerie organic label
// (Spelunk[50]) doubles a row's bonus and row cappedRow is then held to cap.
const capOf = (index, data) => {
  const bonus = gameTable(data, 'exoticBonus');
  return bonus && index === bonus.cappedRow ? bonus.cap : null;
};
const isDecay = (entry, data) => entry.type === gameTable(data, 'exoticBonus')?.decayType;
const termsOf = (entry, data) => {
  const bonus = gameTable(data, 'exoticBonus');
  if (!bonus) return [];
  return entry.type === bonus.decayType
    ? [
      { token: '{', formula: 'growth', args: { func: 'decay', x1: entry.baseValue, x2: bonus.decayOffset } },
      { token: '}', formula: 'growth', args: { func: 'decayMulti', x1: entry.baseValue / 100, x2: bonus.decayOffset } },
      { token: '$', formula: 'decayCeil', args: { scale: entry.baseValue, offset: bonus.decayOffset } }
    ]
    : [
      { token: '{', formula: 'linear', args: { perLevel: entry.baseValue } },
      { token: '}', formula: 'growth', args: { func: 'bigBase', x1: 1, x2: entry.baseValue / 100 } }
    ];
};

// The exoticLevelQty table, ExoticLVQTY (FarmingStuffs.js:251): ceil(log2(crops) / log2Divisor + log10(crops)) levels
// per purchase, before Better Exotic and the legend talent.
const PURCHASES = [[1e3, '1,000 crops'], [1e6, 'a million'], [1e9, 'a billion']];
const purchaseSize = (data) => {
  const qty = gameTable(data, 'exoticLevelQty');
  if (!qty) return null;
  return PURCHASES.map(([crops, label]) => `${Math.ceil(Math.log2(crops) / qty.log2Divisor + Math.log10(crops))} for ${label}`).join(', ');
};

// UPKEEP: what a decay upgrade approaches, printed by its own text's rule (N.js:108717): { round2, } round2(1 + b/100),
// $ ceil(b). Not extracted: the limit print rounding is panel draw state.
const round2 = (value) => Math.round(value * 100) / 100;
const limitOf = (entry) => {
  const token = entry.bonus.match(/[{}$]/)?.[0];
  if (token === '}') return `${round2(1 + entry.baseValue / 100)}x`;
  if (token === '{') return `+${entry.baseValue}%`;
  if (token === '$') return `+${Math.ceil(entry.baseValue)}`;
  return null;
};

// A decay row below its cap reaches it only with the label's doubling.
const capLine = (entry, cap, data) => (isDecay(entry, data) && entry.baseValue < cap
  ? `+${cap}%, reached only once an organic label doubles the bonus`
  : `+${cap}%`);

export default {
  kind: 'exoticupgrade',
  section: 'exoticMarketInfo',
  key: (entry, index) => `ExoticMarket${index}`,
  name: (entry) => titleCase(entry.name),
  icon: (entry) => `/data/FarmCrop${entry.x2}.png`,
  fallbackIcon: '/data/ClassIcons57.png',
  // UPKEEP: the game's spare slots.
  skip: (entry) => (entry.name === 'NAME_MAGNI' ? 'placeholder: no bonus yet' : false),
  describe: (entry) => entry.bonus,
  effect: (entry, index, data) => ({ levelLabel: 'Upgrade level', cap: null, terms: termsOf(entry, data) }),
  fields: (entry, index, data) => [
    { label: 'Trades', value: `All of your ${cropName(entry.x2, data)}` },
    { label: 'Levels per purchase', value: purchaseSize(data) },
    ...(isDecay(entry, data) ? [{ label: 'Bonus approaches', value: limitOf(entry) }] : []),
    ...(capOf(index, data) !== null ? [{ label: 'Bonus cap', value: capLine(entry, capOf(index, data), data) }] : [])
  ]
};
