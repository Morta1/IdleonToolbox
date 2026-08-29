// Where an item comes from when the answer is an activity rather than another entity.
//
// A dungeon weapon drops during a run, a sailing treasure comes off a voyage, a replica nametag is
// a World 7 spelunking find. None of those has a table anybody could link to, so they are a label
// on the item rather than an edge to a page that does not exist. The alternative was inventing a
// node per activity, which would put "Dungeon" in the search box as if it were a place.
//
// Anvil production is the same shape for a different reason: the fourteen CraftMat items are made
// at the anvil with no recipe, which is why no craftedFrom edge ever reached them.
const ACTIVITIES = [
  { label: 'Dungeon', test: (rawName, item) => item?.Type === 'DUNGEON_EVAPORATE' || /_\(Dungeon\)$/.test(item?.displayName || '') },
  { label: 'Sailing', test: (rawName) => /^SailTr/.test(rawName) },
  { label: 'Spelunking', test: (rawName) => /^EquipmentNametagReplica/.test(rawName) }
];

// RANDOlist 17 is the game's own roster of premium items: N.js:104989 uses it as an exclusion set
// beside Gem, Cards, SailTr, Spice and Replica, which is the game saying these are not obtained by
// playing. Anything in it with no other source reads as premium rather than as a dead end.
const PREMIUM_POOL = 17;

// The keychains that roll out of a dungeon run, taken from the game's own roster rather than from
// the item type. The distinction matters: 30 items carry Type KEYCHAIN and only 25 are in
// DungKEYCHAINS, so typing off the category would have told a reader that EquipmentKeychain25 to
// 29 drop in dungeons when the game never puts them in that pool.
const keychainLabels = (dungeonKeychains) => Object.keys(dungeonKeychains || {});

// Deliberately not here: the Tasks board's Unlocks column. It looked like the largest gap left,
// 161 items across seven worlds, and it turned out to label nothing: every item it hands over is
// already craftable or already sold somewhere, so the label would have overwritten a real source
// with a vaguer one. It is a gate on a recipe rather than a source of an item.
export const obtainedFrom = (items, anvilProducts, randomList, rosters = {}) => {
  const labels = new Map();
  const anvil = new Set(Object.values(anvilProducts || {}).map((entry) => entry?.rawName).filter(Boolean));
  const premium = new Set((randomList?.[PREMIUM_POOL] || []).filter((value) => typeof value === 'string'));
  const keychains = new Set(keychainLabels(rosters.dungeonKeychains));

  for (const [rawName, item] of Object.entries(items || {})) {
    if (anvil.has(rawName)) {
      labels.set(rawName, 'Anvil production');
      continue;
    }
    if (keychains.has(rawName)) {
      labels.set(rawName, 'Dungeon');
      continue;
    }
    const activity = ACTIVITIES.find((entry) => entry.test(rawName, item));
    if (activity) {
      labels.set(rawName, activity.label);
      continue;
    }
    if (premium.has(rawName)) labels.set(rawName, 'Premium');
  }
  return labels;
};
