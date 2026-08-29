// An achievement is the one entity here that is not a thing in the world: it is a record of having
// done something. It earns a page because players look them up the way they look up a quest - what
// does it want, and what does it pay - and because 60 of them pay a gem count that appears nowhere
// on the site.
//
// The game files them in blocks of seventy, one block per world, and names the art after the block:
// the first World 1 achievement is TaskAchA1. That is where both the category and the icon come
// from, so neither is invented here.
const PER_WORLD = 70;

// Two flags the game keeps that change what an achievement IS, rather than describing it. A steam
// achievement can only be earned in the desktop client, and a secret one hides its own description
// until it is done - the game writes the literal SECRET_ACHIEVEMENT in the text where the objective
// would be.
const secretText = (desc) => (desc || '').replace(/SECRET_ACHIEVEMENT/g, '').trim();

// The list is padded to a round 70 per world, and the padding is not hidden: 72 rows carry the
// name FILLERZZZ_ACH, a description of "-", three FILLERZ rewards and no art. Worlds 5 and 6 are
// where the game has stopped filling them in. They are slots, not achievements.
const isFiller = (name) => /^FILLERZ/.test(name || '');

export const achievementNodes = (achievements) => {
  const nodes = {};
  for (const [index, achievement] of (achievements || []).entries()) {
    if (!achievement?.rawName || isFiller(achievement.name)) continue;
    const world = Math.floor(index / PER_WORLD) + 1;
    nodes[`achievement:${achievement.rawName}`] = {
      kind: 'achievement',
      rawName: achievement.rawName,
      name: achievement.name,
      icon: `/data/${achievement.rawName}.png`,
      category: `World ${world}`,
      description: secretText(achievement.desc) || null,
      // How many of the thing the description asks for. Most are 1, and the description carries the
      // number itself where it matters, so this only shows when it says something the text does not.
      quantity: achievement.quantity > 1 ? achievement.quantity : null,
      steamExclusive: Boolean(achievement.steamExclusive),
      secret: Boolean(achievement.secretAchievement)
    };
  }
  return nodes;
};
