import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { itemNodes } from './nodes/items.mjs';
import { craftSellPrices } from './craft-prices.mjs';
import { monsterNodes } from './nodes/monsters.mjs';
import { npcQuestNodes } from './nodes/npcs-quests.mjs';
import { npcNodes } from './nodes/npcs.mjs';
import { shopNodes } from './nodes/shops.mjs';
import { mapNodes } from './nodes/maps.mjs';
import { bubbleNodes, vialNodes } from './nodes/alchemy.mjs';
import { dropEdges } from './edges/drops.mjs';
import { craftEdges } from './edges/crafts.mjs';
import { questItemEdges } from './edges/quest-items.mjs';
import { questNpcEdges } from './edges/quest-npc.mjs';
import { shopEdges } from './edges/shops.mjs';
import { mapEdges } from './edges/maps.mjs';
import { alchemyEdges } from './edges/alchemy.mjs';
import { stampEdges } from './edges/stamps.mjs';
import { resolveEdges } from './resolve.mjs';
import { assignSlugs } from './slugs.mjs';
import { aliases } from './aliases.mjs';
import { ignore } from './ignore.mjs';

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
const shops = sharedData.shops;
const mapNames = sharedData.mapNames;
const rawMapNames = sharedData.rawMapNames;
const npcRoster = sharedData.npcRoster;
const vialCosts = sharedData.vialCosts;

const nodes = {
  ...itemNodes(items, monsters, cards, stamps, craftSellPrices(crafts, items)),
  ...monsterNodes(monsters, mapNames),
  ...npcQuestNodes(quests),
  // After npcQuestNodes: the roster covers every quest NPC too, and carries a name and an icon
  // where the quest-derived node has only a raw key.
  ...npcNodes(npcRoster),
  ...shopNodes(shops, mapNames),
  ...mapNodes(mapNames, rawMapNames),
  ...vialNodes(vials, vialCosts),
  ...bubbleNodes(cauldrons),
};

// Every node addresses a page at /wiki/<kind>/<slug>, so the slug is part of the node, resolved
// once here where the whole set is visible and name collisions can be seen.
assignSlugs(nodes);

const rawEdges = [
  ...dropEdges(monsterDrops, monsters),
  ...craftEdges(crafts),
  ...questItemEdges(quests),
  ...questNpcEdges(quests),
  ...shopEdges(shops, mapNames),
  ...mapEdges(sharedData),
  ...alchemyEdges(vials, cauldrons),
  ...stampEdges(stamps),
];

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
const CARD_SECTION = {
  Blunder_Hills: 'World 1',
  Yum_Yum_Desert: 'World 2',
  Frostbite_Tundra: 'World 3',
  Hyperion_Nebula: 'World 4',
  "Smolderin'_Plateau": 'World 5',
  Spirited_Valley: 'World 6',
  Shimmerfin_Deep: 'World 7',
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

// Some nodes name art the game never shipped. Point at nothing rather than at a 404, so the UI
// reserves the same empty box it uses for NPCs and quests instead of flashing a broken image.
const publicDir = path.join(__dirname, '..', '..', 'public');
let nulledIcons = 0;
for (const node of Object.values(nodes)) {
  if (!node.icon) continue;
  if (fs.existsSync(path.join(publicDir, node.icon))) continue;
  node.icon = null;
  nulledIcons += 1;
}

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
console.log(`[entity-graph] unresolved: ${unresolved.length} (was ${previousCount})`);
if (unresolved.length !== previousCount) {
  console.warn('[entity-graph] WARNING: unresolved count changed. Inspect scripts/entity-graph/unresolved-report.json and triage into aliases.mjs / ignore.mjs.');
}
