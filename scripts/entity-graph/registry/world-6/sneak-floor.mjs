import { linked } from '../../../../utility/wiki/field-links.mjs';
import { percentText } from '../../../../utility/wiki/odds.mjs';
import { gameTable } from '../data.mjs';
import { nodeId } from '../links.mjs';
import { spaced } from '../text.mjs';
import ninjaItem from './ninja-item.mjs';
import { chanceText, classNeed, DOOR_HP, FLOOR_KIND, floorCount, floorKey, floorLoot, floorName, masteryLoot } from './sneak-loot.mjs';

// UPKEEP: NinjaInfo rows by floor (Ninja block, N.js:106275-106289): 9 is DetectionDEC's difficulty, 10 the "coin" handler's
// base Jade Coins and 11 the "xp" handler's base EXP, both per successful action (N.js:109034 multiplies them by actions
// per hour for its "/hr" readout). Rows 1, 2, 4 and 5 place art and rows 6 to 8 are per character, so none is a floor stat.
const DIFFICULTY = 9;
const COINS = 10;
const EXP = 11;
// UPKEEP: changemonsterDEF (N.js:80482-80486) rescales each row from Mastery 1 by the row's own entry here: the door row by
// floor 10's, the others by floor 11's.
const DOOR_RATE = 10;
const STAT_RATE = 11;
// UPKEEP: the same lines' factors, 0.01 for the door row and 0.1 for the rest.
const DOOR_FACTOR = 0.01;
const STAT_FACTOR = 0.1;

const ninjaInfo = (data, row) => (data.ninjaExtraInfo?.[row] || []).map(Number);

// A row's mastery-scaled value on this floor. `chained` is the door past the rate's own floor, which the in-place rescale
// reads after the rate has already been rescaled.
// UPKEEP: `pinned` keeps floor 0 at its base because the game writes 1 (row 3) and 0.01 (row 9) there (N.js:80484-80485),
// which today are those rows' own floor 0 values; re-check that equality when NinjaInfo changes.
const scaled = (data, row, floor, { factor, rate, pinned = false, chained = false }) => ({
  formula: 'ninjaMasteryScale',
  args: { base: ninjaInfo(data, row)[floor], factor, rate: ninjaInfo(data, row)[rate], pinned, chained }
});

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
  describe: () => 'Door HP: {@Stealth for 0% detection: }@Base Jade Coins per action: $@Base EXP per action: #.',
  // UPKEEP: Ninja Mastery has no max: the game raises it whenever every floor is open (N.js:93501).
  effect: (entry, index, data) => ({
    levelLabel: 'Ninja Mastery',
    from: 0,
    cap: null,
    noMax: true,
    terms: [
      { token: '{', ...scaled(data, DOOR_HP, entry.floor, { factor: DOOR_FACTOR, rate: DOOR_RATE, pinned: entry.floor === 0, chained: entry.floor > DOOR_RATE }) },
      {
        token: '}',
        formula: 'zeroDetectionStealth',
        args: scaled(data, DIFFICULTY, entry.floor, { factor: STAT_FACTOR, rate: STAT_RATE, pinned: entry.floor === 0 })
      },
      { token: '$', ...scaled(data, COINS, entry.floor, { factor: STAT_FACTOR, rate: STAT_RATE }) },
      { token: '#', ...scaled(data, EXP, entry.floor, { factor: STAT_FACTOR, rate: STAT_RATE }) }
    ]
  }),
  fields: (entry, index, data) => [
    ...lootField(data, entry.floor),
    ...rerollField(data, entry.floor),
    ...masteryFields(data, entry.floor)
  ]
};
