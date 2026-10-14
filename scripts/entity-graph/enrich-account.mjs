// Account details that ride on pages which already exist: the Breeding Arena rewards on the World 4
// page, the set bonus on a card, and the door requirements on a map. None of them has a name, an
// icon or a cost of its own, so none is a kind.
import { spaced, titleCase } from './registry/text.mjs';
import { NO_ENEMY } from './edges/maps.mjs';

const addFields = (node, fields) => {
  if (!node) return;
  node.fields = [...(node.fields || []), ...fields];
};

// UPKEEP: the extractor keeps the panel's `|` line breaks as spaces (N.js:100373), so a bonus is underscored again before titleCase reads it.
const arenaLine = ({ bonus, wave }) => `Wave ${wave}: ${spaced(titleCase(bonus.replace(/ /g, '_')))}`;

// UPKEEP: the set bonus is round(floor(average card level of the set) x bonus), Cards[3], N.js:85870-85875.
const joinCardSets = (nodes, cardSets) => {
  const sets = Object.values(cardSets || {});
  for (const node of Object.values(nodes)) {
    if (node.kind !== 'item' || !node.card) continue;
    const set = sets.find((entry) => entry.name === node.card.category);
    if (set) node.card.set = { name: set.name, effect: set.effect, bonus: set.bonus };
  }
};

// UPKEEP: LevelReqPortals zeroes every door of a mining or fishing scene once that skill level reaches the number (N.js:67391-67397). The scene's _DefaultExpType is not in website-data, so the AFK target's type stands in, as parsers/portals.ts getMapDoorRequirements does.
const SKILL_UNITS = { MINING: 'Mining', FISHING: 'Fishing' };

const doorLabel = (requirement, door, mapIndex, afkType, multicharReq) => {
  // A door opens once its KillsLeft2Advance is below 1 (N.js:92202).
  if (requirement === 0) return 'Always open';
  if (SKILL_UNITS[afkType]) return `${SKILL_UNITS[afkType]} Lv ${requirement}`;
  if (afkType !== 'FIGHTING') return null;
  const kills = `${requirement.toLocaleString('en-US')} kills`;
  // N.js:92214: only door 0 of a listed map waits for other characters to clear it.
  return door === 0 && multicharReq?.[mapIndex] ? `${kills}, and ${multicharReq[mapIndex]} characters must clear this map` : kills;
};

// A map with no line gets no field. What is left out on purpose: the doors past the requirement
// list and the town doors whose requirement is the sentinel 1 (each opens on a different trigger,
// none of it in data), the tutorial doors and the doors into a placeholder map.
const mapDoors = (nodes, { mapPortals, mapPortalDestinations, mapEnemiesArray, monsters, mapMulticharReq }) => {
  for (const [mapIndex, destinations] of Object.entries(mapPortalDestinations || {})) {
    const node = nodes[`map:${mapIndex}`];
    if (!node) continue;
    const enemy = mapEnemiesArray?.[mapIndex];
    const afkType = enemy && !NO_ENEMY.has(enemy) ? monsters?.[enemy]?.AFKtype : null;
    const lines = (destinations || []).flatMap((destination, door) => {
      if (destination < 0 || String(destination) === String(mapIndex)) return [];
      const target = nodes[`map:${destination}`];
      const requirement = mapPortals?.[mapIndex]?.[door];
      // UPKEEP: Z is the padding marker; only Echoing Egress door 0 leads to one, map 35, a scene name the game never gives a display name.
      if (!target || requirement === undefined || mapEnemiesArray?.[destination] === 'Z') return [];
      const label = doorLabel(Number(requirement), door, mapIndex, afkType, mapMulticharReq);
      return label ? [`To ${spaced(target.name)}: ${label}`] : [];
    });
    if (lines.length) addFields(node, [{ label: 'Doors', value: lines }]);
  }
};

// Runs after the world nodes exist: world:4 is derived from the map nodes.
export const enrichAccount = (nodes, data) => {
  addFields(nodes['world:4'], [{ label: 'Breeding Arena', value: data.arenaBonuses.map(arenaLine) }]);
  joinCardSets(nodes, data.cardSets);
  mapDoors(nodes, data);
};
