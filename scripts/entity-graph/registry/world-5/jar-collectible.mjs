import { titleCase } from '../text.mjs';

// UPKEEP: HolesInfo[67] rows are NAME|bonus per level|Filler|text (Holes2.js JarCollectibleBonus).
const parse = (row) => {
  const [name, perLevel, , description] = String(row).split('|');
  return { name, perLevel: Number(perLevel), description };
};

export default {
  kind: 'jarcollectible',
  section: (data) => (data.holesInfo?.[67] || []).map(parse),
  key: (entry, index) => `JarCollectible${index}`,
  name: (entry) => titleCase(entry.name),
  icon: (entry, index) => `/data/HoleJarC${index}.png`,
  fallbackIcon: '/etc/Cavern_10.png',
  // UPKEEP: the game's placeholders for caverns not built yet.
  skip: (entry) => (/future_cavern/.test(entry.description) ? 'placeholder: boosts a future cavern' : false),
  // UPKEEP: Abnormal Rupie ends on a live "Current Rupie Value" readout.
  describe: (entry) => entry.description.replace(/_*@_*Current_Rupie_Value:\$$/, ''),
  // No cost or cap: collectibles are found in jars, and enchanting raises the level.
  effect: (entry) => ({
    levelLabel: 'Collectible level',
    cap: null,
    terms: [
      { token: '{', formula: 'linear', args: { perLevel: entry.perLevel } },
      { token: '}', formula: 'growth', args: { func: 'bigBase', x1: 1, x2: entry.perLevel / 100 } }
    ]
  })
};
