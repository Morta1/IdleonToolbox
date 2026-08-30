import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { itemNodes } from './nodes/items.mjs';
import { craftSellPrices } from './craft-prices.mjs';
import { monsterNodes } from './nodes/monsters.mjs';
import { npcQuestNodes } from './nodes/npcs-quests.mjs';
import { npcNodes } from './nodes/npcs.mjs';
import { shopNodes } from './nodes/shops.mjs';
import { currencyShopNodes } from './nodes/currency-shops.mjs';
import { mapNodes } from './nodes/maps.mjs';
import { WORLD_NAMES, worldNodes } from './nodes/worlds.mjs';
import { bubbleNodes, vialNodes } from './nodes/alchemy.mjs';
import { dropEdges } from './edges/drops.mjs';
import { craftEdges } from './edges/crafts.mjs';
import { questItemEdges } from './edges/quest-items.mjs';
import { questNpcEdges } from './edges/quest-npc.mjs';
import { shopEdges } from './edges/shops.mjs';
import { currencyShopEdges } from './edges/currency-shops.mjs';
import { containerEdges } from './edges/containers.mjs';
import { cardEdges } from './edges/cards.mjs';
import { harvestEdges } from './edges/harvests.mjs';
import { codeGrantLabels, itemSourceEdges } from './edges/item-sources.mjs';
import { bundleNodes } from './nodes/bundles.mjs';
import { achievementNodes } from './nodes/achievements.mjs';
import { achievementEdges } from './edges/achievements.mjs';
import { achievementMentionEdges } from './edges/achievement-mentions.mjs';
import { petNodes } from './nodes/pets.mjs';
import { talentNodes } from './nodes/talents.mjs';
import { classNodes } from './nodes/classes.mjs';
import { classEdges } from './edges/classes.mjs';
import { bundlePets, petEdges } from './edges/pets.mjs';
import { mapEdges } from './edges/maps.mjs';
import { worldEdges } from './edges/worlds.mjs';
import { alchemyEdges } from './edges/alchemy.mjs';
import { stampEdges } from './edges/stamps.mjs';
import { resolveEdges } from './resolve.mjs';
import { assignSlugs } from './slugs.mjs';
import { obtainedFrom } from './obtained-from.mjs';
import { recipeUnlocks } from './recipe-unlocks.mjs';
import { aliases } from './aliases.mjs';
import { ignore } from './ignore.mjs';
import { attachHistory } from './history.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', '..', 'data');
const readJson = (name) => JSON.parse(fs.readFileSync(path.join(dataDir, 'website-data', name), 'utf-8'));

const items = readJson('items.json');
const monsters = readJson('monsters.json');
const monsterDrops = readJson('monsterDrops.json');
const crafts = readJson('crafts.json');
const quests = readJson('quests.json');
const cards = readJson('cards.json');
const stamps = readJson('stamps.json');
const vials = readJson('vials.json');
const cauldrons = readJson('cauldrons.json');
const sharedData = readJson('shared-data.json');
const gemShop = readJson('gemShop.json');
const randomList = readJson('randomList.json');
const achievements = readJson('achievements.json');
const taskUnlocks = readJson('taskUnlocks.json');
const companions = readJson('companions.json');
const talents = readJson('talents.json');
// Its own file rather than a shared-data key, so importing it never drags the 1MB bundle onto the
// builds pages that read the same map.
const classPromotions = readJson('classPromotions.json');
// Not a website-data key: it is diffed from the version archive and exported on its own, the way
// sprite-manifest.json is. Absent on a fresh checkout that has not run z-processing yet, so a
// missing file degrades to no history rather than failing the build.
const historyPath = path.join(dataDir, 'entity-history.json');
const entityHistory = fs.existsSync(historyPath) ? JSON.parse(fs.readFileSync(historyPath, 'utf-8')) : {};
const shops = sharedData.shops;
const mapNames = sharedData.mapNames;
const rawMapNames = sharedData.rawMapNames;
const npcRoster = sharedData.npcRoster;
const vialCosts = sharedData.vialCosts;
const anvilProducts = sharedData.anvilProducts;
const skullShop = sharedData.killRoySkullShop;
const weeklyShop = sharedData.weeklyBossesShop;
const itemSources = sharedData.itemSources;
const bundleInfo = sharedData.bundles;
const trappingInfo = sharedData.trappingInfo;
const dungeonKeychains = sharedData.dungeonKeychains;
const companionGroups = sharedData.companionGroups;

