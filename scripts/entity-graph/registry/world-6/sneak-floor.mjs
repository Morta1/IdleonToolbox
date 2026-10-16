import { linked } from '../../../../utility/wiki/field-links.mjs';
import { percentText } from '../../../../utility/wiki/odds.mjs';
import { gameTable } from '../data.mjs';
import { nodeId } from '../links.mjs';
import { spaced } from '../text.mjs';
import ninjaItem from './ninja-item.mjs';
import { chanceText, classNeed, doorHpRow, FLOOR_KIND, floorCount, floorKey, floorLoot, floorName, lootSteps, masteryLoot } from './sneak-loot.mjs';

const ninjaInfo = (data, row) => (data.ninjaExtraInfo?.[row] || []).map(Number);

// A row's mastery-scaled value on this floor, from the sneakingFloorRescale table: changemonsterDEF (N.js:80482-80486)
// rescales each row from Mastery 1 by factor x the row's own entry at floor `rate`, and writes the `pinned` rows' floor 0
// outright. `chained` is the door past the rate's own floor, which the in-place rescale reads after the rate has
// already been rescaled. No table or no rescale of this row, no term.
const scaled = (data, row, floor, { chained = false } = {}) => {
  const rescale = gameTable(data, 'sneakingFloorRescale');
  const line = rescale?.rows[row];
  if (!line) return null;
  const pinned = floor === 0 && row in rescale.pinned;
  return {
    formula: 'ninjaMasteryScale',
    args: {
      base: pinned ? rescale.pinned[row] : ninjaInfo(data, row)[floor],
      factor: line.factor,
      rate: ninjaInfo(data, row)[line.rate],
      pinned,
      chained: chained && floor > line.rate
    }
  };
};

const itemId = (rawName) => nodeId(ninjaItem, { rawName });
const itemName = (data, rawName) => spaced(data.ninjaEquipment?.[rawName]?.name ?? rawName);

// The base loot with each entry's real chance at Mastery 0, each line naming its item page.
const lootField = (data, floor) => {
  const loot = floorLoot(data, floor);
  return loot.length ? [linked(
    { label: 'Loot at Mastery 0', value: loot.map(({ item, chance }) => `${itemName(data, item)}: ${chanceText(chance)}`) },
    'hosts',
    ...loot.map(({ item }) => itemId(item))
  )] : [];
};

// The floor's stats, each a placeholder of the effect: the sentence the bot and search read, and the rows of the page's table.
const STATS = [
  ['Door HP', '{'],
  ['Stealth for 0% detection', '}'],
  ['Base Jade Coins per action', '$'],
  ['Base EXP per action', '#']
];

// GenerateItem passes over an item of the reroll family that the account has found before (the sneakingHatReroll table,
// N.js:106322-106323): Ninja[106] holds every item ever generated, pushed in the same handler (N.js:106325), so a hat
// found and trashed still counts. It is a note, not part of the odds: which hats a player has found is save data.
const rerollField = (data, floor) => {
  const reroll = gameTable(data, 'sneakingHatReroll');
  // The game's own test is a substring of the item key (indexOf, N.js:106322), so this one is too.
  if (!reroll || !floorLoot(data, floor).some(({ item }) => item.includes(reroll.family))) return [];
  return [{
    label: 'Hats found before',
    value: `Skipped ${percentText(reroll.chance)} of the time, the roll moving on down the list: the chances above are before that`
  }];
};

// One field per Ninja Mastery that adds to this floor (changemonsterDEF, N.js:80489).
const masteryFields = (data, floor) => {
  const added = masteryLoot(data, floor);
  return [...new Set(added.map(({ mastery }) => mastery))].map((mastery) => {
    const here = added.filter((entry) => entry.mastery === mastery);
    return linked(
      { label: `From Ninja Mastery ${mastery}`, value: here.map(({ item, classType }) => `${itemName(data, item)}${classNeed(data, classType)}`) },
      'hosts',
      ...here.map(({ item }) => itemId(item))
    );
  });
};

export default {
  kind: FLOOR_KIND,
  section: (data) => Array.from({ length: floorCount(data) }, (_, floor) => ({ name: floorName(floor), floor })),
  key: (entry) => floorKey(entry.floor),
  // UPKEEP: NjD<floor> is that floor's door art, drawn at its door (N.js:110010); the app draws it too (Sneaking/PlayersInventory.jsx).
  icon: (entry) => `/data/NjD${entry.floor}.png`,
  fallbackIcon: '/data/NjD0.png',
  describe: () => `${STATS.map(([label, token]) => `${label}: ${token}`).join('@')}.`,
  // UPKEEP: Ninja Mastery has no max: the game raises it whenever every floor is open (N.js:93501).
  // The sneakingFloorRows table: the NinjaInfo rows DetectionDEC (difficulty), the "coin" handler (base Jade Coins) and the
  // "xp" handler (base EXP) read (N.js:106275-106289), both per successful action (N.js:109034 multiplies them by
  // actions per hour for its "/hr" readout).
  effect: (entry, index, data) => {
    const rows = gameTable(data, 'sneakingFloorRows');
    const door = scaled(data, doorHpRow(data), entry.floor, { chained: true });
    const difficulty = scaled(data, rows?.difficulty, entry.floor);
    const coins = scaled(data, rows?.coins, entry.floor);
    const exp = scaled(data, rows?.exp, entry.floor);
    return {
      levelLabel: 'Ninja Mastery',
      from: 0,
      cap: null,
      noMax: true,
      terms: [
        door && { token: '{', ...door },
        difficulty && { token: '}', formula: 'zeroDetectionStealth', args: difficulty },
        coins && { token: '$', ...coins },
        exp && { token: '#', ...exp }
      ].filter(Boolean)
    };
  },
  // The page's own panel: a stats table and a loot table that both follow the Ninja Mastery field.
  panel: (entry, index, data) => {
    const hats = rerollField(data, entry.floor).length ? gameTable(data, 'sneakingHatReroll') : null;
    return {
      stats: STATS.map(([label, token]) => ({ label, token })),
      loot: lootSteps(data, entry.floor).map(({ from, loot }) => ({
        from,
        loot: loot.map(({ item, chance, classType }) => ({
          id: itemId(item),
          chance,
          ...(classType !== undefined ? { need: spaced(data.classes?.[classType]) } : {})
        }))
      })),
      hatNote: hats
        ? `Hats found before are skipped ${percentText(hats.chance)} of the time, the roll moving on down the list. The chances are before that.`
        : null
    };
  },
  fields: (entry, index, data) => [
    ...lootField(data, entry.floor),
    ...rerollField(data, entry.floor),
    ...masteryFields(data, entry.floor)
  ]
};
