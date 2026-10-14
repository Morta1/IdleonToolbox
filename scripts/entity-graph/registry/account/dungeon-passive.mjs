// The dungeon lobby's two passive shops, one row over both.
const SHOPS = [
  {
    section: 'dungeonStats',
    prefix: 'DungPassive',
    icon: '/data/DungCredits1.png',
    // UPKEEP: the buy check is 100 > DungUpg[1][t] (N.js:94859).
    cap: 100,
    // UPKEEP: credit passives fill DungeonStatsA, the in-run stat sheet (N.js:87616-87617).
    applies: 'In dungeon runs',
    currency: 'Dungeon Credits',
    currencyOne: 'Dungeon Credit',
    // UPKEEP: PassiveStatCost's constants (N.js:87588).
    cost: { base: 2, scale: 1.5, exponent: 1.04, rate: 1.024, pivot: 60 }
  },
  {
    section: 'dungeonFlurboStats',
    prefix: 'DungFlurbo',
    icon: '/data/DungCredits2.png',
    // UPKEEP: the buy check is 50 > DungUpg[5][t] (N.js:94896).
    cap: 50,
    // UPKEEP: Flurbo passives are read through FlurboShop by stats outside dungeons (N.js:87757, Weapon Power N.js:67899).
    applies: 'Outside dungeons',
    currency: 'Dungeon Flurbos',
    currencyOne: 'Dungeon Flurbo',
    // UPKEEP: PassiveStatCost2's constants (N.js:87590).
    cost: { base: 1, scale: 1.7, exponent: 1.05, rate: 1.027, pivot: 30 }
  }
];

export default {
  kind: 'dungeonpassive',
  section: (data) => SHOPS.flatMap((shop) => (data[shop.section] || []).map((entry, slot) => ({ ...entry, shop, slot }))),
  key: (entry) => `${entry.shop.prefix}${entry.slot}`,
  name: (entry) => entry.effect,
  // The panel draws no per-row art, so each passive shows its shop's currency.
  icon: (entry) => entry.shop.icon,
  // UPKEEP: the panel appends `type` with its underscore removed, so only "%" shows (N.js:94677).
  describe: (entry) => `${entry.effect}:_+{${entry.type === '%' ? '%' : ''}`,
  // The panel prints round(10 x growth) / 10 (N.js:94677-94680).
  effect: (entry) => ({
    levelLabel: 'Passive level',
    cap: entry.shop.cap,
    terms: [{ token: '{', formula: 'rounded', args: { formula: 'growth', args: { func: entry.func, x1: entry.x1, x2: entry.x2 }, digits: 1 } }]
  }),
  cost: (entry) => ({
    formula: 'dungeonPassiveCost',
    args: entry.shop.cost,
    currency: entry.shop.currency,
    currencyOne: entry.shop.currencyOne,
    note: 'No discounts apply.'
  }),
  fields: (entry) => [{ label: 'Applies', value: entry.shop.applies }]
};
