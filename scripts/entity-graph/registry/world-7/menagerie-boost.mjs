import { linked } from '../../../../utility/wiki/field-links.mjs';
import { registryNodes } from '../build.mjs';
import { gameTable, listAt } from '../data.mjs';
import { fillBonus } from '../text.mjs';
import { rankNeeded } from './menagerie-unlock.mjs';
import mineheadUpgrade from './minehead-upgrade.mjs';
import sushiUpgrade from './sushi-upgrade.mjs';
import jellyUpgrade from './jelly-upgrade.mjs';

// UPKEEP: research[57] holds the boost texts. Not extracted: only the Menagerie panel's unnamed draw event (`_event_`) reads it,
// which no locator may anchor on.
const TEXTS = 57;
// UPKEEP: boosts 8, 10 and 12 add doublers (MenagerieStuff MineheadDoublersOwned, SushiDoublersOwned, JellyOpDoublersOwned,
// N.js:72950), each placeable on the upgrades research[59], [60] and [61] list by id. Not extracted: only the three shops'
// numbered panel events (_event_3, _event_12, _event_14) read those lists.
const DOUBLERS = { 8: { list: 59, row: mineheadUpgrade }, 10: { list: 60, row: sushiUpgrade }, 12: { list: 61, row: jellyUpgrade } };

// The menagerieCost table, MenagerieStuff Cost arm 2 (N.js:72954): perLevel L + L^power + base(t) x CostExponent(t)^L.
const boostCost = (t, price) => ({
  base: (price.base + Math.pow(t, price.indexPower)) * Math.pow(Math.max(price.floor, price.start + (t / price.divisor) * price.slope), t),
  rate: price.exponents.groups.find(({ ids }) => ids.includes(t))?.exponent ?? price.exponents.other,
  perLevel: price.perLevel,
  exponent: price.power
});

// The shop upgrades a boost's doublers fit on, as the shop's own pages, in the list's order.
const doublerTargets = (index, data) => {
  const doubler = DOUBLERS[index];
  const ids = data.research[doubler?.list];
  if (!ids) return [];
  const pages = Object.entries(registryNodes(data, [doubler.row]));
  return ids.map((id) => pages.find(([pageId]) => pageId === `${doubler.row.kind}:${doubler.row.key({ id: Number(id) }, Number(id))}`))
    .filter(Boolean);
};

export default {
  kind: 'menagerieboost',
  // listIndexes.menagerieBoostValues (MenagerieStuff BoostQTY): the bonus per level. No list, no pages.
  section: (data) => {
    const values = listAt(data.research, data, 'menagerieBoostValues');
    return values ? (data.research[TEXTS] || []).map((text, index) => ({ text, perLevel: Number(values[index]) })) : [];
  },
  key: (entry, index) => `MenaBoost${index}`,
  // The game names a boost by its text alone, so the page takes the text at level 1.
  name: (entry) => fillBonus(entry.text, entry.perLevel),
  icon: (entry, index) => `/data/MenaIconP${index}.png`,
  fallbackIcon: '/data/LumiJel.png',
  describe: (entry) => entry.text,
  // UPKEEP: `{` is CommaNotation(perLevel x L) and `}` MultiplierInfo(1 + perLevel x L / 100) (N.js:124034). Not extracted: the
  // token print rule is panel draw code.
  effect: (entry) => ({
    levelLabel: 'Boost level',
    terms: [
      { token: '{', formula: 'linear', args: { perLevel: entry.perLevel } },
      { token: '}', formula: 'growth', args: { func: 'bigBase', x1: 1, x2: entry.perLevel / 100 } }
    ]
  }),
  // The panel prints CommaNotation below 1e9 and NotateNumber(cost, "Big") above (N.js:124034); nothing discounts it.
  cost: (entry, index, data) => {
    const price = gameTable(data, 'menagerieCost')?.boost;
    return price
      ? { formula: 'polyPlusPow', args: boostCost(index, price), currency: 'Lumi', currencyIcon: '/etc/Lumi.png', note: 'No discounts apply.' }
      : null;
  },
  fields: (entry, index, data) => {
    const req = gameTable(data, 'menagerieRankReq')?.boosts;
    const targets = doublerTargets(index, data);
    return [
      ...(req ? [{ label: 'Menagerie Rank needed', value: rankNeeded(index, req) }] : []),
      ...(targets.length
        ? [linked({ label: 'Doublers fit on', value: targets.map(([, node]) => node.name.replace(/_/g, ' ')) }, 'boosts',
          ...targets.map(([pageId]) => pageId))]
        : [])
    ];
  }
};
