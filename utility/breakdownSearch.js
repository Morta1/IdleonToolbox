// Stat breakdowns the quick search can open. A link carries `?breakdown=<key>`, and the first
// breakdown on the page whose statName gives that key opens itself (see Breakdown.tsx), so a
// per-character or per-unit stat opens for the first one shown.
export const breakdownKey = (statName) => String(statName ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

// `filter` is the characters page section the breakdown sits in: the search turns it on
const CHARACTERS = { url: '/characters', scope: 'per character', filter: 'Stats' };
// Skill name: its ClassIcons index, as in parsers/parseMaps.ts
const SKILLS = {
  Mining: 42, Smithing: 43, Chopping: 44, Fishing: 45, Alchemy: 46, Catching: 47, Trapping: 48, Construction: 49,
  Worship: 50, Cooking: 51, Breeding: 52, Laboratory: 53, Sailing: 54, Divinity: 55, Gaming: 56, Farming: 57,
  Sneaking: 58, Summoning: 59
};
// The efficiency statNames that don't read "<Skill> Efficiency"
const EFFICIENCY_NAMES = {
  Mining: 'Mining Efficiency',
  Chopping: 'Choppin Efficiency',
  Fishing: 'Fishing Efficiency',
  Catching: 'Catching Efficiency',
  Trapping: 'Trapping Efficiency',
  Worship: 'Worship Efficiency',
  Cooking: 'Cooking Efficiency',
  Laboratory: 'Lab Efficiency'
};

// statName must match the breakdown's own statName; label only when the statName reads badly. Aliases are
// synonyms players type, never the page name: the page already matches as a page. An icon shows the stat
// itself, with the page icon as a badge; without one the page icon is used
const ENTRIES = [
  { statName: 'Damage', aliases: ['dmg'], icon: 'data/UISkillIcon6', ...CHARACTERS },
  { statName: 'Defence', aliases: ['defense'], icon: 'data/UISkillIcon9', ...CHARACTERS },
  { statName: 'Kill per Kill', aliases: ['kpk'], icon: 'etc/Killroy_Skull', ...CHARACTERS },
  { statName: 'Drop Rate', aliases: ['dr'], icon: 'data/UISkillIcon13', ...CHARACTERS },
  { statName: 'Respawn Rate', aliases: ['respawn time'], icon: 'data/UISkillIcon38', ...CHARACTERS },
  { statName: 'AFK Gains', aliases: ['afk'], icon: 'data/Afkz1', ...CHARACTERS },
  { statName: 'Class EXP multi', aliases: ['class xp'], icon: 'data/UISkillIcon2', ...CHARACTERS },
  { statName: 'Cash multi', aliases: ['money', 'coins'], icon: 'data/Cash', ...CHARACTERS },
  { statName: 'Golden food multi', aliases: ['gfood'], icon: 'data/FoodG1', ...CHARACTERS },
  { statName: 'Crystal Chance', aliases: ['crystal spawn'], icon: 'data/Crystal1', ...CHARACTERS },
  { statName: 'Added levels', label: 'Talent added levels', aliases: ['talent levels'], icon: 'data/TalentBook1',
    ...CHARACTERS, filter: 'Talents' },
  ...Object.entries(SKILLS).map(([skill, iconIndex]) => ({
    statName: `${skill} EXP multi`,
    aliases: [`${skill} xp`],
    icon: `data/ClassIcons${iconIndex}`,
    ...CHARACTERS,
    filter: 'Skills'
  })),
  ...Object.entries(EFFICIENCY_NAMES).map(([skill, statName]) => ({
    statName,
    label: `${skill} Efficiency`,
    icon: `data/ClassIcons${SKILLS[skill]}`,
    ...CHARACTERS,
    filter: 'Skills'
  })),

  { statName: 'No Stamp Left Behind', label: 'Stamps per day', url: '/account/world-1/stamps' },
  { statName: 'Exalted Multi', label: 'Exalted stamp multi', url: '/account/world-1/stamps' },
  { statName: 'Max ore capacity', url: '/account/world-1/forge' },
  { statName: 'Thingymabob per hour', url: '/account/world-1/anvil' },
  { statName: 'Tangled Cords per hour', url: '/account/world-1/anvil' },
  { statName: 'PVC Pipe per hour', url: '/account/world-1/anvil' },
  { statName: 'Storage Slots', url: '/account/misc/storage', query: { t: 'Slots' } },

  { statName: 'Upgradeable Bubbles', label: 'Bubbles that will upgrade', url: '/account/world-2/bubbles' },
  { statName: 'Prisma multi', url: '/account/world-2/bubbles' },
  { statName: 'Power brew speed', label: 'Power cauldron brew speed', url: '/account/world-2/cauldrons' },
  { statName: 'Quicc brew speed', label: 'Quicc cauldron brew speed', url: '/account/world-2/cauldrons' },
  { statName: 'High-IQ brew speed', label: 'High-IQ cauldron brew speed', url: '/account/world-2/cauldrons' },
  { statName: 'Kazam brew speed', label: 'Kazam cauldron brew speed', url: '/account/world-2/cauldrons' },
  { statName: 'Vial bonus', aliases: ['vial multi'], url: '/account/world-2/vials' },
  { statName: 'Sigil Speed', url: '/account/world-2/sigils' },
  { statName: 'Gold ball multi', url: '/account/world-2/arcade-shop' },
  { statName: 'Bonus multi', label: 'Vote ballot bonus multi', url: '/account/world-2/vote-ballot' },
  { statName: 'Meritocracy multi', url: '/account/world-2/vote-ballot', query: { t: 'Meritocracy' } },

  { statName: 'Trimmed Build Speed', label: 'Trimmed slot build speed', url: '/account/world-3/buildings' },
  { statName: 'Combustion cycle time', url: '/account/world-3/refinery' },
  { statName: 'Synthesis cycle time', url: '/account/world-3/refinery' },
  { statName: 'Polymerize cycle time', url: '/account/world-3/refinery' },
  { statName: 'Critter Collect Rates', url: '/account/world-3/traps', scope: 'per character' },
  { statName: 'Shiny Critter Chance', url: '/account/world-3/traps', scope: 'per character' },
  { statName: 'Equinox fill rate', url: '/account/world-3/equinox' },
  { statName: 'Worship EXP per wave', url: '/account/world-3/worship', query: { t: 'Totems' },
    scope: 'per totem' },

  { statName: 'Meal speed', aliases: ['cooking speed'], url: '/account/world-4/cooking', query: { t: 'Kitchens' },
    scope: 'per kitchen' },
  { statName: 'Fire speed', url: '/account/world-4/cooking', query: { t: 'Kitchens' }, scope: 'per kitchen' },
  { statName: 'Ribbons per day', url: '/account/world-4/cooking', query: { t: 'Ribbons' } },
  { statName: 'Cooking Mastery EXP rate', url: '/account/world-4/cooking', query: { t: 'Mastery' } },
  { statName: 'Breedability multi', url: '/account/world-4/breeding', query: { t: 'Mobs', nt: 'Breedability' } },
  { statName: 'Shiny level multiplier', url: '/account/world-4/breeding', query: { t: 'Mobs', nt: 'Shinies' } },

  { statName: 'Loot multi', url: '/account/world-5/sailing', query: { t: 'Boats and Captains' } },
  { statName: 'Minimum Travel Time', url: '/account/world-5/sailing',
    query: { t: 'Boats and Captains' } },
  { statName: 'Artifact Find Chance', url: '/account/world-5/sailing', query: { t: 'Boats and Captains' },
    scope: 'per boat' },
  { statName: 'Bit multi', url: '/account/world-5/gaming' },
  { statName: 'Palette Luck', url: '/account/world-5/gaming', query: { t: 'Palette' } },
  { statName: 'Villager EXP / hr', label: 'Villager EXP per hour', url: '/account/world-5/hole', scope: 'per villager' },

  { statName: 'Growth Speed', url: '/account/world-6/farming' },
  { statName: 'OG Chance Multiplier', url: '/account/world-6/farming' },
  { statName: 'Land Rank EXP', url: '/account/world-6/farming' },
  { statName: 'Crops on Vine', url: '/account/world-6/farming' },
  { statName: 'Crop Value', url: '/account/world-6/farming' },
  { statName: 'Magic Bean Trade', url: '/account/world-6/farming' },
  { statName: 'Items max level', url: '/account/world-6/sneaking' },
  { statName: 'Stealth', url: '/account/world-6/sneaking',
    query: { t: 'Detection' }, scope: 'per ninja' },
  { statName: 'White essence per hour', url: '/account/world-6/summoning' },
  { statName: 'Bonus Multi', label: 'Emperor bonus multi', url: '/account/world-6/emperor' },

  { statName: 'Spelunking Efficiency', url: '/account/world-7/spelunking' },
  { statName: 'Power', label: 'Spelunking POW', aliases: ['pow', 'power'], url: '/account/world-7/spelunking' },
  { statName: 'Amber gain', url: '/account/world-7/spelunking' },
  { statName: 'Stamina Regen Rate', url: '/account/world-7/spelunking' },
  { statName: 'Research EXP Multi', url: '/account/world-7/research' },
  { statName: 'Research AFK Gains', url: '/account/world-7/research' },
  { statName: 'Legend Points', url: '/account/world-7/legend-talents' },
  { statName: 'Reef day gains', url: '/account/world-7/coral-reef' },
  { statName: 'Currency / hr', label: 'Minehead currency per hour', url: '/account/world-7/minehead' },
  { statName: 'Bloodcell Multi', url: '/account/world-7/jelly-operator' },
  { statName: 'Lumi per hour', url: '/account/world-7/menagerie' },

  { statName: 'Extra Dust', url: '/account/class-specific/compass', scope: 'per character' },
  { statName: 'Extra Tachyon', url: '/account/class-specific/tesseract', scope: 'per character' },
  { statName: 'Portal progress per kill', url: '/account/class-specific/speedrun' },
  { statName: 'Vault cost reduction', url: '/account/misc/upgrade-vault' }
];

// Sentence case, keeping acronyms (EXP, AFK, OG, POW...) and the game's capitalised first word
const sentenceCase = (text) => text.split(' ')
  .map((word, index) => index === 0 || word === word.toUpperCase() ? word : word.toLowerCase())
  .join(' ');

export const BREAKDOWN_SEARCH = ENTRIES.map((entry) => ({ ...entry, label: sentenceCase(entry.label ?? entry.statName) }));
