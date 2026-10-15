import { linked } from '../../../../utility/wiki/field-links.mjs';
import { gameTable } from '../data.mjs';
import { nodeId } from '../links.mjs';
import { spaced, titleCase } from '../text.mjs';
import researchSquare from '../world-7/research-square.mjs';

// The marketMaxLevel table, MarketMaxLV (FarmingStuffs.js:281): the Day market's rows come first, marketSize of them
// (FarmingStuffs t = floor(i / marketSize)). Slot capSlot of either market and the Night market's Land Rank slot are
// hard caps; the rest add the Day 'N' Nite research square. No table, no market: none of it is known.
const marketOf = (data) => gameTable(data, 'marketMaxLevel');
const isDay = (index, market) => index < market.marketSize;
const hardCapped = (index, market) => index % market.marketSize === market.capSlot
  || index === market.nightMarket * market.marketSize + market.landRankSlot;
// The marketCostType table, MarketCostType (FarmingStuffs.js:190): Land Plots (slot 0 of the Day market, the arm's
// fixed test) steps faster than the linear crop ladder of the other Day upgrades.
const cropAt = (entry, index, level, step) => Math.floor(entry.cropId + entry.cropIdIncrement
  * (index === 0 ? level + step.perThird * Math.floor(level / step.third) + Math.floor(level / step.fourth) : level));
// The game never names a crop; this is the seed family and the position inside it.
export const cropName = (crop, data) => {
  const seed = (data.seedInfo || []).find(({ cropIdMin, cropIdMax }) => crop >= cropIdMin && crop <= cropIdMax);
  return seed ? `${titleCase(seed.name)} crop ${crop - seed.cropIdMin + 1}` : `Crop ${crop + 1}`;
};
// The cost line's second crop is read at level 10, or at the first level after it that pays a new crop, so the field never names one crop twice.
const LATER_LEVEL = 10;
const laterLevel = (entry, index, step) => {
  let level = LATER_LEVEL;
  while (level < entry.maxLvl && cropAt(entry, index, level - 1, step) === cropAt(entry, index, 0, step)) level += 1;
  return level;
};

// The Day 'N' Nite square MarketMaxLV adds: its name is researchGridSquares' own.
const maxField = (entry, index, data, market) => {
  const square = data.researchGridSquares?.[market.dayNNiteSquare]?.name;
  if (hardCapped(index, market) || !square) return [];
  return [linked(
    { label: 'Base max level', value: `${entry.maxLvl} (raised by the ${spaced(square)} research square)` },
    'maxRaisedBy',
    nodeId(researchSquare, null, market.dayNNiteSquare)
  )];
};

const cropField = (entry, index, data, market) => {
  const step = gameTable(data, 'marketCostType');
  if (!step || !isDay(index, market)) return [];
  const later = laterLevel(entry, index, step);
  return [{
    label: 'Crop paid',
    value: `${cropName(cropAt(entry, index, 0, step), data)} at level 1, ${cropName(cropAt(entry, index, later - 1, step), data)} at level ${later}`
  }];
};

export default {
  kind: 'marketupgrade',
  section: 'marketInfo',
  key: (entry, index) => `FarmMarket${index}`,
  name: (entry) => titleCase(entry.name),
  fallbackIcon: '/data/ClassIcons57.png',
  // UPKEEP: the market panel wraps this text in font 472 (N.js:108717), whose glyph 126 ("~") draws an ampersand.
  describe: (entry) => entry.bonus.replace('_~_', '_&_'),
  effect: (entry, index, data) => {
    const market = marketOf(data);
    return {
      levelLabel: 'Upgrade level',
      cap: market && hardCapped(index, market) ? entry.maxLvl : null,
      terms: [
        { token: '{', formula: 'linear', args: { perLevel: entry.bonusPerLvl } },
        { token: '}', formula: 'growth', args: { func: 'bigBase', x1: 1, x2: entry.bonusPerLvl / 100 } }
      ]
    };
  },
  // The marketCostQty table, MarketCostQTY (FarmingStuffs.js:214): floored below floorBelow. No table, no price.
  cost: (entry, index, data) => {
    const qty = gameTable(data, 'marketCostQty');
    const market = marketOf(data);
    return qty
      ? {
        formula: 'powFloorBelow',
        args: { base: entry.cost, rate: entry.costExponent, below: qty.floorBelow },
        ...(market ? { currency: isDay(index, market) ? 'Crops' : 'Magic Beans' } : {})
      }
      : null;
  },
  fields: (entry, index, data) => {
    const market = marketOf(data);
    return [
      ...(market ? [{ label: 'Market', value: isDay(index, market) ? 'Day market' : 'Night market' }] : []),
      ...(entry.cropReq > 0 ? [{ label: 'Crops found to unlock', value: entry.cropReq }] : []),
      ...(market ? maxField(entry, index, data, market) : []),
      ...(market ? cropField(entry, index, data, market) : [])
    ];
  }
};
