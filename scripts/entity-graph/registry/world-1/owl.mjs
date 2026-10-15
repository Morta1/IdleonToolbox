import { gameTable } from '../data.mjs';

// The Owl's feather shop (owl.ts parseOwl). Each upgrade's text carries its own number: `}` is the
// per-level bonus from the owlBonusPerFeather table, `@` is Feather Cheapener's diminishing
// discount, `{` is Feather Restart's multiplier. A page has no save, so mega feathers and every
// cost reducer read as zero.

// With no per-feather bonus behind it, the `}` is left as written.
const perFeatherTerm = (index, data) => {
  const perLevel = gameTable(data, 'owlBonusPerFeather')?.[index];
  return perLevel === undefined ? [] : [{ token: '}', formula: 'linear', args: { perLevel } }];
};

// Feather Cheapener's `@`: cheapenerPerLevel % per level, from the owlCost table (Summoning:OwlCost's 10 x OLA[257]).
const cheapenerTerm = (data) => {
  const perLevel = gameTable(data, 'owlCost')?.cheapenerPerLevel;
  return perLevel == null ? [] : [{ token: '#', formula: 'diminishingPercent', args: { perLevel } }];
};

// Feather Restart's `{`: restartBase^(restarts + 1), from the owlFeatherRate table (Summoning2:OwlFeatherRate's
// pow(3 + 2 x megaFeather6, restarts) with no mega feathers); the exponent is Feather Restart's own level.
const restartTerm = (data) => {
  const base = gameTable(data, 'owlFeatherRate')?.restartBase;
  return base == null ? [] : [{ token: '{', formula: 'pow', args: { base, rate: base } }];
};

export default {
  kind: 'owl',
  section: 'owlData',
  // UPKEEP: keyed by table position, and owlBonusPerFeather is read at the same index.
  key: (entry, index) => `OwlUpgrade${index}`,
  // UPKEEP: the app's owl page draws etc/Owl_<index>.png per upgrade (pages/account/clickers/owl.jsx),
  // so the art follows table position.
  icon: (entry, index) => `/etc/Owl_${index}.png`,
  fallbackIcon: '/etc/Owl.png',
  // UPKEEP: Feather Cheapener writes its number as `@`, which tidy() reads as the game's line break.
  // It is swapped to `#` before tidy runs, and the term below fills `#`.
  describe: (entry) => String(entry.desc || '').replace(/@/g, '#'),
  effect: (entry, index, data) => ({
    levelLabel: 'Upgrade level',
    terms: [
      ...perFeatherTerm(index, data),
      ...cheapenerTerm(data),
      ...restartTerm(data)
    ]
  }),
  // The owlCost table (Summoning:OwlCost): row firstRow (Feather Generation) also scales with its own level, so its
  // first level costs nothing, and its rate is at least rateFloor. No table, no price.
  cost: (entry, index, data) => {
    const cost = gameTable(data, 'owlCost');
    if (!cost) return null;
    return index === cost.firstRow
      ? { formula: 'linearPow', args: { base: entry.x1, rate: Math.max(cost.rateFloor, entry.x2) }, currency: 'Feathers' }
      : { formula: 'pow', args: { base: entry.x1, rate: entry.x2 }, currency: 'Feathers' };
  }
};
