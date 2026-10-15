import { formatAmount } from '../../../../utility/wiki/effects.mjs';
import { gameTable } from '../data.mjs';
import { spaced } from '../text.mjs';

// The importItemBonus table (GamingStatType ImportItemBonus): its own arm per listed item, linear (perLevel) or a decay
// (decayPowTenths); every other item gives round(level). No table, no bonus.
const bonusTerm = (index, data) => {
  const bonus = gameTable(data, 'importItemBonus');
  if (!bonus) return null;
  const args = bonus[index];
  if (!args) return { formula: 'linear', args: { perLevel: 1 } };
  return { formula: 'perLevel' in args ? 'linear' : 'decayPowTenths', args: { ...args } };
};
// UPKEEP: the Elegant Seashell's art is per shell rank (GamingItem3_<rank>); rank 0 stands for it.
const SEASHELL = 3;

// The game draws the glyph as its bits icon; the app reads it as the word (gaming.ts:341).
// UPKEEP: the bits glyph is the game's currency symbol in its texts.
const bits = (text) => String(text || '').replace(/₣/g, 'bits');
// The boxCost table (GamingStatType BoxCost): GamingBoxes[t][1] * power^GamingBoxes[t][2].
const boxCost = (entry, data) => {
  const box = gameTable(data, 'boxCost');
  return box ? entry.x1 * Math.pow(box.power, entry.x2) : null;
};
// The importItemCost table (GamingStatType ImportItemCOST): a share of the box price, times rate per level.
const importCost = (entry, data) => {
  const price = gameTable(data, 'importItemCost');
  const box = boxCost(entry, data);
  return price && box !== null
    ? { formula: 'pow', args: { base: box / price.share, rate: price.rate }, currency: 'Bits', note: 'No discounts apply.' }
    : null;
};

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
  effect: (entry, index, data) => {
    const term = bonusTerm(index, data);
    return { levelLabel: 'Import level', cap: null, terms: term ? [{ token: '{', ...term }] : [] };
  },
  cost: (entry, index, data) => importCost(entry, data),
  fields: (entry, index, data) => {
    const box = boxCost(entry, data);
    return [
      { label: 'Comes in', value: `${spaced(entry.boxName)}: ${spaced(entry.boxDescription)}` },
      { label: 'Box cost', value: box === null ? null : `${formatAmount(box)} Bits` }
    ];
  }
};
