import { linked } from '../../../../utility/wiki/field-links.mjs';
import { spaced } from '../text.mjs';

// UPKEEP: map ids hardcoded in worship.ts getTotems (the game reads them from its map table), one per totem in table order.
const TOTEM_MAPS = [26, 63, 30, 107, 155, 208, 259, 308];
// UPKEEP: randomList[10] names five totems; entries 5 and 6 are the game's "Tower_Defence_N" placeholders and 7 is missing, so these three come from the app's Worship page (Totems.jsx).
const APP_NAMES = { 5: 'Citric_Conflict', 6: 'Breezy_Battle', 7: 'Pufferblob_Brawl' };
// UPKEEP: the neutral part of WorshipStuff("ExpRewards") in worship.ts: 15 * (i + 1)^2, before the save's multipliers and wave scaling.
const EXP_BASE = 15;

const mapOf = (index, data) => data.mapNames?.[TOTEM_MAPS[index]];
const mapLink = (index) => `map:${TOTEM_MAPS[index]}`;

export default {
  kind: 'totem',
  section: 'totems',
  // UPKEEP: keyed by table position; the art (totem_<i>.png) and the map list follow it.
  key: (entry, index) => `Totem${index}`,
  name: (entry, index, data) => APP_NAMES[index] ?? data.randomList?.[10]?.[index],
  icon: (entry, index) => `/etc/totem_${index}.png`,
  fallbackIcon: '/data/ClassIcons50.png',
  describe: (entry, index, data) => `Stands_on_${mapOf(index, data)}._Its_waves_send_${entry.monsterName}.`,
  fields: (entry, index, data) => [
    linked({ label: 'Map', value: spaced(mapOf(index, data)) }, 'locatedIn', mapLink(index)),
    { label: 'Worship level needed', value: entry.skillReq },
    { label: 'Charge to summon', value: entry.chargeReq },
    { label: 'Worship efficiency for bonus souls', value: entry.minEfficiency },
    { label: 'Worship EXP per wave (before multipliers)', value: EXP_BASE * (index + 1) ** 2 }
  ]
};
