import { linked } from '../../../../utility/wiki/field-links.mjs';
import { gameTable } from '../data.mjs';
import { spaced } from '../text.mjs';

// UPKEEP: randomList[10] names five totems; entries 5 and 6 are the game's "Tower_Defence_N" placeholders and 7 is missing, so these three come from the app's Worship page (Totems.jsx). Not extracted: the game holds no name for them.
const APP_NAMES = { 5: 'Citric_Conflict', 6: 'Breezy_Battle', 7: 'Pufferblob_Brawl' };

// The map a totem stands on: the worshipMapType table, the CustomMaps WorshipMapType literal (map to totem) read as
// totem to map. No table, no map.
const mapIdOf = (index, data) => gameTable(data, 'worshipMapType')?.[index] ?? null;

// The neutral part of WorshipStuff("ExpRewards"): the worshipExpRewards table's base x (i + 1)^2, before the save's
// multipliers and wave scaling. No table, no field.
const expOf = (index, data) => {
  const rewards = gameTable(data, 'worshipExpRewards');
  return rewards ? rewards.base * (index + 1) ** 2 : null;
};

export default {
  kind: 'totem',
  section: 'totems',
  // UPKEEP: keyed by table position; the art (totem_<i>.png) and the map list follow it.
  key: (entry, index) => `Totem${index}`,
  name: (entry, index, data) => APP_NAMES[index] ?? data.randomList?.[10]?.[index],
  icon: (entry, index) => `/etc/totem_${index}.png`,
  fallbackIcon: '/data/ClassIcons50.png',
  describe: (entry, index, data) => {
    const map = mapIdOf(index, data);
    return `${map === null ? '' : `Stands_on_${data.mapNames?.[map]}._`}Its_waves_send_${entry.monsterName}.`;
  },
  fields: (entry, index, data) => {
    const map = mapIdOf(index, data);
    return [
      map === null ? null : linked({ label: 'Map', value: spaced(data.mapNames?.[map]) }, 'locatedIn', `map:${map}`),
      { label: 'Worship level needed', value: entry.skillReq },
      { label: 'Charge to summon', value: entry.chargeReq },
      { label: 'Worship efficiency for bonus souls', value: entry.minEfficiency },
      { label: 'Worship EXP per wave (before multipliers)', value: expOf(index, data) }
    ].filter(Boolean);
  }
};
