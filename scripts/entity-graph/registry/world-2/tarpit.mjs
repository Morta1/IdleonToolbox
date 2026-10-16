import { gameTable } from '../data.mjs';
import { termsFor } from './poppy-text.mjs';

// The Tar Pit tab of the kangaroo: upgrades bought with Tartar Fish. The level of each is read
// from the save, so a page shows the sentence and cost at any level the reader types.

// The tarPitMegafish table (Summoning:RooTarOwned): each unlock opens `slots` more upgrades once `megafish` Megafish
// are owned, counted from 0, so slot i needs megafish + 1 of the first unlock whose running total passes i.
// No table, no field.
const megafishNeeded = (index, data) => {
  let total = 0;
  for (const { megafish, slots } of gameTable(data, 'tarPitMegafish')?.unlocks ?? []) {
    total += slots;
    if (index < total) return megafish + 1;
  }
  return null;
};

export default {
  kind: 'tarpit',
  section: 'poppyTarBonuses',
  // UPKEEP: keyed by table position; the icon follows the same index.
  key: (entry, index) => `TarPitUpgrade${index}`,
  icon: (entry, index) => `/etc/KUpgb_${index}.png`,
  fallbackIcon: '/etc/KTar.png',
  describe: (entry) => entry.desc,
  effect: (entry, index, data) => ({ levelLabel: 'Upgrade level', terms: termsFor(entry, data) }),
  cost: (entry) => ({ formula: 'powPlusLevel', args: { base: entry.x1, rate: entry.x2 }, currency: 'Tartar Fish', currencyIcon: '/etc/KTar.png' }),
  fields: (entry, index, data) => [{ label: 'Megafish needed', value: megafishNeeded(index, data) }]
};
