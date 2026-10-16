// What the three currency shops sell. Same `sells` relation the town shops use, so an item's
// "Sold by" section covers all of them at once; the price carries its currency in meta because
// these are gems, skulls and boss tokens rather than coins.
//
// More than half of what the gem shop sells is not an item: 57 rows are daily resets, inventory
// slots and subscription ribbons, which have a price and a picture but never enter an inventory.
// They are filtered against items.json rather than named in ignore.mjs, because the list changes
// with every sale the game runs and a hand-kept copy would drift within a patch.
//
// A rawName ending in `#` is the game's wildcard for "a random one of these", which is not an
// entity either.
export const realItem = (items) => (rawName) => Boolean(rawName)
  && rawName !== 'Blank'
  && !rawName.endsWith('#')
  && Boolean(items?.[rawName]);

const sells = (shop, rawName, price, currency, meta = {}) => ({
  from: `shop:${shop}`,
  to: `item:${rawName}`,
  rel: 'sells',
  meta: { ...(price > 0 ? { price, currency } : {}), ...meta },
  source: 'currency-shops'
});

// gemShop.json is five groups of named sections, each holding the rows the shop draws. `cost` is in
// gems, and `quantity` is how many of the item one purchase gives, which is not always one: a time
// candy bundle hands over ten.
const gemShopEdges = (gemShop, isRealItem) => {
  const edges = [];
  for (const group of Object.values(gemShop || {})) {
    for (const section of Object.values(group?.sections || {})) {
      for (const entry of section || []) {
        if (!isRealItem(entry?.rawName)) continue;
        edges.push(sells('gem', entry.rawName, Number(entry.cost || 0), 'gem',
          entry.quantity > 1 ? { quantity: Number(entry.quantity) } : {}));
      }
    }
  }
  return edges;
};

// Killroy's shop is a flat list whose `bonusName` is the item, `x1` the skull price and `x3` how many
// one purchase hands over. `x2` 1 means the row drops `bonusName`; 0 means a special handler, and
// `Timecandy1` is the placeholder those rows carry, so they sell nothing.
// UPKEEP: re-check that x2 === 1 is still the only rows N.js drops an item for (the Killroy purchase handler) on a game patch. Not extracted: it is the purchase handler's behaviour, not a value the data carries.
export const skullRowSellsItem = (entry, isRealItem) => Number(entry?.x2) === 1 && isRealItem(entry?.bonusName);

const skullShopEdges = (skullShop, isRealItem) => (skullShop || [])
  .filter((entry) => skullRowSellsItem(entry, isRealItem))
  .map((entry) => sells('skull', entry.bonusName, Number(entry.x1 || 0), 'skull',
    Number(entry.x3) > 1 ? { quantity: Number(entry.x3) } : {}));

// The weekly shop is two lists: the UI skins first, then the items. Both are priced the same way.
// Rows with `x2` 0 are not items (the "Skulls" row, Quest69, deposits skulls as currency).
// UPKEEP: the Starbooks are the only x2 = 0 rows that hand over an item, so re-check that on a game patch. Not extracted: it is the purchase handler's behaviour, not a value the data carries.
export const weeklyRowSellsItem = (entry, isRealItem) => (Number(entry?.x2) === 1 || entry?.rawName === 'TalentBook1')
  && isRealItem(entry?.rawName);

const weeklyShopEdges = (weeklyShop, isRealItem) => (weeklyShop || [])
  .flat()
  .filter((entry) => weeklyRowSellsItem(entry, isRealItem))
  .map((entry) => sells('weekly', entry.rawName, Number(entry.x1 || 0), 'token'));

export const currencyShopEdges = (gemShop, skullShop, weeklyShop, items) => {
  const isRealItem = realItem(items);
  return [
    ...gemShopEdges(gemShop, isRealItem),
    ...skullShopEdges(skullShop, isRealItem),
    ...weeklyShopEdges(weeklyShop, isRealItem)
  ];
};
