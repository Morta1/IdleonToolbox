import { gameTable } from '../data.mjs';

// The dungeon lobby's two passive shops, one row over both. `table` is the shop's key in the dungeonPassiveCaps table
// (the buy clicks' `N > DungUpg[list][t]`, N.js:94859, 94896) and in the dungeonPassiveCost table
// (DungeonCalc:PassiveStatCost and :PassiveStatCost2, N.js:87588, 87590).
const SHOPS = [
  {
    section: 'dungeonStats',
    prefix: 'DungPassive',
    icon: '/data/DungCredits1.png',
    table: 'credits',
    // UPKEEP: credit passives fill DungeonStatsA, the in-run stat sheet (N.js:87616-87617).
    applies: 'In dungeon runs',
    currency: 'Dungeon Credits',
    currencyOne: 'Dungeon Credit'
  },
  {
    section: 'dungeonFlurboStats',
    prefix: 'DungFlurbo',
    icon: '/data/DungCredits2.png',
    table: 'flurbos',
    // UPKEEP: Flurbo passives are read through FlurboShop by stats outside dungeons (N.js:87757, Weapon Power N.js:67899).
    applies: 'Outside dungeons',
    currency: 'Dungeon Flurbos',
    currencyOne: 'Dungeon Flurbo'
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
  effect: (entry, index, data) => ({
    levelLabel: 'Passive level',
    cap: gameTable(data, 'dungeonPassiveCaps')?.[entry.shop.table] ?? null,
    terms: [{ token: '{', formula: 'rounded', args: { formula: 'growth', args: { func: entry.func, x1: entry.x1, x2: entry.x2 }, digits: 1 } }]
  }),
  // No table, no price.
  cost: (entry, index, data) => {
    const cost = gameTable(data, 'dungeonPassiveCost')?.[entry.shop.table];
    if (!cost) return null;
    const { base, scale, exponent, rate, pivot, nudge, every } = cost;
    return {
      formula: 'dungeonPassiveCost',
      args: { base, scale, exponent, rate, pivot, nudge, every },
      currency: entry.shop.currency,
      currencyOne: entry.shop.currencyOne,
      currencyIcon: entry.shop.icon,
      note: 'No discounts apply.'
    };
  },
  fields: (entry) => [{ label: 'Applies', value: entry.shop.applies }]
};
