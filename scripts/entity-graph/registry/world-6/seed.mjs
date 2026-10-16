import { linked } from '../../../../utility/wiki/field-links.mjs';
import { gameTable } from '../data.mjs';
import { titleCase } from '../text.mjs';
import { loreBossOf, tunnelId } from '../world-7/spelunk-tunnel.mjs';

// The seed MedalSeedsAvailable gates, found in SeedInfo by its name.
const MEDAL = 'MEDAL';

// The medalSeedLoreBoss table, the DoWeHaveLoreN1 slot MedalSeedsAvailable reads (N.js:106186). No table or no lore boss
// name, no field.
const unlockField = (data) => {
  const lore = gameTable(data, 'medalSeedLoreBoss');
  const boss = lore ? loreBossOf(data, lore.loreBoss) : null;
  return boss ? [linked({ label: 'Unlocked by', value: boss }, 'unlockedBy', tunnelId(lore.loreBoss))] : [];
};

export default {
  kind: 'seed',
  section: 'seedInfo',
  key: (entry) => `Seed${entry.seedId}`,
  // The game draws the bare seed word in the seed picker (N.js:108667); the kind label tells it apart in search.
  name: (entry) => titleCase(entry.name),
  icon: (entry) => `/etc/Seed_${entry.seedId}.png`,
  fallbackIcon: '/etc/Seed_0.png',
  fields: (entry, index, data) => [
    { label: 'Farming level needed', value: entry.lvlReq },
    { label: 'Crops', value: entry.cropIdMax - entry.cropIdMin + 1 },
    // UPKEEP: NextCropChance reads SeedInfo[0][5] for every seed (N.js:110611); only the decay is per seed.
    { label: 'Base evolution chance', value: `${data.seedInfo[0].nextCropChance * 100}% on the first crop, x${entry.nextCropDecay} per crop after` },
    ...(entry.name === MEDAL ? unlockField(data) : [])
  ]
};
