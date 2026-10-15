import { linked } from '../../../../utility/wiki/field-links.mjs';
import { gameTable } from '../data.mjs';
import { nodeId } from '../links.mjs';
import { titleCase } from '../text.mjs';
import exoticUpgrade from './exotic-upgrade.mjs';

// UPKEEP: ninjaExtraInfo[34..37] are the Land Rank Database names, texts, bases and total-rank unlocks (farming.ts:160-191).
const rows = (data) => (data.ninjaExtraInfo?.[34] || []).map((name, i) => ({
  name,
  description: data.ninjaExtraInfo?.[35]?.[i],
  base: Number(data.ninjaExtraInfo?.[36]?.[i]),
  unlock: Number(data.ninjaExtraInfo?.[37]?.[i])
}));
// The landRankUpgradeBonus table, LankRankUpgBonus (FarmingStuffs.js:109): the fifth column of the 5-wide grid (the
// game's `4 == t || 9 == t || ...` set) is linear and capped, the others decayScale * base * L / (L + decayOffset).
// No table, no term: the column cannot be told apart.
const termOf = (entry, index, data) => {
  const bonus = gameTable(data, 'landRankUpgradeBonus');
  if (!bonus) return null;
  return bonus.fifthColumn.includes(index)
    ? { token: '{', formula: 'linear', args: { perLevel: entry.base } }
    : { token: '{', formula: 'growth', args: { func: 'decay', x1: bonus.decayScale * entry.base, x2: bonus.decayOffset } };
};

// The landRank5thColumnMax table, LandRank5thColumnMaxLV: round(base + Grimoire + ceil(Exotic) + legend talent), base
// with no account (N.js:106189, enforced at N.js:109872). The exotic upgrade is the one raiser that has a page; the
// Grimoire and the legend talent are unnamed.
const maxField = (index, data) => {
  const max = gameTable(data, 'landRank5thColumnMax');
  const exotic = titleCase(data.exoticMarketInfo?.[max?.exoticUpgrade]?.name ?? '');
  if (!max || !exotic || !gameTable(data, 'landRankUpgradeBonus')?.fifthColumn.includes(index)) return [];
  return [linked(
    { label: 'Base max level', value: `${max.base} (raised by the Grimoire, the ${exotic} exotic upgrade and a legend talent)` },
    'maxRaisedBy',
    nodeId(exoticUpgrade, null, max.exoticUpgrade)
  )];
};

export default {
  kind: 'landrank',
  section: rows,
  key: (entry, index) => `LandRank${index}`,
  // UPKEEP: RankUpg<n>.png holds one icon per grid index (RankDatabase.jsx:15).
  icon: (entry, index) => `/data/RankUpg${index}.png`,
  fallbackIcon: '/data/RankUpg0.png',
  effect: (entry, index, data) => ({
    levelLabel: 'Upgrade level',
    cap: null,
    terms: [termOf(entry, index, data)].filter(Boolean)
  }),
  cost: () => ({ formula: 'pow', args: { base: 1, rate: 1 }, currency: 'Land Rank points', currencyOne: 'Land Rank point', note: 'One point per level.' }),
  fields: (entry, index, data) => [
    { label: 'Total Land Rank needed', value: entry.unlock },
    ...maxField(index, data)
  ]
};