const nodes = {
  ...itemNodes(items, monsters, cards, stamps, craftSellPrices(crafts, items)),
  ...monsterNodes(monsters, mapNames),
  ...npcQuestNodes(quests),
  // After npcQuestNodes: the roster covers every quest NPC too, and carries a name and an icon
  // where the quest-derived node has only a raw key.
  ...npcNodes(npcRoster),
  ...shopNodes(shops, mapNames),
  ...currencyShopNodes(),
  ...bundleNodes(itemSources, bundleInfo, items, bundlePets()),
  ...petNodes(companions, companionGroups),
  ...talentNodes(talents),
  ...classNodes(classPromotions),
  ...achievementNodes(achievements),
  ...mapNodes(mapNames, rawMapNames),
  ...vialNodes(vials, vialCosts),
  ...bubbleNodes(cauldrons),
};

// A world is derived from the areas in it, so it can only be built once the map nodes exist.
Object.assign(nodes, worldNodes(nodes));

// Every node addresses a page at /wiki/<kind>/<slug>, so the slug is part of the node, resolved
// once here where the whole set is visible and name collisions can be seen.
assignSlugs(nodes);

const rawEdges = [
  ...dropEdges(monsterDrops, monsters),
  ...craftEdges(crafts),
  ...questItemEdges(quests),
  ...questNpcEdges(quests),
  ...shopEdges(shops, mapNames, items),
  ...currencyShopEdges(gemShop, skullShop, weeklyShop, items),
  ...containerEdges(randomList),
  ...harvestEdges(trappingInfo),
  ...itemSourceEdges(itemSources, items),
  ...achievementEdges(achievements, items),
  // Reads the finished node set rather than a data file: it matches descriptions against the
  // display names every other node already carries.
  ...achievementMentionEdges(nodes),
  // Reads the finished node set too: a class's talents are found by the tab they carry.
  ...classEdges(nodes, classPromotions),
  ...petEdges(nodes),
  ...mapEdges(sharedData),
  // Reads the finished node set too: an area's enemy is named on the monster node.
  ...worldEdges(nodes, sharedData),
  ...alchemyEdges(vials, cauldrons),
  ...stampEdges(stamps),
];

// A card the monster already drops from its own table needs no edge of its own. cardEdges exists
// for the 82 cards the tables never mention - every fish, ore and tree, awarded by the action
// rather than rolled - but it fired for all of them, so 191 monsters listed their card twice: once
// with real odds and once blank, since the card edge carries no chance to merge with.
//
// Appended after the drop edges rather than emitted with them, because knowing which cards are
// already covered means having read those edges first.
const droppedAlready = new Set(rawEdges.filter((edge) => edge.rel === 'drops').map((edge) => `${edge.from}|${edge.to}`));
const cardsNotDropped = cardEdges(cards, items).filter((edge) => !droppedAlready.has(`${edge.from}|${edge.to}`));
rawEdges.push(...cardsNotDropped);

const { edges: resolvedEdges, unresolved } = resolveEdges(nodes, rawEdges, { aliases, ignore });

// The source tables list the same drop several times (once per drop-table slot), which renders as
// the same line repeated in the entity panel. Only byte-identical edges collapse: two edges sharing
// from/to/rel with different meta are genuinely different chance or quantity rolls and both stay.
const seenEdges = new Set();
const edges = resolvedEdges.filter((edge) => {
  const key = `${edge.from}|${edge.to}|${edge.rel}|${JSON.stringify(edge.meta)}`;
  if (seenEdges.has(key)) return false;
  seenEdges.add(key);
  return true;
});

