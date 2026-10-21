// Data-free like routes.js: the header goal button reads it on every goal page.
// Route -> page tab (the Tabber's `t` query value) -> the goal system that tab shows.
// A tab missing here opens the page's first system.
export const GOAL_TABS = {
  '/account/class-specific/grimoire': { Upgrades: 'grimoire', 'Upgrade Optimizer': 'grimoire' },
  '/account/class-specific/compass': { Upgrades: 'compass', 'Upgrade Optimizer': 'compass' },
  '/account/class-specific/tesseract': { Upgrades: 'tesseract', 'Upgrade Optimizer': 'tesseract' },
  '/account/class-specific/royal-armory': {
    Armory: 'armory',
    'Royal Statues': 'royalStatue',
    'Orblet Market': 'orblet'
  },
  '/account/world-2/killroy': {
    Upgrades: 'killroyUpgrade',
    'Permanent Upgrades': 'killroyShop',
    Monsters: 'killroyKills'
  },
  '/account/world-3/equinox': { Upgrades: 'equinoxUpgrade', Challenges: 'equinoxChallenge' },
  '/account/world-4/breeding': { Mobs: 'pet', Upgrades: 'petUpgrade' },
  '/account/world-4/cooking': { Meals: 'meal', Kitchens: 'kitchen' },
  '/account/world-5/hole': {
    Explore: 'villager',
    Engineer: 'schematic',
    Bonuses: 'majik',
    Measure: 'measurement',
    Study: 'study'
  },
  '/account/world-5/sailing': { Artifacts: 'artifact', 'Boats and Captains': 'boat', 'Loot Pile': 'lootPile' },
  '/account/world-6/farming': {
    Market: 'farmMarket',
    'Exotic Market': 'exoticMarket',
    'Exotic Rotation': 'exoticMarket',
    'Rank database': 'landRank',
    'Rank Optimizer': 'landRank',
    Crop: 'crop',
    Stickers: 'sticker'
  },
  '/account/world-6/sneaking': {
    'Jade Emporium': 'jade',
    Upgrades: 'sneakUpgrade',
    Charms: 'pristineCharm',
    Gemstones: 'gemstone'
  },
  '/account/world-6/summoning': { Upgrades: 'summonUpgrade', Battles: 'summonBattle' },
  '/account/world-7/spelunking': {
    Upgrades: 'spelunkUpgrade',
    'Upgrade Optimizer': 'spelunkUpgrade',
    Lore: 'spelunkChapter',
    Elixirs: 'elixir'
  },
  '/account/world-7/research': { Grid: 'researchSquare', Observations: 'observation' },
  '/account/world-7/coral-reef': { 'Reef Upgrades': 'reefUpgrade', 'Dancing Coral': 'dancingCoral' },
  '/account/world-7/clam-work': { Upgrades: 'clamPearl', 'Upgrade Optimizer': 'clamPearl', Scurge: 'scurge' },
  '/account/world-7/minehead': { Upgrades: 'mineheadUpgrade', Opponents: 'mineheadOpponent' },
  '/account/world-7/sushi-station': { Sushi: 'sushiKnowledge', Upgrades: 'sushiUpgrade' },
  '/account/world-7/jelly-operator': {
    Upgrades: 'jellyUpgrade',
    'Upgrade Optimizer': 'jellyUpgrade',
    Cells: 'jellyCell',
    Obstructions: 'jellyObstruction'
  },
  '/account/world-7/menagerie': { Unlocks: 'menagerieUnlock', Boosts: 'menagerieBoost' },
  '/account/world-7/gallery': { Trophies: 'trophy', Nametags: 'nametag' },
  '/account/misc/dungeons': { Passives: 'dungeonUpgrade', 'Rng Items': 'dungeonItem' },
  '/account/misc/constellations': { Constellations: 'constellation', 'Star Signs': 'starSign' }
};

const TAB_QUERY_KEY = 't';

// systems: the page's goal systems, in order. Returns the system to open the add popover on.
export const systemForTab = (pathname, query, systems) => {
  const route = String(pathname ?? '').split(/[?#]/)[0].replace(/\/$/, '');
  const tabSystem = GOAL_TABS[route]?.[query?.[TAB_QUERY_KEY]];
  return systems.some(({ system }) => system === tabSystem) ? tabSystem : systems[0]?.system;
};
