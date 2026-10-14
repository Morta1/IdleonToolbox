import { titleCase } from '../text.mjs';

// UPKEEP: rows 0-7 are the Day market, 8-15 the Night market (FarmingStuffs t = floor(i / 8)).
const MARKET_SIZE = 8;
// UPKEEP: Land Rank is the Night market's slot 5 (FarmingStuffs.js:281 MarketMaxLV).
const LAND_RANK_SLOT = 5;
// UPKEEP: MarketMaxLV (FarmingStuffs.js:281): slot 0 of either market and Night slot 5 are hard caps; the rest add Research square 171.
const hardCapped = (index) => index % MARKET_SIZE === 0 || index === MARKET_SIZE + LAND_RANK_SLOT;
// UPKEEP: MarketCostQTY floors below 1e8 (FarmingStuffs.js:214).
const FLOOR_BELOW = 1e8;
// UPKEEP: the level the cost line shows its second crop at; the game's cost lines read the level before the purchase.
const LATER_LEVEL = 10;
// UPKEEP: MarketCostType (FarmingStuffs.js:190): Land Plots steps faster than the linear crop ladder of the other Day upgrades.
const cropAt = (entry, index, level) => Math.floor(entry.cropId + entry.cropIdIncrement
  * (index === 0 ? level + 2 * Math.floor(level / 3) + Math.floor(level / 4) : level));
// The game never names a crop; this is the seed family and the position inside it.
export const cropName = (crop, data) => {
  const seed = (data.seedInfo || []).find(({ cropIdMin, cropIdMax }) => crop >= cropIdMin && crop <= cropIdMax);
  return seed ? `${titleCase(seed.name)} crop ${crop - seed.cropIdMin + 1}` : `Crop ${crop + 1}`;
};
const isDay = (index) => index < MARKET_SIZE;

export default {
  kind: 'marketupgrade',
  section: 'marketInfo',
  key: (entry, index) => `FarmMarket${index}`,
  name: (entry) => titleCase(entry.name),
  fallbackIcon: '/data/ClassIcons57.png',
  describe: (entry) => entry.bonus,
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
  fields: (entry, index, data) => [
    { label: 'Market', value: isDay(index) ? 'Day market' : 'Night market' },
    ...(entry.cropReq > 0 ? [{ label: 'Crops found to unlock', value: entry.cropReq }] : []),
    ...(hardCapped(index) ? [] : [{ label: 'Base max level', value: `${entry.maxLvl} (raised by the Day 'N' Nite research square)` }]),
    ...(isDay(index)
      ? [{
        label: 'Crop paid',
        value: `${cropName(cropAt(entry, index, 0), data)} at level 1, ${cropName(cropAt(entry, index, LATER_LEVEL - 1), data)} at level ${LATER_LEVEL}`
      }]
      : [])
  ]
};
