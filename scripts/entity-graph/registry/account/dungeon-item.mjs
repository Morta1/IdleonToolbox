import { levelledText } from '../../../../utility/wiki/effects.mjs';
import { tidy } from '../text.mjs';

// UPKEEP: the extractor's names for the game's rarity column 3, in its order (z-processing/features/dungeons.js:42).
const RARITIES = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
// UPKEEP: 4 and 2.348 are RngUpgCost's rarity scale, 1 + (r + 1) x 4^((r + 2.348) / 2.348) (N.js:87603).
const rarityScale = (rarity) => {
  const r = RARITIES.indexOf(rarity);
  return 1 + (r + 1) * 4 ** ((r + 2.348) / 2.348);
};

// UPKEEP: six rows keep their scaling number only in the panel's "Next_Lv:" line, which the panel fills at the next level (N.js:94652); the wiki fills it at the typed level, like `{`.
const describe = (entry) => (entry.desc.includes('{') ? entry.desc : `${entry.desc}_@_${entry.levelText.replace(/^Next_Lv:_/, '')}`);

// The panel prints NotateNumber(base + inc x L, "Small") (N.js:94652).
const termsOf = (entry) => [
  { token: '{', formula: 'notateSmall', args: { formula: 'growth', args: { func: 'bigBase', x1: entry.baseValue, x2: entry.increment } } }
];

// UPKEEP: BonusCalcs multiplies the bonus by the number of copies held (N.js:87626).
const PER_COPY = 'Each copy held during a run adds this bonus.';

export default {
  kind: 'dungeonitem',
  section: 'dungeonCreditShop',
  key: (entry, index) => `DungItems${index}`,
  // The shop panel's art (N.js:97784); DungItems<n> is the smaller in-run pickup sprite.
  icon: (entry, index) => `/data/DungItemsB${index}.png`,
  fallbackIcon: '/data/DungeonA7.png',
  describe,
  effect: (entry) => ({ levelLabel: 'Upgrade level', cap: entry.maxLevel, terms: termsOf(entry) }),
  cost: (entry) => ({
    formula: 'dungeonRngCost',
    args: { scale: rarityScale(entry.rarity) },
    currency: 'Dungeon Credits',
    currencyOne: 'Dungeon Credit',
    note: 'No discounts apply.'
  }),
  // The calculator starts at level 1, so the base value at level 0 is only readable here.
  fields: (entry) => [
    { label: 'Rarity', value: entry.rarity },
    { label: 'Before upgrades', value: levelledText({ description: tidy(describe(entry)), effect: { terms: termsOf(entry) } }, 0) },
    { label: 'Note', value: PER_COPY }
  ]
};
