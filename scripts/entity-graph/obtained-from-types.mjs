// Fallback labels read off the item definition itself, for the items that come out of a whole
// system rather than out of anything with a page. Same contract as obtained-from.mjs: build.mjs
// only applies a label to an item that no edge reached.
//
// Each rule reads website-data, and was checked against the code that hands the item out.

// The game marks its dungeon-only gear in the item definition: lvReqToCraft is the string "DUNGEON"
// for all 30 DungEquipment pieces and the three dungeon foods, where every other item has a number.
// DUNGEON_ITEM is the dungeon currency (Cash is dropped inside a run, N.js:97873 behind
// _customBlock_Dungon, and Ice Dollars by Dungeon2Event). The enhancers carry no such field, but are
// dungeon-only by their own drop (N.js:95607, a dungeon trait roll) and the dungeon NPC shop.
//
// DUNGEON_KEY is deliberately absent: the Sesame Seed opens a dungeon and drops from Mimics.
const isDungeon = (rawName, item) => item?.lvReqToCraft === 'DUNGEON'
  || ['DUNGEON_ITEM', 'DUNGEON_FOOD'].includes(item?.Type)
  || /^DungEnhancer\d+$/.test(rawName);

// EVENT_BOX, EVENT_WISH and EVENT_ITEM items that do have a source mostly get it from an event: the
// Easter, Summer and Spring event monsters, the Giftmas and Falloween quests, a seasonal bundle.
// Monsters drop the running event's box through Event_BoxDrop (N.js:63924), and the candles drop
// in the same branch. The unsourced ones are the boxes of events that are not running.
const isEvent = (rawName, item) => /^EVENT_/.test(item?.Type || '');

// A replica trophy is a copy of a trophy already deposited in World 7's display: dragging one steps
// it to the next trophy in Spelunk[16] (N.js:89731), exactly as a replica nametag steps through
// Spelunk[17]. The nametags already read "Spelunking", so the trophies say the same.
const isReplica = (rawName, item) => item?.Type === 'REPLICA_TROPHY';

// The Royal Guardian's marbles. Marble N drops from monsters on maps 50N to 50N+49, World N+1
// (N.js:69172, gated on RoyalG and its MarbleDrop odds), so a marble for a world with no maps cannot
// drop: RGshard7, "NoNotYety_Marble", is that placeholder.
const royalMarbleWorld = (rawName) => {
  const match = /^RGshard(\d+)$/.exec(rawName);
  return match ? Number(match[1]) : null;
};

const hasMapsIn = (world, mapNames) => Object.entries(mapNames || {}).some(([index, name]) =>
  Math.floor(Number(index) / 50) === world && name && !/^(z|unused|playerselect)$/i.test(name));

const isRoyalGuardian = (rawName, item, mapNames) => {
  if (item?.Type !== 'ROYAL_USABLE') return false;
  const world = royalMarbleWorld(rawName);
  return world === null || hasMapsIn(world, mapNames);
};

// The Tempest gear drops from ordinary mobs once a Compass upgrade unlocks it: Weapon_Drop, Ring_Drop
// and Stone_Drop say so in their own text ("Certain mobs can now drop Tempest Rings..."). Which mob
// drops which ring is code (N.js:63979, keyed off the mob's coin drop), so this is a label and not
// an edge. Each family is only labelled while its upgrade still exists.
const TEMPEST = [
  { pattern: /^EquipmentBowsTempest\d+$/, upgrade: 'Weapon_Drop' },
  { pattern: /^EquipmentRingsTempest\d+$/, upgrade: 'Ring_Drop' },
  { pattern: /^StoneTempest[BR]\d+$/, upgrade: 'Stone_Drop' }
];

const isTempestDrop = (rawName, compass) => {
  const family = TEMPEST.find((entry) => entry.pattern.test(rawName));
  return Boolean(family) && Object.values(compass || {}).some((upgrade) => upgrade?.name === family.upgrade);
};

export const typeLabels = (items, { mapNames, compass } = {}) => {
  const labels = new Map();
  for (const [rawName, item] of Object.entries(items || {})) {
    if (isDungeon(rawName, item)) labels.set(rawName, 'Dungeon');
    else if (isEvent(rawName, item)) labels.set(rawName, 'Event');
    else if (isReplica(rawName, item)) labels.set(rawName, 'Spelunking');
    else if (isRoyalGuardian(rawName, item, mapNames)) labels.set(rawName, 'Royal Guardian');
    else if (isTempestDrop(rawName, compass)) labels.set(rawName, 'Compass');
  }
  return labels;
};