// Which world an entity belongs to, kept as its own field rather than folded into `category`: a
// monster's category already says Ore or Fish, which is worth keeping, and a world is a second axis
// rather than a replacement for the first.
//
// An NPC's world is not on the NPC. It is on the map that hosts it, so it can only be read once the
// edges are resolved. 95 of the 118 have a host map; the other 23 (the event NPCs, the souls, Bort)
// are placed nowhere in the data and keep a null world rather than being given one nobody could
// verify. Clown is the one NPC spanning two worlds, and takes the lower.
//
// A monster's world comes from its own location, which only a map's AFK target has: 116 of 405. The
// rest are bosses, sub-mobs, and a run of things that are not monsters at all (SoulCard1-8, ForgeA
// and ForgeB), and they stay null too.
const worldOf = (label) => {
  const match = /^World (\d+)$/.exec(label || '');
  return match ? Number(match[1]) : null;
};
for (const node of Object.values(nodes)) {
  if (node.kind === 'monster' && node.location?.world != null) node.world = node.location.world;
}
// Which section of the bestiary a monster reads under, taken from the card table.
//
// idleon.wiki's Bestiary is seven world sections plus Boss, Events, Dungeon and The Rift, and it is
// hand-maintained. The card categories turn out to BE that taxonomy: every card carries its area,
// and the ones with no area are filed under Bosses, Dungeons or Events. That is the derivation, so
// the sections match theirs without anybody curating a list.
//
// It also solves the boss problem. A boss has no world anywhere in the data (not worldIndex, not
// mapEnemies, not BossDetails, and its arena is only findable by matching its name against a map's,
// which works for 5 of 27), but the card table knows it is a boss.
// The world half comes from the world roster rather than a second copy of the same seven names.
const CARD_SECTION = {
  ...Object.fromEntries(Object.entries(WORLD_NAMES).map(([index, name]) => [name, `World ${index}`])),
  Bosses: 'Bosses',
  Events: 'Events',
  Dungeons: 'Dungeon'
};

const cardSections = {};
for (const card of Object.values(cards || {})) {
  if (card?.rawName && CARD_SECTION[card.category]) cardSections[card.rawName] = CARD_SECTION[card.category];
}

for (const node of Object.values(nodes)) {
  if (node.kind !== 'monster') continue;
  // The rift mobs carry no card at all, and the bestiary gives them their own section too.
  if (/^rift/i.test(node.rawName)) node.section = 'The Rift';
  // The rare-spawn variants are named for the world they spawn in: w4b4b is Vanillie in World 4.
  // Verified against the monsters that carry both a prefix and a worldIndex: 62 of 62 agree.
  else if (/^w[1-7]/.test(node.rawName)) node.section = `World ${node.rawName[1]}`;
  // A real world beats the card category. Boop is a Blunder Hills mob carrying a Bosses card, and
  // the bestiary reads it under Blunder Hills: where the game actually places a monster, that wins.
  else if (node.world != null) node.section = `World ${node.world}`;
  else if (cardSections[node.rawName]) node.section = cardSections[node.rawName];
}

for (const edge of edges) {
  if (edge.rel !== 'hosts') continue;
  const npc = nodes[edge.to];
  const world = worldOf(nodes[edge.from]?.category);
  if (!npc || npc.kind !== 'npc' || world === null) continue;
  if (npc.world == null || npc.world > world) npc.world = world;
}

// Where an item comes from when no edge can say it: a dungeon run, a voyage, the anvil. Applied
// last so it can be limited to the items nothing else reached.
const sourcedItems = new Set();
for (const edge of edges) {
  if (['drops', 'rewards', 'sells', 'yields'].includes(edge.rel) && nodes[edge.to]?.kind === 'item') sourcedItems.add(edge.to);
  if (edge.rel === 'craftedFrom' && nodes[edge.from]?.kind === 'item') sourcedItems.add(edge.from);
}
// The code-derived labels take precedence: "Dungeon" from an actual DropSomething call beside
// _customBlock_DungeonStat beats the same word guessed from an item's type.
const labels = new Map([
  ...obtainedFrom(items, anvilProducts, randomList, { dungeonKeychains }),
  ...codeGrantLabels(itemSources)
]);
for (const [rawName, label] of labels) {
  const node = nodes[`item:${rawName}`];
  if (node && !sourcedItems.has(`item:${rawName}`)) node.obtainedFrom = label;
}

// The Task Board gates a recipe rather than granting an item, so this annotates the craft instead
// of competing with the sources above: an item whose only source is crafting still needs to say
// that the recipe itself is bought.
let gatedRecipes = 0;
for (const [rawName, gate] of recipeUnlocks(taskUnlocks)) {
  const node = nodes[`item:${rawName}`];
  if (!node) continue;
  node.recipeUnlock = gate;
  gatedRecipes += 1;
}

const withHistory = attachHistory(nodes, entityHistory, crafts);

