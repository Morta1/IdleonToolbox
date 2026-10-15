import { linked } from '../../../../utility/wiki/field-links.mjs';
import { nodeId } from '../links.mjs';
import { titleCase } from '../text.mjs';
import researchSquare from '../world-7/research-square.mjs';

// UPKEEP: rows 0-7 are the Day market, 8-15 the Night market (FarmingStuffs t = floor(i / 8)).
const MARKET_SIZE = 8;
// UPKEEP: Land Rank is the Night market's slot 5 (FarmingStuffs.js:281 MarketMaxLV).
const LAND_RANK_SLOT = 5;
// UPKEEP: researchGridSquares[171] is Day 'N' Nite, the square MarketMaxLV adds (FarmingStuffs.js:281).
const DAY_N_NITE = 171;
// UPKEEP: MarketMaxLV (FarmingStuffs.js:281): slot 0 of either market and Night slot 5 are hard caps; the rest add Research square 171.
const hardCapped = (index) => index % MARKET_SIZE === 0 || index === MARKET_SIZE + LAND_RANK_SLOT;
// UPKEEP: MarketCostQTY floors below 1e8 (FarmingStuffs.js:214).
const FLOOR_BELOW = 1e8;
// UPKEEP: MarketCostType (FarmingStuffs.js:190): Land Plots steps faster than the linear crop ladder of the other Day upgrades.
const cropAt = (entry, index, level) => Math.floor(entry.cropId + entry.cropIdIncrement
  * (index === 0 ? level + 2 * Math.floor(level / 3) + Math.floor(level / 4) : level));
// The game never names a crop; this is the seed family and the position inside it.
export const cropName = (crop, data) => {
  const seed = (data.seedInfo || []).find(({ cropIdMin, cropIdMax }) => crop >= cropIdMin && crop <= cropIdMax);
  return seed ? `${titleCase(seed.name)} crop ${crop - seed.cropIdMin + 1}` : `Crop ${crop + 1}`;
};
const isDay = (index) => index < MARKET_SIZE;
// The cost line's second crop is read at level 10, or at the first level after it that pays a new crop, so the field never names one crop twice.
const LATER_LEVEL = 10;
const laterLevel = (entry, index) => {
  let level = LATER_LEVEL;
  while (level < entry.maxLvl && cropAt(entry, index, level - 1) === cropAt(entry, index, 0)) level += 1;
  return level;
};

export default {
  kind: 'marketupgrade',
  section: 'marketInfo',
  key: (entry, index) => `FarmMarket${index}`,
  name: (entry) => titleCase(entry.name),
  fallbackIcon: '/data/ClassIcons57.png',
  // UPKEEP: the market panel wraps this text in font 472 (N.js:108717), whose glyph 126 ("~") draws an ampersand.
  describe: (entry) => entry.bonus.replace('_~_', '_&_'),
  effect: (entry, index) => ({
    levelLabel: 'Upgrade level',
    cap: hardCapped(index) ? entry.maxLvl : null,
    terms: [
      { token: '{', formula: 'linear', args: { perLevel: entry.bonusPerLvl } },
      { token: '}', formula: 'growth', args: { func: 'bigBase', x1: 1, x2: entry.bonusPerLvl / 100 } }
    ]
  }),
  cost: (entry, index) => ({
    formula: 'powFloorBelow',
    args: { base: entry.cost, rate: entry.costExponent, below: FLOOR_BELOW },
    currency: isDay(index) ? 'Crops' : 'Magic Beans'
  }),
  fields: (entry, index, data) => {
    const later = laterLevel(entry, index);
    return [
      { label: 'Market', value: isDay(index) ? 'Day market' : 'Night market' },
      ...(entry.cropReq > 0 ? [{ label: 'Crops found to unlock', value: entry.cropReq }] : []),
      // UPKEEP: "Day 'N' Nite" is researchGridSquares[171]'s name, the square MarketMaxLV adds (FarmingStuffs.js:281).
      ...(hardCapped(index)
        ? []
        : [linked(
          { label: 'Base max level', value: `${entry.maxLvl} (raised by the Day 'N' Nite research square)` },
          'maxRaisedBy',
          nodeId(researchSquare, null, DAY_N_NITE)
        )]),
      ...(isDay(index)
        ? [{
          label: 'Crop paid',
          value: `${cropName(cropAt(entry, index, 0), data)} at level 1, ${cropName(cropAt(entry, index, later - 1), data)} at level ${later}`
        }]
        : [])
    ];
  }
};
