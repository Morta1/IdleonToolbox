// What a craftable item actually sells for.
//
// An item's `sellPrice` field is not the price of anything you can craft. The game's own lookup
// (`_customBlock_RunCodeOfTypeXforThingY("SellPrice", …)`) reads a precomputed map first and only
// falls back to the field when the item has no entry in it:
//
//   SellPrice(item) = ItemzzSellPricesz[item]            if the item is on an anvil tab
//                     round(item.sellPrice * multiplier) otherwise
//
// and that map is built in one pass over the anvil tabs, each entry summing its own recipe:
//
//   ItemzzSellPricesz[item] = Σ SellPrice(material) * quantity
//
// Thief Hood's field says 8,500. The game says 1,025, which is a Copper Helmet plus 15 Iron Bars
// plus 40 Bean Slices. Printing the field would have been printing a number the game never uses.
//
// The multiplier is the player's bribe and alchemy bonus, so it is 1 for a wiki with no save. That
// is also what idleon.wiki prints: Copper Helmet reads 340 there, which is this function's answer,
// where a save carrying +10% has the game store 380.
//
// Verified exactly: computed against a live save's own map, all 412 anvil entries match.

// The pass is ORDER DEPENDENT and the order is the anvil's. A material crafted on a later tab has
// no entry yet when its consumer is reached, so it contributes its raw field rather than its
// recipe. crafts.json is emitted in anvil order, which is what makes this reproducible.
//
// The ten dungeon-shop crafts in crafts.json are not on an anvil tab, so the game keeps their field
// and so do we. They are exactly the crafts paid for in a currency, which is how they are told
// apart without reading the game's tab list.
const isAnvilCraft = (craft) => !(craft.materials || []).some((material) => material.subType === 'CURRENCY');

export const craftSellPrices = (crafts, items) => {
  const prices = new Map();
  const raw = (rawName) => Number(items?.[rawName]?.sellPrice ?? 0);
  const priceOf = (rawName) => (prices.has(rawName) ? prices.get(rawName) : raw(rawName));

  for (const craft of Object.values(crafts || {})) {
    if (!craft?.rawName || !isAnvilCraft(craft)) continue;
    let sum = 0;
    for (const material of craft.materials || []) {
      sum += priceOf(material.rawName) * Number(material.itemQuantity || 0);
    }
    // A recipe whose materials are all worthless leaves the item with no price rather than a zero.
    if (sum > 0) prices.set(craft.rawName, sum);
  }
  return prices;
};