// Some nodes name art the game never shipped. Point at nothing rather than at a 404, so the UI
// reserves the same empty box it uses for NPCs and quests instead of flashing a broken image.
const publicDir = path.join(__dirname, '..', '..', 'public');
let nulledIcons = 0;
for (const node of Object.values(nodes)) {
  if (!node.icon) {
    delete node.iconFallbacks;
    continue;
  }
  if (fs.existsSync(path.join(publicDir, node.icon))) {
    delete node.iconFallbacks;
    continue;
  }
  // Primary icon missing, check fallbacks
  if (node.iconFallbacks && node.iconFallbacks.length > 0) {
    let found = false;
    for (const fallbackPath of node.iconFallbacks) {
      if (fs.existsSync(path.join(publicDir, fallbackPath))) {
        node.icon = fallbackPath;
        found = true;
        break;
      }
    }
    if (!found) {
      node.icon = null;
      nulledIcons += 1;
    }
  } else {
    node.icon = null;
    nulledIcons += 1;
  }
  delete node.iconFallbacks;
}

// Animation states for the entity page's Animations section: the gif variants that actually
// exist on disk, checked the same way icons are so the list can never point at a 404.
//
// A pet takes the monster's states from the monster's own directory, for the same reason its icon
// reads from afk_targets: the game shrinks the one sprite rather than drawing a second, and every
// one of the 92 pets shares its rawName with the monster it is.
const ANIMATION_VARIANTS = { monster: ['idle', 'walk', 'death'], pet: ['idle', 'walk', 'death'], npc: ['idle'] };
const ANIMATION_DIRS = { monster: 'monsters', pet: 'monsters', npc: 'npcs' };
for (const node of Object.values(nodes)) {
  const variants = ANIMATION_VARIANTS[node.kind];
  if (!variants || !node.rawName) continue;
  const animations = variants.filter((variant) =>
    fs.existsSync(path.join(publicDir, ANIMATION_DIRS[node.kind], node.rawName, `${variant}.gif`)));
  if (animations.length > 0) node.animations = animations;
}

// Slim search index for the wiki-wide search bar: name, kind, slug and icon per navigable
// node, nothing else. WikiSearchBar imports this lazily, so kind and entity pages get search
// without ever downloading the full graph.
const searchIndex = Object.entries(nodes)
  .filter(([, node]) => node.navigable !== false && node.slug)
  .map(([id, node]) => ({
    id,
    kind: node.kind,
    label: (node.name || node.rawName).replace(/_/g, ' '),
    slug: node.slug,
    icon: node.icon ?? null
  }));
fs.writeFileSync(path.join(dataDir, 'wiki-search-index.json'), JSON.stringify(searchIndex));
console.log(`[entity-graph] wiki search index: ${searchIndex.length} entries`);

const stats = {
  nodes: Object.values(nodes).reduce((acc, n) => ({ ...acc, [n.kind]: (acc[n.kind] || 0) + 1 }), {}),
  edges: edges.reduce((acc, e) => ({ ...acc, [e.rel]: (acc[e.rel] || 0) + 1 }), {}),
  unresolved: unresolved.length,
};

const reportPath = path.join(__dirname, 'unresolved-report.json');
let previousCount = 0;
if (fs.existsSync(reportPath)) previousCount = JSON.parse(fs.readFileSync(reportPath, 'utf-8')).length;

fs.writeFileSync(path.join(dataDir, 'entity-graph.json'), JSON.stringify({ nodes, edges }));
fs.writeFileSync(path.join(dataDir, 'graph-stats.json'), JSON.stringify(stats, null, 2));
fs.writeFileSync(reportPath, JSON.stringify(unresolved, null, 2));

console.log('[entity-graph] nodes:', JSON.stringify(stats.nodes));
console.log('[entity-graph] edges:', JSON.stringify(stats.edges));
console.log(`[entity-graph] dropped ${resolvedEdges.length - edges.length} duplicate edges, nulled ${nulledIcons} missing icons`);
console.log(`[entity-graph] task board gates ${gatedRecipes} recipes`);
console.log(`[entity-graph] history on ${withHistory} entities`);
console.log(`[entity-graph] unresolved: ${unresolved.length} (was ${previousCount})`);
if (unresolved.length !== previousCount) {
  console.warn('[entity-graph] WARNING: unresolved count changed. Inspect scripts/entity-graph/unresolved-report.json and triage into aliases.mjs / ignore.mjs.');
}
