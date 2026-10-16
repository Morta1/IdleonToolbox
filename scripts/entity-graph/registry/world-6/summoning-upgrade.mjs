import { linked } from '../../../../utility/wiki/field-links.mjs';
import { gameTable } from '../data.mjs';
import { nodeId } from '../links.mjs';
import { dropReadout, spaced } from '../text.mjs';
import { loreBossOf, tunnelId } from '../world-7/spelunk-tunnel.mjs';

// UPKEEP: essence colour by SummonUPG column 2 (summoning.ts summonEssenceColor). Not extracted: the essence colour words
// are art labels, never game text.
export const ESSENCE = ['White', 'Green', 'Yellow', 'Blue', 'Purple', 'Red', 'Cyan', 'Teal'];
// UPKEEP: Familiar's level is the number of familiars bought; its table slot.
const FAMILIAR = 2;
// UPKEEP: Muddah's idReq is itself; it unlocks from a Spelunking lore boss instead.
const MUDDAH = 71;
// UPKEEP: two readouts dropReadout does not know: Familiar's reset timer and Sharpened Spikes' spike total.
const READOUTS = [/_*@_*Cost_resets_in_\|$/, /_*@_*Total_Bonus_Spike_DMG:.*$/];
const cleaned = (text) => READOUTS.reduce((out, re) => out.replace(re, ''), dropReadout(text));
// Two upgrades share a name (Another Slot); the essence tells them apart.
const nameOf = (upgrade, data) => (data.summoningUpgrades.filter(({ name }) => name === upgrade.name).length > 1
  ? `${spaced(upgrade.name)} (${ESSENCE[upgrade.colour]})`
  : spaced(upgrade.name));

// The summonPanel table (N.js:109356): the panel fills `>` in any upgrade's text as round(base + b) / divisor, and the
// costLess rows' "cost }% less" as round(1e4 * (1 - 1 / (1 + b/100))) / 100. No table, neither token.
const termsOf = (entry, index, data) => {
  const panel = gameTable(data, 'summonPanel');
  const greater = panel?.greaterPrint;
  return [
    { token: '{', formula: 'linear', args: { perLevel: entry.bonusQty } },
    ...(greater && String(entry.bonus).includes('>')
      ? [{ token: '>', formula: 'growth', args: { func: 'bigBase', x1: greater.base / greater.divisor, x2: entry.bonusQty / greater.divisor } }]
      : []),
    ...(panel?.costLess.includes(index) ? [{ token: '}', formula: 'diminishingPercentRounded', args: { perLevel: entry.bonusQty } }] : [])
  ];
};

// The summonTealLoreBoss table, the DoWeHaveLoreN1 slot Teal Summoning reads (N.js:110200). No table or no lore boss name
// (the tunnel list absent), no field: the tunnel page it would link is gone too.
const tealField = (data) => {
  const teal = gameTable(data, 'summonTealLoreBoss');
  const boss = teal ? loreBossOf(data, teal.loreBoss) : null;
  return boss ? linked({ label: 'Unlocked by', value: `${boss} (Teal Summoning)` }, 'unlockedBy', tunnelId(teal.loreBoss)) : null;
};

// Essence colour n is the summoning sprite SummC<n + 1>, which every colour has (three have no item page to borrow art from).
const essenceIcon = (entry) => `/data/SummC${entry.colour + 1}.png`;

const row = {
  kind: 'summoningupgrade',
  section: 'summoningUpgrades',
  // UPKEEP: keyed by table position, which is the save's Summon[0] slot and the SumUpgIc<i> art.
  key: (entry, index) => `SummonUpg${index}`,
  icon: (entry, index) => `/data/SumUpgIc${index}.png`,
  fallbackIcon: '/data/ClassIcons59.png',
  describe: (entry) => cleaned(entry.bonus),
  effect: (entry, index, data) => ({
    levelLabel: index === FAMILIAR ? 'Familiars bought' : 'Upgrade level',
    // UPKEEP: the buy check is level < maxLvl (N.js:110248), so 9999 is a real cap even though the panel prints "Lv.x/max" only below
    // 9000 (N.js:109356).
    cap: entry.maxLvl,
    terms: termsOf(entry, index, data)
  }),
  // The summonPanel table's ceilBelow: the panel rounds the cost up only below it (N.js:109356). No table, no price.
  cost: (entry, index, data) => {
    const panel = gameTable(data, 'summonPanel');
    return panel
      ? { formula: 'powCeilBelow', args: { base: entry.cost, rate: entry.costExponent, below: panel.ceilBelow }, currency: `${ESSENCE[entry.colour]} Essence`, currencyIcon: essenceIcon(entry) }
      : null;
  },
  fields: (entry, index, data) => {
    const prereq = data.summoningUpgrades?.[entry.idReq];
    return [
      { label: 'Essence', value: ESSENCE[entry.colour] },
      index === MUDDAH
        ? tealField(data)
        : prereq && entry.idReq !== index
          ? linked({ label: 'Unlocked by', value: `${nameOf(prereq, data)} at level 1` }, 'unlockedBy', nodeId(row, null, entry.idReq))
          : null,
      ...(Number(entry.filler) === 1 ? [{ label: 'Summoning Doubler', value: 'Can be doubled' }] : [])
    ].filter(Boolean);
  }
};

export default row;
