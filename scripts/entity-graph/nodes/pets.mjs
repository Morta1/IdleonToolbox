// The companions the game calls pets: the ones that follow you around and carry an account bonus,
// and the reason most of the premium bundles exist.
//
// They are worth a category of their own rather than folding into monsters. A pet shares a monster's
// name and art because it IS that monster shrunk down, but nothing else about it is the same: it
// drops nothing, spawns nowhere, and what a reader wants from it is the bonus and where to get it.
//
// The list arrives with the unreleased ones still in it, and the game says so itself: every one of
// the 82 entries outside companionGroups carries the effect "Not officially in the game and may
// never be". That check is exact - the 92 grouped entries and the 82 flagged ones partition the
// file with nothing left over - so grouping is what decides whether a pet is real.
const UNRELEASED = 'Not_officially_in_the_game_and_may_never_be';

// `{` is the game's plus sign in these strings, not a value placeholder. The number is already
// written out beside it: Vanillie reads "{2500%_additive_Gold_Food_bonus_effect" and Armadillo
// "{100%_additive_Crystal_Monster_Spawn_chance". So it substitutes to "+", unlike a vial or a
// stamp description where `{` IS the value and the bonus has to be filled in.
//
// It is not always the pet's own bonus either, which is why nothing is substituted in: Mr Pig
// carries bonus 1 and reads "{2_Friend_Bonus_Slots". Checked all 30 braced effects and every one
// reads correctly as a plus. The trailing comma is the game's own typo, on Hedgehog.
const effectText = (text) => (text || '').replace(/{/g, '+').replace(/,\s*$/, '') || null;

// The bands the game itself sorts them into on the pet screen. Names are the game's.
const groupOf = (companionGroups, index) => (companionGroups || [])
  .find((group) => group?.indices?.includes(index))?.name || null;

export const petNodes = (companions, companionGroups) => {
  const nodes = {};
  for (const [index, pet] of (companions || []).entries()) {
    const group = groupOf(companionGroups, index);
    if (!pet?.name || !pet?.rawName || !group || pet.effect === UNRELEASED) continue;
    nodes[`pet:${pet.rawName}`] = {
      kind: 'pet',
      rawName: pet.rawName,
      name: pet.name,
      // The pet's art is the monster's art: the game shrinks the same sprite rather than drawing a
      // second one, which is why this reads from afk_targets like the monster page does.
      icon: `/afk_targets/${pet.name}.png`,
      category: group,
      description: effectText(pet.effect),
      // What the pet is worth in the World 7 tournament, and what the same pet is worth once it has
      // been upgraded. Both are on the node because the upgrade is a different pet in play but the
      // same page to a reader.
      tourPower: pet.tourPower ?? null,
      upgradedTourPower: pet.upgradedTourPower ?? null,
      upgradedEffect: effectText(pet.upgradedEffect)
    };
  }
  return nodes;
};
