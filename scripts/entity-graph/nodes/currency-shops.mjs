// The shops that do not take coins. The nine town shops are keyed by index in shared-data and read
// as one family; these three are separate lists in the game and each has its own currency, which is
// why they arrive here rather than through shopNodes.
//
// Between them they are the only source 200-odd items have: every premium hat, every storage chest
// past 30, the pearls and the pocketwatches. Without them those pages say nothing about where the
// item comes from at all.
export const CURRENCY_SHOPS = [
  { rawName: 'gem', name: 'Gem_Shop', currency: 'gem' },
  { rawName: 'skull', name: "Killroy's_Skull_Shop", currency: 'skull' },
  { rawName: 'weekly', name: 'Weekly_Boss_Shop', currency: 'token' }
];

export const currencyShopNodes = () => {
  const nodes = {};
  for (const shop of CURRENCY_SHOPS) {
    nodes[`shop:${shop.rawName}`] = {
      kind: 'shop',
      rawName: shop.rawName,
      name: shop.name,
      icon: null,
      category: null,
      currency: shop.currency
    };
  }
  return nodes;
};
