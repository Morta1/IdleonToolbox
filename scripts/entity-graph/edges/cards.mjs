// Which monster a card comes from. The card item's rawName is `Cards` plus the card index, and
// cards.json keys that index to the thing it drops from: CardsC8 is index C8, which cards.json says
// is Fish1, the Goldfish.
//
// It has to be its own edge because the drop tables do not carry it. A card from a skilling
// resource is awarded by the action rather than rolled from a table, so 81 of the 280 cards reached
// their page with nothing pointing at them - every fish, every ore, every tree.
//
// The relation is `drops`, not one of its own: the player's question is the same one "Dropped by"
// already answers, and a card is in every sense a thing that comes off that monster.
export const cardEdges = (cards, items) => {
  const byIndex = new Map();
  for (const card of Object.values(cards || {})) {
    if (card?.cardIndex && card?.rawName) byIndex.set(String(card.cardIndex), card.rawName);
  }

  const edges = [];
  for (const [rawName, item] of Object.entries(items || {})) {
    if (item?.Type !== 'CARD') continue;
    const source = byIndex.get(rawName.replace(/^Cards/, ''));
    if (!source) continue;
    edges.push({
      from: `monster:${source}`,
      to: `item:${rawName}`,
      rel: 'drops',
      // No chance: a card's rate is the monster's own card drop chance, which is a formula over
      // account bonuses rather than a number on a table.
      meta: { card: true },
      source: 'cards'
    });
  }
  return edges;
};
