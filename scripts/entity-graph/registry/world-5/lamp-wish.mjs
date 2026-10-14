// UPKEEP: Holes("LampWishCost") (Holes.js:797): wish 0 is 1 + 2L + L^2 below 11 then 999999, wish 2 is 1 + 2L + L^1.7, the rest L * x2 + x1.
const MORE_WISHES = 0;
const OPALS_WISH = 2;
// UPKEEP: More Wishes stops at 11 because its game cost jumps to 999999 from the 12th wish.
const MORE_WISHES_CAP = 11;
const costArgs = (entry, index) => {
  if (index === MORE_WISHES) return { constant: 1, perLevel: 2, powScale: 1, exponent: 2 };
  if (index === OPALS_WISH) return { constant: 1, perLevel: 2, powScale: 1, exponent: 1.7 };
  return { constant: entry.x1, perLevel: entry.x2 };
};

// UPKEEP: Holes("LampBonuses") (Holes.js:816) "25,10,8;15,40,10;20,35,12;5,1,1;2,2,2", one row per bonus wish.
const BONUS_ROWS = { 4: [25, 10, 8], 6: [15, 40, 10], 8: [20, 35, 12], 10: [5, 1, 1], 11: [2, 2, 2] };
// UPKEEP: wish 7 (Infinite Resources) fills # and $ with 1 + 25L/100 and 1 + 25L/400 instead of the table rows.
const INFINITE_RESOURCES = 7;
// UPKEEP: the placeholders each bonus row fills, in column order.
const ROW_TOKENS = ['{', '}', '~'];

const termsOf = (index) => {
  if (index === INFINITE_RESOURCES) {
    return [
      { token: '#', formula: 'growth', args: { func: 'bigBase', x1: 1, x2: 0.25 } },
      { token: '$', formula: 'growth', args: { func: 'bigBase', x1: 1, x2: 0.0625 } }
    ];
  }
  const row = BONUS_ROWS[index];
  return row ? ROW_TOKENS.map((token, i) => ({ token, formula: 'linear', args: { perLevel: row[i] } })) : [];
};

// UPKEEP: `|` is the option picked when wishing (the-lamp.ts WISH_CHOICES), keyed by wish position.
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
  effect: (entry, index) => ({ levelLabel: 'Times wished', cap: index === MORE_WISHES ? MORE_WISHES_CAP : null, terms: termsOf(index) }),
  cost: (entry, index) => ({ formula: 'floorPoly', args: costArgs(entry, index), currency: 'Wishes', label: 'Cost of this wish', note: 'No discounts apply.' }),
  // The wiki fills the base numbers; the game multiplies them by the Zenith Market bonus before printing (the-lamp.ts getLampBonus). World 8 Stuff's text carries no number to qualify, hence the token check.
  fields: (entry, index) => (termsOf(index).some(({ token }) => entry.description.includes(token)) ? [{ label: 'Bonus shown', value: 'Before the Zenith Market bonus' }] : [])
};
