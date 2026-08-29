// The Task Board's Unlocks column, which gates a recipe rather than granting an item.
//
// The game's own wording settles what these are. The board's detail panel prints "This selection
// includes the following item recipes:" over the pair, and swaps to "This selection will instantly
// give your account gems:" when the pair is PremiumGem. So an unlock hands over the RECIPE, and
// the item still has to be crafted afterwards.
//
// That is why obtained-from.mjs turns the same list down: all 160 of these items are already
// craftable, so a "Task Board" source label would have replaced a real recipe with a vaguer
// answer. Read as a note ON that recipe it is the missing half instead. 152 of the 160 have
// crafting as their only source, and their page never said the recipe is locked behind a board.
//
// The 67 gem selections are dropped. PremiumGem has dozens of sources already, and nobody opens
// its page to find out that a task board also gives some.
const GEMS = 'PremiumGem';

export const recipeUnlocks = (taskUnlocks) => {
  const gates = new Map();
  (taskUnlocks || []).forEach((column, worldIndex) => {
    (column || []).forEach((selection, position) => {
      for (const entry of selection || []) {
        // The second slot is empty on the selections that hand over one recipe rather than two,
        // and z-processing keeps the pair at a fixed width rather than trimming it.
        if (!entry?.rawName || entry.rawName === GEMS) continue;
        // Earliest board wins. No item is offered twice today, and if one ever were, the world a
        // player reaches first is the answer to "where do I unlock this".
        if (gates.has(entry.rawName)) continue;
        gates.set(entry.rawName, { world: worldIndex + 1, position: position + 1 });
      }
    });
  });
  return gates;
};
