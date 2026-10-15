import { noteMissing } from '../registry/data.mjs';

// The seven worlds. The game names them in its card categories and draws each one in UImap1 to
// UImap7; UImap8 exists and is an empty frame, which is the game's own answer to how many have
// shipped.
//
// A world is the one browsable thing above a map. kinds.mjs turns down a Maps catalog, and every
// reason it gives scales with that list's length: 163 areas, most of them reached from the monster
// or the NPC that sent you there. Seven is not that list, and a world is what a player already
// says out loud ("what's in World 3") where an area name is what they arrive at.
//
// It also closes the one hole that comment admits to. Grand Owl Perch, The Oasis and
// How_Did_u_get_here host nothing and connect to nothing, so their pages were reachable from
// nowhere; their world now lists them.
//
// The card categories hold the world names beside the resource, dungeon, boss and event sets. A
// world's category is the one where most cards belong to monsters standing in that world (the
// worldIndex their AFK target map stamps on them); the first such category in cards.json order wins. A world whose card
// monsters no category mostly holds (a patch that moves cards) gets no name, and the build's missing line names worldNames.
export const worldNames = (data) => {
  const counts = new Map();
  const worlds = new Set();
  for (const card of Object.values(data?.cards || {})) {
    const tally = counts.get(card?.category) ?? { cards: 0, worlds: new Map() };
    counts.set(card?.category, tally);
    tally.cards += 1;
    const world = data?.monsters?.[card?.rawName]?.worldIndex;
    if (world == null) continue;
    worlds.add(world);
    tally.worlds.set(world, (tally.worlds.get(world) ?? 0) + 1);
  }
  const names = {};
  for (const [category, tally] of counts) {
    for (const [world, count] of tally.worlds) {
      if (category && count * 2 > tally.cards && !(world in names)) names[world] = category;
    }
  }
  if ([...worlds].some((world) => !(world in names))) noteMissing('worldNames');
  return names;
};

// Built from the finished map nodes rather than from the world roster, so a world the graph has no
// areas for never becomes an empty page.
export const worldNodes = (nodes = {}, data) => {
  const populated = new Set(Object.values(nodes)
    .filter((node) => node.kind === 'map')
    .map((node) => node.category));

  const worlds = {};
  for (const [index, name] of Object.entries(worldNames(data))) {
    if (!populated.has(`World ${index}`)) continue;
    worlds[`world:${index}`] = {
      kind: 'world',
      rawName: index,
      name,
      icon: `/data/UImap${index}.png`,
      // One category across all seven, deliberately. The listing bands by category, and a world
      // per band would be seven headers over one row each. The number rides on `order` instead,
      // which is also what keeps them in game order rather than alphabetical.
      category: 'World',
      order: Number(index)
    };
  }
  return worlds;
};
