// Everything idleon.wiki puts in a monster's Information box, taken straight from monsters.json.
// The two accuracy figures are not stored: they are the inverse of the game's own hit-chance
// formula (parsers/damage.ts), hitChance = 100 * (0.95 * accuracy / Defence - 0.425), solved for
// 5% and 100%. That works out to half and one-and-a-half times Defence.
const monsterStats = (monster) => {
  const stats = {
    attack: monster?.Damages?.[0],
    health: monster?.MonsterHPTotal,
    defence: monster?.Defence,
    experience: monster?.ExpGiven,
    respawn: monster?.RespawnTime
  };
  for (const key of Object.keys(stats)) {
    if (!stats[key]) delete stats[key];
  }
  return Object.keys(stats).length > 0 ? stats : null;
};

const monsterLocation = (monster, mapNames) => {
  const area = mapNames?.[monster?.mapIndex];
  const location = {};
  if (monster?.worldIndex) location.world = monster.worldIndex;
  // The index rides along so the infobox can link the area to its map page. The name alone cannot:
  // mapNames repeats placeholder entries, so resolving a name back to an index is ambiguous.
  if (area) {
    location.area = area;
    location.mapIndex = Number(monster.mapIndex);
  }
  return Object.keys(location).length > 0 ? location : null;
};

// The game names seven of its monsters "Error": two tutorial spawners, a cut behemoth, Efaunt's
// arm, a boss body part, and two resource nodes. They have no art, no stats worth showing and no
// page on idleon.wiki, so they are not entities. Efaunt's arm is the only one carrying a drop, and
// the card it drops is on the real Efaunt too, so nothing is lost by leaving them all out.
// Two flavours of placeholder. Seven monsters are literally named "Error", and one is named "_",
// which renders as a nameless row in the bestiary and a page at /wiki/monster/nothing with an
// empty title. Neither has a single edge.
export const isRealMonster = (monster) => {
  if (!monster || monster.Name === 'Error') return false;
  return String(monster.Name).replace(/_/g, ' ').trim().length > 0;
};

// monsters.json is the game's table of "things you can hit", and that is wider than the bestiary:
// alongside 267 actual mobs it holds 32 chests, the 8 Divinity souls and 11 Sneaking critters that
// exist only to hang a card on, the two Forges, three Monuments, and 74 mining/chopping/fishing
// /catching nodes.
//
// The game has no field that separates them. `Type` says Monster for the chests and the souls
// alike; `AFKtype` is `error` for a chest but also for the tutorial spawners; `SpecialType` is "a"
// for Efaunt AND for Fire Forge, because it means "special actor, no respawn timer, boss damage
// applies" rather than "boss". idleon.wiki does not derive it either: its Enemies category is 141
// hand-curated pages, which no combination of these fields reproduces.
//
// So this is an editorial rule and not extracted fact, and it keys off the name prefixes because
// nothing better exists. It can go stale on a game update, which is what the test pins.
const PSEUDO_MONSTERS = [
  [/^Chest/, 'Chest'],
  [/^SoulCard/, 'Divinity Soul'],
  [/^CritterCard/, 'Critter'],
  [/^Forge/, 'Forge'],
  // Breeding pets. Every one carries the same placeholder 14,000 HP and drops nothing: they are in
  // this table because the arena fights them, not because they are bestiary entries.
  [/^Pet\d+$/, 'Pet'],
  [/^(bubba|bubbab|poppy|fm_frog|fm_goose)$/, 'Pet'],
  // Sneaking nests and Spelunking caves, both card holders with a stand-in for stats.
  [/^BugNest\d+$/, 'Nest'],
  [/^SpelunkingCard\d+$/, 'Spelunking Cave'],
  // The rocks a talent drops on the ground, and the breeding arena's champion waves.
  [/^rock[GBS]$/, 'Rune'],
  [/^T\d[abc]$/, 'Arena Champion'],
  // The Rift's AFK target is the area itself: riftAll is named The_Rift, which is also the name of
  // map 166 that it stands on, and it is the only monster in the graph whose name matches its own
  // map. The five rift mobs beside it (Rift Spooker, Rift Slug) are real and stay.
  [/^riftAll$/, 'Area']
];

export const monsterCategory = (rawName, monster) => {
  for (const [pattern, label] of PSEUDO_MONSTERS) {
    if (pattern.test(rawName)) return label;
  }
  if (monster?.AFKtype === 'Paying_Respect') return 'Monument';
  return monster?.Type;
};

// They keep their pages: a chest has a real drop table, and Copper Ore's page saying it comes from
// Bronze Chest(W1) is true and worth keeping. They just do not belong in the bestiary listing.
export const isBestiary = (category) => category === 'Monster';

export const monsterNodes = (monsters, mapNames) => {
  const nodes = {};
  for (const [rawName, monster] of Object.entries(monsters)) {
    if (!isRealMonster(monster)) continue;
    nodes[`monster:${rawName}`] = {
      kind: 'monster',
      rawName,
      name: monster.Name,
      icon: `/monsters/${rawName}/static.png`,
      iconFallbacks: [`/afk_targets/${monster.Name}.png`],
      category: monsterCategory(rawName, monster),
      // Has a page, does not belong in the kind's listing. Same idea as COIN's navigable: false.
      ...(isBestiary(monsterCategory(rawName, monster)) ? {} : { catalog: false }),
      stats: monsterStats(monster),
      location: monsterLocation(monster, mapNames)
    };
  }
  return nodes;
};
