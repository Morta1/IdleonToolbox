import { dropReadout, spaced } from '../text.mjs';
import { loreBossOf } from '../world-7/spelunk-tunnel.mjs';

// UPKEEP: essence colour by SummonUPG column 2 (summoning.ts summonEssenceColor).
export const ESSENCE = ['White', 'Green', 'Yellow', 'Blue', 'Purple', 'Red', 'Cyan', 'Teal'];
// UPKEEP: the panel prints "Lv.x/max" only below 9000 (N.js:109356); 9999 means uncapped.
const UNCAPPED_FROM = 9000;
// UPKEEP: the three "cost }% less" upgrades print round(1e4 * (1 - 1 / (1 + b/100))) / 100 (N.js:109356).
const COST_LESS = new Set([49, 57, 72]);
// UPKEEP: Luck of the Draw prints `>` as round(100 + b) / 100.
const LUCK_OF_THE_DRAW = 19;
// UPKEEP: Familiar's level is the number of familiars bought; its table slot.
const FAMILIAR = 2;
// UPKEEP: Muddah's idReq is itself; it unlocks from a Spelunking lore boss instead.
const MUDDAH = 71;
// UPKEEP: Teal Summoning reads DoWeHaveLoreN1 slot 4 (N.js:110200).
const TEAL_LORE_BOSS = 4;
// UPKEEP: the panel rounds the cost up only below 1,000 (N.js:109356).
const CEIL_BELOW = 1000;
// UPKEEP: two readouts dropReadout does not know: Familiar's reset timer and Sharpened Spikes' spike total.
const READOUTS = [/_*@_*Cost_resets_in_\|$/, /_*@_*Total_Bonus_Spike_DMG:.*$/];
const cleaned = (text) => READOUTS.reduce((out, re) => out.replace(re, ''), dropReadout(text));
// Two upgrades share a name (Another Slot); the essence tells them apart.
const nameOf = (upgrade, data) => (data.summoningUpgrades.filter(({ name }) => name === upgrade.name).length > 1
  ? `${spaced(upgrade.name)} (${ESSENCE[upgrade.colour]})`
  : spaced(upgrade.name));

const termsOf = (entry, index) => [
  { token: '{', formula: 'linear', args: { perLevel: entry.bonusQty } },
  ...(index === LUCK_OF_THE_DRAW ? [{ token: '>', formula: 'growth', args: { func: 'bigBase', x1: 1, x2: entry.bonusQty / 100 } }] : []),
  ...(COST_LESS.has(index) ? [{ token: '}', formula: 'diminishingPercentRounded', args: { perLevel: entry.bonusQty } }] : [])
];

export default {
  kind: 'summoningupgrade',
  section: 'summoningUpgrades',
  // UPKEEP: keyed by table position, which is the save's Summon[0] slot and the SumUpgIc<i> art.
  key: (entry, index) => `SummonUpg${index}`,
  icon: (entry, index) => `/data/SumUpgIc${index}.png`,
  fallbackIcon: '/data/ClassIcons59.png',
  describe: (entry) => cleaned(entry.bonus),
  effect: (entry, index) => ({
    levelLabel: index === FAMILIAR ? 'Familiars bought' : 'Upgrade level',
    cap: entry.maxLvl < UNCAPPED_FROM ? entry.maxLvl : null,
    terms: termsOf(entry, index)
  }),
  cost: (entry) => ({
    formula: 'powCeilBelow',
    args: { base: entry.cost, rate: entry.costExponent, below: CEIL_BELOW },
    currency: `${ESSENCE[entry.colour]} Essence`
  }),
  fields: (entry, index, data) => {
    const prereq = data.summoningUpgrades?.[entry.idReq];
    return [
      { label: 'Essence', value: ESSENCE[entry.colour] },
      index === MUDDAH
        ? { label: 'Unlocked by', value: `${loreBossOf(data, TEAL_LORE_BOSS)} (Teal Summoning)` }
        : prereq && entry.idReq !== index ? { label: 'Unlocked by', value: `${nameOf(prereq, data)} at level 1` } : null,
      ...(Number(entry.filler) === 1 ? [{ label: 'Summoning Doubler', value: 'Can be doubled' }] : [])
    ].filter(Boolean);
  }
};
