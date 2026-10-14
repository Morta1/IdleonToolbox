import { formatAmount } from '../../../../utility/wiki/effects.mjs';
import { spaced } from '../text.mjs';

// UPKEEP: ImportItemBonus (GamingStatType.js:462-481) hardcodes items 1, 2 and 5; the rest give round(level).
const BONUS_TERMS = {
  1: { formula: 'decayPowTenths', args: { base: 1, scale: 60, offset: 250, exponent: 1.7 } },
  2: { formula: 'linear', args: { perLevel: 5 } },
  5: { formula: 'decayPowTenths', args: { scale: 60, offset: 100 } }
};
const DEFAULT_TERM = { formula: 'linear', args: { perLevel: 1 } };
// UPKEEP: the Elegant Seashell's art is per shell rank (GamingItem3_<rank>); rank 0 stands for it.
const SEASHELL = 3;
// UPKEEP: ImportItemCOST (GamingStatType.js:482-487) is a quarter of the box price times 1.4 per level.
const COST_SHARE = 4;
const COST_RATE = 1.4;

// The game draws the glyph as its bits icon; the app reads it as the word (gaming.ts:341).
// UPKEEP: the bits glyph is the game's currency symbol in its texts.
const bits = (text) => String(text || '').replace(/₣/g, 'bits');
// UPKEEP: BoxCost is GamingBoxes[t][1] * 10^GamingBoxes[t][2] (GamingStatType.js:459-461).
const boxCost = (entry) => entry.x1 * Math.pow(10, entry.x2);

// A `|` before a capital is the game's line break; any other is a wrap inside a sentence (King Rat, Bog Log, POiNG).
// UPKEEP: the two kinds of `|` are told apart by the capital after it.
const majorLines = (text) => String(text || '').replace(/\|(?=[A-Z])/g, '@').replace(/\|/g, '_');

export default {
  kind: 'gamingimport',
  section: 'gamingImports',
  key: (entry, index) => `GamingItem${index}`,
  icon: (entry, index) => (index === SEASHELL ? '/data/GamingItem3_0.png' : `/data/GamingItem${index}.png`),
  fallbackIcon: '/data/GamingItem0.png',
  // UPKEEP: the last row is the game's empty box ("idk", "box10").
  skip: (entry) => (entry.boxName === 'Empty_Box' ? 'placeholder: the empty box' : false),
  // The item's flavour, what it does, then the per-level line.
  describe: (entry) => bits(`${entry.description}@${majorLines(entry.majorBonus)}@${entry.minorBonus}`),
  effect: (entry, index) => ({ levelLabel: 'Import level', cap: null, terms: [{ token: '{', ...(BONUS_TERMS[index] ?? DEFAULT_TERM) }] }),
  cost: (entry) => ({ formula: 'pow', args: { base: boxCost(entry) / COST_SHARE, rate: COST_RATE }, currency: 'Bits', note: 'No discounts apply.' }),
  fields: (entry) => [
    { label: 'Comes in', value: `${spaced(entry.boxName)}: ${spaced(entry.boxDescription)}` },
    { label: 'Box cost', value: `${formatAmount(boxCost(entry))} Bits` }
  ]
};
