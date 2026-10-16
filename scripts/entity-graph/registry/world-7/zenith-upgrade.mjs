import { linked } from '../../../../utility/wiki/field-links.mjs';
import { gameTable } from '../data.mjs';
import { nodeId } from '../links.mjs';
import { spaced, titleCase } from '../text.mjs';

const row = {
  kind: 'zenithupgrade',
  section: 'zenithMarket',
  key: (entry, index) => `ZenithMarket${index}`,
  name: (entry) => titleCase(entry.name),
  // The market's rows are glyph frames with no per-upgrade art: the Zenith Cluster tile stands in.
  // The game draws no art for these upgrades; a stand-in picture would only suggest one.
  fallbackIcon: null,
  effect: (entry) => ({
    levelLabel: 'Upgrade level',
    cap: entry.x3,
    // UPKEEP: the bonus is floor(x4 x L) and x4 are whole numbers, so it is linear (Thingies.js:79-80, N.js:119261).
    terms: [
      { token: '{', formula: 'linear', args: { perLevel: entry.x4 } },
      { token: '}', formula: 'growth', args: { func: 'bigBase', x1: 1, x2: entry.x4 / 100 } }
    ]
  }),
  // The zenithMarketCost table, Thingies:ZenithMarketCost (N.js:106630): L + x1 x x2^L, floored below floorBelow, with no
  // discounts. No table, no price.
  cost: (entry, index, data) => {
    const price = gameTable(data, 'zenithMarketCost');
    return price
      ? {
        formula: 'floorBelow',
        args: { formula: 'powPlusLevel', args: { base: entry.x1, rate: entry.x2 }, below: price.floorBelow },
        currency: 'Zenith Clusters',
        currencyOne: 'Zenith Cluster',
        note: 'No discounts apply.'
      }
      : null;
  },
  // UPKEEP: Zenith Clusters are the Quest110 item, deposited into OptionsListAccount[486] (N.js:119168).
  costs: () => [{ item: 'Quest110' }],
  // UPKEEP: row i shows once row i-1 is level 1; row 0 always shows (N.js:119261). Not extracted: it is a panel layout rule.
  fields: (entry, index, data) => (index > 0
    ? [linked({ label: 'Unlocked by', value: `${spaced(titleCase(data.zenithMarket[index - 1].name))} at level 1` }, 'unlockedBy', nodeId(row, null, index - 1))]
    : [])
};

export default row;
