// Data-free like routes.js: the header goal button reads it on every goal page.
// Route -> page tab (the Tabber's `t` query value) -> the goal system that tab shows.
// A tab with nested tabs maps to { system, tabs }: `tabs` is keyed by the nested tab (`nt`, then `dnt`),
// and `system` covers the tab itself and any nested tab missing from `tabs`.
// A tab missing here opens the page's first system.
export const GOAL_TABS = {
  '/account/class-specific/grimoire': { Upgrades: 'grimoire', 'Upgrade Optimizer': 'grimoire' },
  '/account/class-specific/compass': {
    Upgrades: 'compass',
    'Upgrade Optimizer': 'compass',
    Abominations: 'compassAbomination',
    Medallions: 'compassMedallion',
    Portals: 'compassPortal'
  },
  '/account/class-specific/tesseract': { Upgrades: 'tesseract', 'Upgrade Optimizer': 'tesseract', Maps: 'tesseractMap' },
  '/account/class-specific/royal-armory': {
    Armory: 'armory',
    Outposts: 'armoryTotals',
    Resources: 'armoryTotals',
    'Royal Statues': 'royalStatue',
    'Orblet Market': 'orblet'
  },
  '/account/world-4/rift': {
    Tasks: 'rift',
    Bonuses: 'riftBonus',
    'Skill Mastery': 'skillMastery',
    'Construct Mastery': 'constructMastery'
  },
  '/account/world-5/divinity': { Gods: 'god', 'Coral Kid Upgrades': 'coralKid' },
  '/account/world-2/killroy': {
    Upgrades: 'killroyUpgrade',
    'Permanent Upgrades': 'killroyShop',
    Monsters: 'killroyKills'
  },
  '/account/world-3/equinox': { Upgrades: 'equinoxUpgrade', Challenges: 'equinoxChallenge' },
  '/account/world-4/breeding': { Mobs: 'pet', Upgrades: 'petUpgrade', Arena: 'breedingTotals' },
  '/account/world-4/cooking': { Meals: 'meal', Kitchens: 'kitchen', Ribbons: 'meal', Mastery: 'cookingMastery' },
  '/account/world-4/laboratory': { 'Main frame': 'labBonus', Console: 'chip', 'Chips And Jewels Rotation': 'chip' },
  '/account/world-5/hole': {
    Explore: {
      system: 'villager',
      // the cavern tabs (`nt`); a cavern without upgrades of its own opens the totals with its layer or score
      tabs: {
        'The well': 'holeTotals',
        Motherlode: 'holeTotals',
        'The den': 'denAmplifier',
        Bravery: 'monumentBonus',
        'The bell': 'bellUpgrade',
        'The harp': 'harpString',
        'The Lamp': 'lampWish',
        'The hive': 'holeTotals',
        Grotto: 'holeTotals',
        Justice: 'monumentBonus',
        'The Jars': { system: 'holeTotals', tabs: { Collectibles: 'jarCollectible' } },
        Evertree: 'holeTotals',
        Wisdom: 'monumentBonus',
        Gambit: 'gambitBonus',
        'The Temple': 'holeTotals',
        'The Fountain': 'fountainUpgrade',
        'The Bottomless Trench': 'holeTotals',
        'Crystal Glunko Cove': 'coveUpgrade'
      }
    },
    Engineer: 'schematic',
    Bonuses: 'majik',
    Measure: 'measurement',
    Study: 'study'
  },
  '/account/world-5/sailing': { Artifacts: 'artifact', 'Boats and Captains': 'boat', 'Loot Pile': 'lootPile' },
  '/account/world-6/farming': {
    Plot: 'farmPlot',
    Market: 'farmMarket',
    'Exotic Market': 'exoticMarket',
    'Exotic Rotation': 'exoticMarket',
    'Rank database': 'landRank',
    'Rank Optimizer': 'landRank',
    Crop: 'crop',
    Stickers: 'sticker'
  },
  '/account/world-6/sneaking': {
    Inventory: 'ninja',
    Mastery: 'ninjaMastery',
    'Jade Emporium': 'jade',
    Upgrades: 'sneakUpgrade',
    Charms: 'pristineCharm',
    Gemstones: 'gemstone'
  },
  '/account/world-6/summoning': {
    Upgrades: 'summonUpgrade',
    'Winner Bonuses': 'summonWinnerBonus',
    Battles: 'summonBattle',
    Stones: 'summonStone'
  },
  '/account/world-7/spelunking': {
    Upgrades: 'spelunkUpgrade',
    'Upgrade Optimizer': 'spelunkUpgrade',
    Lore: 'spelunkChapter',
    Elixirs: 'elixir'
  },
  '/account/world-7/research': { Grid: 'researchSquare', Observations: 'observation', 'Posty Notes': 'postyNote' },
  '/account/world-7/coral-reef': { 'Reef Upgrades': 'reefUpgrade', 'Dancing Coral': 'dancingCoral' },
  '/account/world-7/clam-work': {
    Upgrades: 'clamPearl',
    'Upgrade Optimizer': 'clamPearl',
    Scurge: 'scurge',
    Compensations: 'clamCompensation'
  },
  '/account/world-7/minehead': { Upgrades: 'mineheadUpgrade', Opponents: 'mineheadOpponent' },
  '/account/world-7/sushi-station': { Sushi: 'sushiKnowledge', Upgrades: 'sushiUpgrade' },
  '/account/world-7/jelly-operator': {
    Upgrades: 'jellyUpgrade',
    'Upgrade Optimizer': 'jellyUpgrade',
    Cells: 'jellyCell',
    Obstructions: 'jellyObstruction'
  },
  '/account/world-7/menagerie': {
    Missions: 'menagerieMission',
    Unlocks: 'menagerieUnlock',
    Boosts: 'menagerieBoost',
    Jellies: 'menagerieJelly'
  },
  '/account/world-7/gallery': { Trophies: 'trophy', Nametags: 'nametag' },
  '/account/misc/dungeons': { Passives: 'dungeonUpgrade', 'Rng Items': 'dungeonItem' },
  '/account/misc/storage': { Slots: 'storageChest' },
  '/account/misc/constellations': { Constellations: 'constellation', 'Star Signs': 'starSign' }
};

// The Tabber query key of each nesting depth
const TAB_QUERY_KEYS = ['t', 'nt', 'dnt'];

const tabSystemOf = (node, query, depth) => {
  if (!node || typeof node === 'string') return node;
  const tabs = node.tabs ?? {};
  // A nested tab clicked before any outer tab leaves the outer key out of the query: that is the first tab
  const deeper = TAB_QUERY_KEYS.slice(depth + 1).some((key) => query?.[key] != null);
  const tab = query?.[TAB_QUERY_KEYS[depth]] ?? (deeper ? Object.keys(tabs)[0] : undefined);
  return tabSystemOf(tabs[tab], query, depth + 1) ?? node.system;
};

// systems: the page's goal systems, in order. Returns the system to open the add popover on.
export const systemForTab = (pathname, query, systems) => {
  const route = String(pathname ?? '').split(/[?#]/)[0].replace(/\/$/, '');
  const tabSystem = tabSystemOf({ tabs: GOAL_TABS[route] }, query, 0);
  return systems.some(({ system }) => system === tabSystem) ? tabSystem : systems[0]?.system;
};
