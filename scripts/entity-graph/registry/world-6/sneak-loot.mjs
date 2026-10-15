// What a sneaking floor drops, shared by the floor pages and the item pages so the two always print the
// same odds. Reads website-data only: the base lists are NinjaInfo rows, what Ninja Mastery adds is
// gameTables.sneakingMasteryDrops (z-processing, located in the game's changemonsterDEF).
import { oneInOrNothing, percentLabel } from '../../../../utility/wiki/odds.mjs';
import { gameTable, listAt, listIndex } from '../data.mjs';
import { spaced } from '../text.mjs';

export const FLOOR_KIND = 'sneakfloor';
export const floorKey = (floor) => `SneakFloor${floor}`;
// The floor page's id, built from the same kind and key the floor row uses.
export const floorId = (floor) => `${FLOOR_KIND}:${floorKey(floor)}`;
export const floorName = (floor) => `Floor ${floor + 1}`;

// DoorMaxHP reads the NinjaInfo row listIndexes.sneakDoorHp names, by floor, and the game walks that row for every floor
// (N.js:93512), so its length is the floor count.
export const doorHpRow = (data) => listIndex(data, 'sneakDoorHp');
export const floorCount = (data) => (listAt(data.ninjaExtraInfo, data, 'sneakDoorHp') || []).length;

// GenerateItem rolls the list NinjaInfo[first + floor], first being listIndexes.sneakFloorLoot, item then roll chance
// (N.js:106320). It (N.js:106320-106323) walks the list in order and keeps the first entry whose roll hits, the last one
// always: an entry's real chance is its own roll times every miss above it, and the last takes what is left.
// Owned hats are not folded in: the floor page says so in a note.
export const walkChances = (list) => {
  const pairs = [];
  for (let i = 0; i + 1 < list.length; i += 2) pairs.push([list[i], Number(list[i + 1])]);
  let left = 1;
  return pairs.map(([item, roll], i) => {
    const chance = i === pairs.length - 1 ? left : left * roll;
    left -= chance;
    return { item, chance };
  });
};

// The floor's base loot with each entry's real chance, an item listed twice summed into its first line.
export const floorLoot = (data, floor) => walkChances(listAt(data.ninjaExtraInfo, data, 'sneakFloorLoot', floor) || [])
  .reduce((loot, { item, chance }) => {
    const seen = loot.find((entry) => entry.item === item);
    if (seen) seen.chance += chance;
    else loot.push({ item, chance });
    return loot;
  }, [])
  .filter(({ chance }) => chance > 0);

// What each Ninja Mastery adds to this floor, as { mastery, item, classType? } in the game's insertion order.
// With the table absent nothing is added.
export const masteryLoot = (data, floor) => {
  const drops = gameTable(data, 'sneakingMasteryDrops');
  const first = listIndex(data, 'sneakFloorLoot');
  if (!drops || first === null) return [];
  return drops
    .filter(({ list }) => list === first + floor)
    .flatMap(({ mastery, classType, items }) => items.map(({ item }) => ({ mastery, item, ...(classType !== undefined ? { classType } : {}) })));
};

// "1 in 25 (4.00%)", or the percentage alone where "1 in N" would round to 1 ("75.0%").
export const chanceText = (chance) => {
  const odds = oneInOrNothing(chance);
  return odds ? `${odds} (${percentLabel(chance)})` : percentLabel(chance);
};

// UPKEEP: hasClassTypeN compares its number with each character's CharacterClass, the class's index in the classes list (N.js:106709).
export const classNeed = (data, classType) => (classType === undefined ? '' : ` (needs a ${spaced(data.classes?.[classType])})`);
