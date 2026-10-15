import { formatAmount } from '../../../../utility/wiki/effects.mjs';
import { linked } from '../../../../utility/wiki/field-links.mjs';
import { nodeId } from '../links.mjs';
import { spaced, titleCase } from '../text.mjs';
import { classField } from './fields.mjs';

// UPKEEP: the Orblet item reads "opened by using the Royal Guardian talent" (N.js:180399).
const CLASS = 'Royal_Guardian';
// UPKEEP: OrbletMarketCost is L + baseCost x costScaling^L, floored below 1e6, with no discounts (N.js:106632).
const FLOOR_BELOW = 1e6;
// UPKEEP: Glorification's row index. Buying it sets its level to 1 instead of adding one, so every attempt after the first pays the
// level 1 price (N.js:119505), and the panel draws no level for it (N.js:119258).
const GLORIFICATION = 4;
// UPKEEP: the game's strings for Glorification: the panel's line for an outpost not yet Glorified, and what a Glorified one gets
// ("This_outpost_is_Glorified!_It_gets_...", N.js:119258).
const GLORIFY = '10%_chance_to_Glorify_the_current_Outpost';
const GLORIFIED = '+10 PTS, 2x Rank EXP, and +1 Worker';

const row = {
  kind: 'orbletupgrade',
  section: 'orbletMarket',
  key: (entry, index) => `OrbletMarket${index}`,
  name: (entry) => titleCase(entry.name),
  // The market's rows are glyph frames with no per-upgrade art: the Orblet stands in.
  fallbackIcon: '/data/Orblet.png',
  describe: (entry, index) => (index === GLORIFICATION ? GLORIFY : entry.description),
  effect: (entry, index) => ({
    levelLabel: 'Upgrade level',
    cap: index === GLORIFICATION ? 1 : entry.maxLevel,
    // UPKEEP: the bonus is floor(bonusPerLevel x L) and every bonusPerLevel is whole, so it is linear (N.js:106633).
    terms: index === GLORIFICATION ? [] : [
      { token: '{', formula: 'linear', args: { perLevel: entry.bonusPerLevel } },
      { token: '}', formula: 'growth', args: { func: 'bigBase', x1: 1, x2: entry.bonusPerLevel / 100 } }
    ]
  }),
  cost: (entry) => ({
    formula: 'floorBelow',
    args: { formula: 'powPlusLevel', args: { base: entry.baseCost, rate: entry.costScaling }, below: FLOOR_BELOW },
    currency: 'Orblets',
    currencyOne: 'Orblet',
    note: 'No discounts apply.'
  }),
  // UPKEEP: the market spends the stored Orblet item (_ItemsAndStorageOWNED.h.Orblet, N.js:119256).
  costs: () => [{ item: 'Orblet' }],
  // UPKEEP: the panel draws row i only once row i-1 is level 1, and the buy check repeats it (N.js:119257, 119505).
  fields: (entry, index, data) => [
    classField(CLASS),
    index > 0
      ? linked({ label: 'Unlocked by', value: `${spaced(titleCase(data.orbletMarket[index - 1].name))} at level 1` }, 'unlockedBy', nodeId(row, null, index - 1))
      : null,
    index === GLORIFICATION ? { label: 'Glorified outposts get', value: GLORIFIED } : null,
    index === GLORIFICATION ? { label: 'Each later attempt', value: `${formatAmount(Math.floor(1 + entry.baseCost * entry.costScaling))} Orblets` } : null
  ].filter(Boolean)
};

export default row;
