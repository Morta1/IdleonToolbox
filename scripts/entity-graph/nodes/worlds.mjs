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
export const WORLD_NAMES = {
  1: 'Blunder_Hills',
  2: 'Yum_Yum_Desert',
  3: 'Frostbite_Tundra',
  4: 'Hyperion_Nebula',
  5: "Smolderin'_Plateau",
  6: 'Spirited_Valley',
  7: 'Shimmerfin_Deep'
};

// Built from the finished map nodes rather than from the roster above, so a world the graph has no
// areas for never becomes an empty page.
export const worldNodes = (nodes = {}) => {
  const populated = new Set(Object.values(nodes)
    .filter((node) => node.kind === 'map')
    .map((node) => node.category));

  const worlds = {};
  for (const [index, name] of Object.entries(WORLD_NAMES)) {
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
