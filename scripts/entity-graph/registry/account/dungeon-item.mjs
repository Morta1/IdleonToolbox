import { levelledText } from '../../../../utility/wiki/effects.mjs';
import { gameTable } from '../data.mjs';
import { tidy } from '../text.mjs';

// UPKEEP: the extractor's names for the game's rarity column 3, in its order (z-processing/features/dungeons.js:42).
const RARITIES = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
// UPKEEP: the game names the rarities by colour, never by the extractor's words: Grey Grumblo's "Grey_Rarity" and Coin Flip's "Orange_RNG_item" (N.js:136074), the traits' grey, green, blue and purple items (N.js:133255); same order as RARITIES, matching RNGdropID's id bands (N.js:87635-87638). Not extracted: the colour words live only inside free item and trait descriptions, never in a list keyed by rarity.
const COLOURS = ['Grey', 'Green', 'Blue', 'Purple', 'Orange'];
// RngUpgCost's rarity scale, rarityBase + (r + 1) x rarityRoot^((r + rarityPivot) / rarityPivot), from the
// dungeonRngUpgCost table (DungeonCalc:RngUpgCost, N.js:87603).
const rarityScale = (rarity, cost) => {
  const r = RARITIES.indexOf(rarity);
  return cost.rarityBase + (r + 1) * cost.rarityRoot ** ((r + cost.rarityPivot) / cost.rarityPivot);
};

// UPKEEP: six rows keep their scaling number only in the panel's "Next_Lv:" line, which the panel fills at the next level (N.js:94652); the wiki fills it at the typed level, like `{`.
const describe = (entry) => (entry.desc.includes('{') ? entry.desc : `${entry.desc}_@_${entry.levelText.replace(/^Next_Lv:_/, '')}`);

// The panel prints NotateNumber(base + inc x L, "Small") (N.js:94652).
const termsOf = (entry) => [
  { token: '{', formula: 'notateSmall', args: { formula: 'growth', args: { func: 'bigBase', x1: entry.baseValue, x2: entry.increment } } }
];

// UPKEEP: BonusCalcs multiplies the bonus by the number of copies held (N.js:87626). Not extracted: the sentence is the wiki's wording of a multiplication; the game has no text for it.
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
  // No table, no price.
  cost: (entry, index, data) => {
    const cost = gameTable(data, 'dungeonRngUpgCost');
    return cost
      ? {
        formula: 'dungeonRngCost',
        args: { scale: rarityScale(entry.rarity, cost) },
        currency: 'Dungeon Credits',
        currencyOne: 'Dungeon Credit',
        note: 'No discounts apply.'
      }
      : null;
  },
  // The calculator starts at level 1, so the base value at level 0 is only readable here.
  fields: (entry) => [
    { label: 'Rarity', value: COLOURS[RARITIES.indexOf(entry.rarity)] },
    { label: 'Before upgrades', value: levelledText({ description: tidy(describe(entry)), effect: { terms: termsOf(entry) } }, 0) },
    { label: 'Note', value: PER_COPY }
  ]
};
