import { gameTable } from '../data.mjs';

// The lampWishCost table (Holes LampWishCost): More Wishes is constant + perLevel L + L^exponent below `below` (then
// capCost, so `below` is its cap), 1000000 Opals the same with its own exponent, the rest L * x2 + x1. No table, no
// price and no cap.
const SPECIAL_WISHES = ['moreWishes', 'opals'];
const costArgs = (entry, index, cost) => {
  const special = SPECIAL_WISHES.map((name) => cost[name]).find(({ wish }) => wish === index);
  if (special) return { constant: special.constant, perLevel: special.perLevel, powScale: 1, exponent: special.exponent };
  return { constant: entry.x1, perLevel: entry.x2 };
};

// UPKEEP: the placeholders each bonus row fills, in column order.
const ROW_TOKENS = ['{', '}', '~'];

// The lampInfiniteResources table (Holes LampBonuses arm 99): its wish fills each token with base + perLevel L / divisor
// instead of a row; the lampBonuses table holds one row per other bonus wish.
const termsOf = (index, data) => {
  const infinite = gameTable(data, 'lampInfiniteResources');
  if (infinite && index === infinite.wish) {
    return Object.entries(infinite)
      .filter(([, fill]) => typeof fill === 'object')
      .map(([token, { base, divisor }]) => ({ token, formula: 'growth', args: { func: 'bigBase', x1: base, x2: infinite.perLevel / divisor } }));
  }
  const row = gameTable(data, 'lampBonuses')?.[index];
  return row ? ROW_TOKENS.map((token, i) => ({ token, formula: 'linear', args: { perLevel: row[i] } })) : [];
};

// UPKEEP: `|` is the option picked when wishing (the-lamp.ts WISH_CHOICES), keyed by wish position. Not extracted: the
// choice labels exist only in the wish panel's draw code.
const CHOICES = {
  1: 'Reset_Conjuror_PTS_Invested,_All_Opals_Invested,_Jar_Collectible_Enchantment_LVs_or_All_Summoning_Doublers',
  3: 'Bravery,_Justice_or_Wisdom_Monument'
};

export default {
  kind: 'lampwish',
  section: 'lampWishes',
  key: (entry, index) => `LampWish${index}`,
  // UPKEEP: the wish art is data/HoleLampUpg<position>.png, and The Lamp's cavern icon is the tile.
  icon: (entry, index) => `/data/HoleLampUpg${index}.png`,
  fallbackIcon: '/etc/Cavern_6.png',
  describe: (entry, index) => (CHOICES[index] ? entry.description.replace('|', `Choices:_${CHOICES[index]}.`) : entry.description),
  effect: (entry, index, data) => {
    const moreWishes = gameTable(data, 'lampWishCost')?.moreWishes;
    return { levelLabel: 'Times wished', cap: index === moreWishes?.wish ? moreWishes.below : null, terms: termsOf(index, data) };
  },
  cost: (entry, index, data) => {
    const cost = gameTable(data, 'lampWishCost');
    return cost
      ? { formula: 'floorPoly', args: costArgs(entry, index, cost), currency: 'Wishes', currencyOne: 'Wish', label: 'Cost of this wish', note: 'No discounts apply.' }
      : null;
  },
  // The wiki fills the base numbers; the game multiplies them by the Zenith Market bonus before printing (the-lamp.ts getLampBonus). World 8 Stuff's text carries no number to qualify, hence the token check.
  fields: (entry, index, data) => (termsOf(index, data).some(({ token }) => entry.description.includes(token)) ? [{ label: 'Bonus shown', value: 'Before the Zenith Market bonus' }] : [])
};
