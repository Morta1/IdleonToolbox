// UPKEEP: ninjaExtraInfo[34..37] are the Land Rank Database names, texts, bases and total-rank unlocks (farming.ts:160-191).
const rows = (data) => (data.ninjaExtraInfo?.[34] || []).map((name, i) => ({
  name,
  description: data.ninjaExtraInfo?.[35]?.[i],
  base: Number(data.ninjaExtraInfo?.[36]?.[i]),
  unlock: Number(data.ninjaExtraInfo?.[37]?.[i])
}));
// UPKEEP: LankRankUpgBonus (FarmingStuffs.js:109): the 5th column of the 5-wide grid is linear and capped.
const isFifthColumn = (index) => (index + 1) % 5 === 0;
// UPKEEP: the other columns are 1.7 * base * L / (L + 80) (FarmingStuffs.js:109).
const DECAY_SCALE = 1.7;
const DECAY_OFFSET = 80;

export default {
  kind: 'landrank',
  section: rows,
  key: (entry, index) => `LandRank${index}`,
  // UPKEEP: RankUpg<n>.png holds one icon per grid index (RankDatabase.jsx:15).
  icon: (entry, index) => `/data/RankUpg${index}.png`,
  fallbackIcon: '/data/RankUpg0.png',
  effect: (entry, index) => ({
    levelLabel: 'Upgrade level',
    cap: null,
    terms: [isFifthColumn(index)
      ? { token: '{', formula: 'linear', args: { perLevel: entry.base } }
      : { token: '{', formula: 'growth', args: { func: 'decay', x1: DECAY_SCALE * entry.base, x2: DECAY_OFFSET } }]
  }),
  cost: () => ({ formula: 'pow', args: { base: 1, rate: 1 }, currency: 'Land Rank points', note: 'One point per level.' }),
  fields: (entry, index) => [
    { label: 'Total Land Rank needed', value: entry.unlock },
    // UPKEEP: the cap is round(1 + Grimoire 9 + ceil(Exotic 15) + legend 3), 1 with no account (N.js:109872).
    ...(isFifthColumn(index) ? [{ label: 'Base max level', value: '1 (raised by the Grimoire, the Datadigging exotic upgrade and a legend talent)' }] : [])
  ]
};
