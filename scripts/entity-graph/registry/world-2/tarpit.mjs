import { termsFor } from './poppy-text.mjs';

// The Tar Pit tab of the kangaroo: upgrades bought with Tartar Fish. The level of each is read
// from the save, so a page shows the sentence and cost at any level the reader types.

// UPKEEP: kangaroo.ts tarFishUnlocked: the 1st, 5th and 8th Megafish open 3, 3 and 2 slots.
const megafishNeeded = (index) => (index < 3 ? 1 : index < 6 ? 5 : 8);

export default {
  kind: 'tarpit',
  section: 'poppyTarBonuses',
  // UPKEEP: keyed by table position; the icon follows the same index.
  key: (entry, index) => `TarPitUpgrade${index}`,
  icon: (entry, index) => `/etc/KUpgb_${index}.png`,
  fallbackIcon: '/etc/KTar.png',
  describe: (entry) => entry.desc,
  effect: (entry) => ({ levelLabel: 'Upgrade level', terms: termsFor(entry) }),
  cost: (entry) => ({ formula: 'powPlusLevel', args: { base: entry.x1, rate: entry.x2 }, currency: 'Tartar Fish' }),
  fields: (entry, index) => [{ label: 'Megafish needed', value: megafishNeeded(index) }]
};
