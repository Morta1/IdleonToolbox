import { titleCase } from '../text.mjs';
import { cropName } from './market-upgrade.mjs';

// UPKEEP: ExoticBonusQTY (FarmingStuffs.js:257): type 1 is baseValue * L / (1000 + L), type 0 baseValue * L.
const DECAY = 1;
const DECAY_OFFSET = 1000;
const termsOf = (entry) => (entry.type === DECAY
  ? [
    { token: '{', formula: 'growth', args: { func: 'decay', x1: entry.baseValue, x2: DECAY_OFFSET } },
    { token: '}', formula: 'growth', args: { func: 'decayMulti', x1: entry.baseValue / 100, x2: DECAY_OFFSET } },
    { token: '$', formula: 'decayCeil', args: { scale: entry.baseValue, offset: DECAY_OFFSET } }
  ]
  : [
    { token: '{', formula: 'linear', args: { perLevel: entry.baseValue } },
    { token: '}', formula: 'growth', args: { func: 'bigBase', x1: 1, x2: entry.baseValue / 100 } }
  ]);

// What a decay upgrade approaches, printed by its own text's rule (N.js:108717): { round2, } round2(1 + b/100), $ ceil(b).
const round2 = (value) => Math.round(value * 100) / 100;
const limitOf = (entry) => {
  const token = entry.bonus.match(/[{}$]/)?.[0];
  if (token === '}') return `${round2(1 + entry.baseValue / 100)}x`;
  if (token === '{') return `+${entry.baseValue}%`;
  if (token === '$') return `+${Math.ceil(entry.baseValue)}`;
  return null;
};

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
  effect: (entry) => ({ levelLabel: 'Upgrade level', cap: null, terms: termsOf(entry) }),
  fields: (entry, index, data) => [
    { label: 'Trades', value: `All of your ${cropName(entry.x2, data)}` },
    // UPKEEP: ExoticLVQTY (FarmingStuffs.js:251) before Better Exotic and the legend talent.
    { label: 'Levels per purchase', value: '8 for 1,000 crops, 16 for a million, 24 for a billion' },
    ...(entry.type === DECAY ? [{ label: 'Bonus approaches', value: limitOf(entry) }] : [])
  ]
};
