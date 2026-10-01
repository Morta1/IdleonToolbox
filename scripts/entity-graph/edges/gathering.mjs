import { isRealMonster } from '../nodes/monsters.mjs';

// What a skilling node hands over: Copper Ore off the Copper rock, Wispy Lumber off the Wispy Tree.
//
// None of it is in a drop table. A node's table holds its card and its rare rolls, and the resource
// itself is awarded by the action, so before this the only thing pointing at an ore, a log or a bug
// was the colosseum chest that happens to pay out in it. Fifteen of them had nothing at all.
//
// The rule is the game's own: for MINING, CHOPPIN and CATCHING the item is the AFK target's own
// rawName (N.js:69695, :69696 and :69700 set the 3D printer's sample type to the target itself).
// Every one of those nodes has an item of the same name, which is the same fact seen from the
// other side.
//
// FISHING is the exception: a fishing spot is not the fish. Small Fish yields one of Fish1-4 by
// line depth, read from the game's FishPools map, which website-data does not export yet. The
// parameter is here so the edges arrive the day it does.
const SKILLS = { MINING: 'Mining', CHOPPIN: 'Choppin', CATCHING: 'Catching' };

export const gatherEdges = (monsters, items, fishPools = {}) => {
  const edges = [];
  for (const [rawName, monster] of Object.entries(monsters || {})) {
    if (!isRealMonster(monster)) continue;
    const skill = SKILLS[monster?.AFKtype];
    if (skill && items?.[rawName]) {
      edges.push({ from: `monster:${rawName}`, to: `item:${rawName}`, rel: 'gathers', meta: { skill }, source: 'gathering' });
    }
    if (monster?.AFKtype !== 'FISHING') continue;
    // FishPools[spot][0] is the fish at each of the four depths. The two late pools repeat one fish
    // four times, so a fish is linked once with every depth it sits at.
    const depths = new Map();
    (fishPools?.[rawName]?.[0] || []).forEach((fish, depth) => {
      if (!items?.[fish]) return;
      depths.set(fish, [...(depths.get(fish) || []), depth + 1]);
    });
    for (const [fish, at] of depths) {
      edges.push({ from: `monster:${rawName}`, to: `item:${fish}`, rel: 'gathers', meta: { skill: 'Fishing', depths: at }, source: 'gathering' });
    }
  }
  return edges;
};
