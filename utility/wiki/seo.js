// Per-entity title and description for the routed wiki pages. One exported page per entity means
// one title per entity, which is the whole reason B exists: 3,466 pages sharing the word "Wiki"
// would be 3,466 duplicates as far as search is concerned.

import { entityName } from './names.mjs';
import { levelledText } from './effects.mjs';
import { KIND_LABELS } from './kind-labels.mjs';

const KIND_WORD = {
  item: 'item',
  monster: 'monster',
  npc: 'NPC',
  quest: 'quest',
  achievement: 'achievement',
  class: 'class',
  talent: 'talent',
  pet: 'pet',
  shop: 'shop',
  station: 'crafting station',
  chip: 'lab chip',
  jewel: 'lab jewel',
  meal: 'meal',
  spice: 'cooking spice',
  prayer: 'prayer',
  building: 'construction building',
  vault: 'Upgrade Vault upgrade',
  starsign: 'star sign',
  constellation: 'star sign constellation',
  postbox: 'Post Office box',
  sigil: 'alchemy sigil',
  arcade: 'arcade shop upgrade',
  god: 'divinity god',
  artifact: 'sailing artifact',
  superbit: 'gaming superbit',
  equinox: 'equinox upgrade',
  jade: 'jade emporium upgrade',
  world: 'world',
  map: 'area',
  vial: 'alchemy vial',
  bubble: 'alchemy bubble',
  poppy: 'Poppy upgrade',
  tarpit: 'Tar Pit upgrade',
  weeklyboss: 'weekly boss'
};

// What a player is actually searching for when they look an entity up. Ordered by how often the
// section is the reason someone opened the page, and capped at three so the description stays
// inside the ~155 characters search results show. `otherKind` counts only counterparts of that kind,
// for a relation several systems share: a legend talent's max level is raised by research squares,
// and a map is where observations and totems sit, not only constellations.
const PHRASES = [
  { rel: 'drops', dir: 'from', phrase: (n) => `${n} drops` },
  { rel: 'drops', dir: 'to', phrase: (n) => `dropped by ${n} ${n === 1 ? 'monster' : 'monsters'}` },
  { rel: 'gathers', dir: 'to', phrase: (n) => `gathered from ${n} skilling ${n === 1 ? 'node' : 'nodes'}` },
  { rel: 'gathers', dir: 'from', phrase: (n) => `gives ${n} ${n === 1 ? 'resource' : 'resources'}` },
  { rel: 'craftedFrom', dir: 'from', phrase: () => 'recipe' },
  { rel: 'craftedFrom', dir: 'to', phrase: (n) => `used in ${n} ${n === 1 ? 'recipe' : 'recipes'}` },
  { rel: 'refinedFrom', dir: 'from', phrase: () => 'refinery salt' },
  { rel: 'refinedFrom', dir: 'to', phrase: (n) => `used in ${n} refinery ${n === 1 ? 'salt' : 'salts'}` },
  { rel: 'rewards', dir: 'from', phrase: (n) => `${n} ${n === 1 ? 'reward' : 'rewards'}` },
  { rel: 'rewards', dir: 'to', phrase: () => 'quest reward' },
  { rel: 'spawns', dir: 'to', phrase: (n) => `found in ${n} ${n === 1 ? 'area' : 'areas'}` },
  { rel: 'spawns', dir: 'from', phrase: (n) => `${n} ${n === 1 ? 'enemy' : 'enemies'}` },
  { rel: 'gives', dir: 'from', phrase: (n) => `${n} ${n === 1 ? 'quest' : 'quests'}` },
  { rel: 'sells', dir: 'from', phrase: (n) => `sells ${n} ${n === 1 ? 'item' : 'items'}` },
  { rel: 'sells', dir: 'to', phrase: () => 'sold in shops' },
  { rel: 'produces', dir: 'from', phrase: (n) => `produces ${n} ${n === 1 ? 'item' : 'items'}` },
  { rel: 'produces', dir: 'to', phrase: () => 'produced at the anvil' },
  { rel: 'buys', dir: 'from', phrase: (n) => `takes ${n} ${n === 1 ? 'item' : 'items'} in trade` },
  { rel: 'buys', dir: 'to', phrase: () => 'traded to Glimbo' },
  { rel: 'maxRaisedBy', dir: 'from', otherKind: 'item', phrase: (n) => `max level raised by ${n} ${n === 1 ? 'item' : 'items'}` },
  { rel: 'locatedIn', dir: 'to', otherKind: 'constellation', phrase: (n) => `${n} ${n === 1 ? 'constellation' : 'constellations'}` },
  { rel: 'hosts', dir: 'from', phrase: (n) => `${n} ${n === 1 ? 'NPC' : 'NPCs'}` },
  { rel: 'contains', dir: 'from', phrase: (n) => `${n} ${n === 1 ? 'area' : 'areas'}` },
  { rel: 'belongsTo', dir: 'to', phrase: (n) => `${n} class ${n === 1 ? 'upgrade' : 'upgrades'}` },
  { rel: 'upgradedWith', dir: 'from', phrase: () => 'upgrade material' },
  { rel: 'upgradedWith', dir: 'to', phrase: (n) => `upgrades ${n} ${n === 1 ? 'bonus' : 'bonuses'}` }
];

export const entityTitle = (node) => `${entityName(node)} | Idleon Toolbox`;

export const entityDescription = (node, edges, id) => {
  const name = entityName(node);
  const counts = {};
  for (const edge of edges) {
    const dir = edge.from === id ? 'from' : 'to';
    const key = `${edge.rel}|${dir}`;
    // Count distinct counterparts, not edges: one monster reaching one item through three drop
    // tables is one monster, and "dropped by 248 monsters" when there are 198 is simply wrong.
    (counts[key] = counts[key] || new Set()).add(dir === 'from' ? edge.to : edge.from);
  }

  const parts = PHRASES
    .map(({ rel, dir, otherKind, phrase }) => {
      const others = [...(counts[`${rel}|${dir}`] || [])];
      const size = otherKind ? others.filter((other) => other.startsWith(`${otherKind}:`)).length : others.length;
      return size ? phrase(size) : null;
    })
    .filter(Boolean)
    .slice(0, 3);

  const kind = KIND_WORD[node.kind] || KIND_LABELS[node.kind]?.toLowerCase() || node.kind;
  const lead = `${name} is a Legends of Idleon ${kind}`;
  const tail = parts.length ? `: ${parts.join(', ')}.` : '.';
  // The entity's own description earns its place only when there is room left for it.
  const body = `${lead}${tail}`;
  // A template description reads filled at level 1, the same sentence the page opens on.
  const text = node.effect ? levelledText(node, 1) : node.description?.replace(/_/g, ' ');
  const own = text ? ` ${text}` : '';
  return `${body}${own}`.replace(/\s+/g, ' ').trim().slice(0, 300);
};
