// The Owl's feather shop (owl.ts parseOwl). Each upgrade's text carries its own number: `}` is the
// per-level bonus from gameTables.owlBonusPerFeather, `@` is Feather Cheapener's diminishing
// discount, `{` is Feather Restart's multiplier. A page has no save, so mega feathers and every
// cost reducer read as zero.
const FEATHER_GENERATION = 0;

export default {
  kind: 'owl',
  section: 'owlData',
  // UPKEEP: keyed by table position, and owlBonusPerFeather is read at the same index.
  key: (entry, index) => `OwlUpgrade${index}`,
  fallbackIcon: '/data/OwlBG.png',
  // UPKEEP: Feather Cheapener writes its number as `@`, which tidy() reads as the game's line break.
  // It is swapped to `#` before tidy runs, and the term below fills `#`.
  describe: (entry) => String(entry.desc || '').replace(/@/g, '#'),
  effect: (entry, index, data) => ({
    levelLabel: 'Upgrade level',
    terms: [
      { token: '}', formula: 'linear', args: { perLevel: data.gameTables?.owlBonusPerFeather?.[index] ?? 0 } },
      { token: '#', formula: 'diminishingPercent', args: { perLevel: 10 } },
      // UPKEEP: base 3 is owl.ts `3 + 2 * megaFeather6` with no mega feathers; the exponent is
      // the restart count, which is Feather Restart's own level.
      { token: '{', formula: 'pow', args: { base: 3, rate: 3 } }
    ]
  }),
  // Feather Generation's cost also scales with its own level, so its first level costs nothing.
  cost: (entry, index) => (index === FEATHER_GENERATION
    ? { formula: 'linearPow', args: { base: entry.x1, rate: Math.max(1.05, entry.x2) }, currency: 'Feathers' }
    : { formula: 'pow', args: { base: entry.x1, rate: entry.x2 }, currency: 'Feathers' })
};
