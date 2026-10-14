const spaced = (text) => String(text || '').replace(/_/g, ' ');

// UPKEEP: JadeUpgCost (Ninja.js:187): Centurion Lineage costs 1e45 x more, every row past 16 costs 10^floor(2 (t - 15)) x more.
const CENTURION = 0;
// UPKEEP: rows 17 and up unlock one at a time with Coral Reef upgrade 3 ("Adds a new mini 'Ninja Knowledge' upgrade", N.js:109130).
const FIRST_SPECIAL = 17;
const prefactor = (t) => (t >= FIRST_SPECIAL ? Math.pow(10, Math.floor(2 * (t - 15))) : t === CENTURION ? 1e45 : 1);
// UPKEEP: the root upgrade, drawn with no prerequisite (N.js:109130).
const WAY_OF_STEALTH = 13;
// UPKEEP: N.js:80489 rewrites these prerequisites once Ninja Mastery reaches the tier: row -> [mastery, prerequisite row].
const MASTERY_GATES = { 6: [1, 10], 3: [1, 5], 1: [3, 4], 0: [5, 1] };

const unlockOf = (entry, index, data) => {
  const name = (t) => spaced(data.ninjaUpgrades?.[t]?.name);
  if (index >= FIRST_SPECIAL) return `Coral Reef: the mini Ninja Knowledge upgrade at level ${index - FIRST_SPECIAL + 1}`;
  if (MASTERY_GATES[index]) return `Ninja Mastery ${MASTERY_GATES[index][0]}, then ${name(MASTERY_GATES[index][1])} at level 1`;
  return index === WAY_OF_STEALTH ? null : `${name(entry.x9)} at level 1`;
};

export default {
  kind: 'ninjaupgrade',
  section: 'ninjaUpgrades',
  key: (entry, index) => `NinjaUpg${index}`,
  icon: (entry, index) => `/data/NjUpgI${index}.png`,
  fallbackIcon: '/data/NjUpgI13.png',
  // UPKEEP: the game's spare slot is named 'Name'.
  skip: (entry) => (entry.name === 'Name' ? 'placeholder: no upgrade yet' : false),
  effect: (entry) => ({
    levelLabel: 'Upgrade level',
    cap: null,
    terms: [
      { token: '{', formula: 'linear', args: { perLevel: entry.modifier } },
      { token: '}', formula: 'growth', args: { func: 'bigBase', x1: 1, x2: entry.modifier / 100 } }
    ]
  }),
  cost: (entry, index) => ({ formula: 'pow', args: { base: prefactor(index) * entry.x7, rate: entry.x8 }, currency: 'Jade Coins' }),
  fields: (entry, index, data) => [{ label: 'Unlocked by', value: unlockOf(entry, index, data) }].filter((field) => field.value)
};
