// An item that opens into another item. N.js:89786 is the whole mechanism: dragging one of the
// obol boxes rolls a float 0-100 and walks a weighted list until the roll falls under an entry's
// number, so the list is [name, cumulative weight] pairs and the chance of any one entry is its
// weight minus the previous.
//
// This is the only source obols have. Nothing drops them and nothing crafts them, so before this
// every obol page was a dead end.
//
// gemPouchPools (_event_InvItem5custom) names each box's pool in randomList, which is the game's
// RANDOlist: 22 is silver, 23 is gold, 77 the boss obols. The hyper obols are not a list at all,
// they are a randomInt over a prefix and a number, so each of them is as likely as the next.
import { gameTable } from '../registry/data.mjs';

const evenChance = (count) => (count ? Math.round((100 / count) * 100) / 100 : 0);
const hyperNames = ({ prefix, min, max }) => Array.from({ length: max - min + 1 }, (_, i) => `${prefix}${min + i}`);

// A pool is either [name, weight, name, weight, ...] or a plain list of names with no weights at
// all, which is how RANDOlist 77 stores the five boss obols. An even split is the honest reading of
// the second form: the game picks it with randomInt.
const weightedEntries = (pool) => {
  const list = (pool || []).map((value) => String(value));
  const weighted = list.length > 1 && /^\d+(\.\d+)?$/.test(list[1]);
  if (!weighted) {
    const chance = evenChance(list.length);
    return list.map((rawName) => ({ rawName, chance }));
  }
  const entries = [];
  let previous = 0;
  for (let index = 0; index + 1 < list.length; index += 2) {
    const cumulative = Number(list[index + 1]);
    entries.push({
      rawName: list[index],
      chance: Math.round((cumulative - previous) * 100) / 100
    });
    previous = cumulative;
  }
  return entries;
};

export const containerEdges = (randomList, data) => {
  const edges = [];
  const push = (box, rawName, chance) => {
    if (!rawName || rawName === 'Blank') return;
    edges.push({
      from: `item:${box}`,
      to: `item:${rawName}`,
      rel: 'yields',
      meta: chance > 0 ? { chance } : {},
      source: 'containers'
    });
  };

  for (const [box, source] of Object.entries(gameTable(data, 'gemPouchPools') || {})) {
    if (source.pool != null) {
      for (const entry of weightedEntries(randomList?.[source.pool])) push(box, entry.rawName, entry.chance);
    } else {
      const names = hyperNames(source);
      for (const rawName of names) push(box, rawName, evenChance(names.length));
    }
  }
  return edges;
};
