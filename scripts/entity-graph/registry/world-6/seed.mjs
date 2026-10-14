import { titleCase } from '../text.mjs';
import { loreBossOf } from '../world-7/spelunk-tunnel.mjs';

// UPKEEP: the Medal seed's id in SeedInfo.
const MEDAL = 6;
// UPKEEP: MedalSeedsAvailable reads DoWeHaveLoreN1 slot 3 (N.js:106186).
const MEDAL_LORE_BOSS = 3;

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
    ...(entry.seedId === MEDAL ? [{ label: 'Unlocked by', value: loreBossOf(data, MEDAL_LORE_BOSS) }] : [])
  ]
};
