// The names the game gives a map slot it never built. 165 of 327 slots carry one, and not one of
// them has an enemy, an NPC or a portal, so they reach the UI as unreachable dead ends. The same
// class of placeholder as the Error monsters, and dropped for the same reason.
const PLACEHOLDER_NAMES = new Set(['z', 'unused', 'playerselect']);

// The game keeps a map's internal name and the name it shows a player in two lists, and a map it
// never finished carries the internal one in both: MapName 3 and MapDispName 3 are each "JungleZ".
// That is the game's own answer to which areas are real, and it is stricter than reading the name:
// NOTHINGLOL displays as "How_Did_u_get_here", a joke area someone deliberately named, while
// TutorialA looks harmless and is a dead end.
//
// The nine it flags keep their pages, because real areas still link to them - Echoing Egress
// connects to Miningg2, and the Secretkeeper stands in TutorialA - and a page nothing can open is
// worse than one nobody browses to. They only leave the atlas.
const isUnnamed = (name, rawName) => Boolean(rawName) && rawName === name;

// Maps are the game's areas, keyed by their index in mapNames. The world is that index in blocks of
// fifty, the same arithmetic createMonsters uses to stamp worldIndex onto a monster.
export const mapNodes = (mapNames, rawMapNames = {}) => {
  const nodes = {};
  for (const [index, name] of Object.entries(mapNames || {})) {
    if (!name) continue;
    if (PLACEHOLDER_NAMES.has(String(name).toLowerCase())) continue;
    nodes[`map:${index}`] = {
      kind: 'map',
      rawName: index,
      name,
      icon: null,
      category: `World ${Math.floor(Number(index) / 50) + 1}`,
      ...(isUnnamed(name, rawMapNames?.[index]) ? { catalog: false } : {})
    };
  }
  return nodes;
};
