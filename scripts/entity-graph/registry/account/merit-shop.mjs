import { worldNames } from '../../nodes/worlds.mjs';
import { spaced } from '../text.mjs';

// UPKEEP: the game draws the shop as art only (TaskShopButton<n>, N.js:85610), so "<World> Merit Shop" is a descriptor, not a game name.
const shopName = (w, data) => `${spaced(worldNames(data)[w + 1])} Merit Shop`;

// UPKEEP: the game draws GenINFO[19][w] rows per world, live [7, 8, 7, 7, 7, 6, 6], which is exactly this rule; the app filters the same way (merits.jsx:17).
const placeholder = (merit) => merit.descLine1 === 'IDK_YET' || merit.meritCost === null;

// UPKEEP: Blank420q is the extraStr of a merit with no options; SoldOut ends the list of a recipe row (N.js:84663).
const NO_OPTIONS = 'Blank420q';
const SOLD_OUT = 'SoldOut';
// UPKEEP: the bag row lists every bag by its one letter and ends in one option that gives all five at once, which the page leaves out (N.js:84663).
const isBag = (option) => option.length === 1;
// UPKEEP: the second line is a placeholder on the recipe rows (the panel draws the task requirement there instead) and a lone underscore on Jade Gain (N.js:84663).
const NO_LINE = new Set(['Descline2', '_']);

const optionsOf = (merit) => (merit.extraStr === NO_OPTIONS ? [] : merit.extraStr.split('|').filter((option) => option !== SOLD_OUT));

// The options a `}` lists: every one-letter bag when the row has any, else all of them.
const listed = (merit) => {
  const options = optionsOf(merit);
  const bags = options.filter(isBag);
  return bags.length ? bags : options;
};

const andList = (items) => (items.length > 1 ? `${items.slice(0, -1).join(',_')}_and_${items.at(-1)}` : items.join(''));

const titleLine = (merit) => (merit.descLine1.includes('}') ? merit.descLine1.split('}').join(andList(listed(merit))) : merit.descLine1);

const fieldsOf = (merit, w, data) => [
  merit.descLine1.includes('}') && optionsOf(merit).some(isBag)
    ? { label: 'Order', value: `${listed(merit).join(', ')}, one bag per purchase` }
    : null,
  // UPKEEP: num1 === 1 marks the recipe rows, which need the world's boss task (num2) at level num3 plus the purchases (N.js:84627, 84663).
  merit.num1 === 1
    ? { label: 'Requires', value: `${spaced(data.tasks[w][merit.num2].name)} task at level ${merit.num3} for the first recipe, one level more for each after` }
    : null
].filter(Boolean);

export default {
  kind: 'meritshop',
  section: 'merits',
  key: (entry, w) => `MeritShop${w}`,
  name: (entry, w, data) => shopName(w, data),
  icon: (entry, w) => `/etc/Merit_${w}.png`,
  describe: (entry, w) => `The Task Board's World ${w + 1} merit shop: spend merits from World ${w + 1} tasks on these upgrades.`,
  entriesLabel: 'Merits',
  entries: (shop, w, data) => shop.map((merit, i) => {
    const key = `TaskShop${w}_${i}`;
    if (placeholder(merit)) return { key, skip: 'placeholder: IDK_YET or no cost' };
    return {
      key,
      icon: `/data/${merit.icon}.png`,
      description: [titleLine(merit), NO_LINE.has(merit.descLine2) ? null : merit.descLine2].filter(Boolean).join('_'),
      effect: {
        levelLabel: 'Purchases',
        cap: merit.totalLevels,
        terms: merit.bonusPerLevel ? [{ token: '{', formula: 'linear', args: { perLevel: merit.bonusPerLevel } }] : []
      },
      // The game never names the currency in text: the panel draws the world's glyph (GenINFO[17]).
      cost: { formula: 'pow', args: { base: merit.meritCost, rate: 1 }, currency: 'Merits', currencyOne: 'Merit', currencyIcon: `/etc/Merit_${w}.png`, note: 'No discounts apply.' },
      fields: fieldsOf(merit, w, data)
    };
  })
};
