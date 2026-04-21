export const CLASSIFICATION_TYPES = {
  1: { label: 'High Priority', color: '#ff6b6b' },
  3: { label: 'Achievable', color: '#58a6ff' },
  4: { label: 'Time Gated', color: '#d29922' },
  5: { label: 'Luck Gated', color: '#e3b341' },
  9: { label: 'Event/Update Gated', color: '#8b949e' },
};

// Keyed by display index (position in sorted tome array)
// 1=High Priority (user-set), 3=Achievable, 4=Time Gated, 5=Luck Gated, 9=Event/Update Gated
const DEFAULT_CLASSIFICATIONS = [
  3,  // 0  Account LV
  3,  // 1  Account Skills LV
  3,  // 2  Total Talent Max LV
  9,  // 3  Items Found
  3,  // 4  Total Bubble LV
  4,  // 5  Stamp Total LV
  3,  // 6  Cards Total LV
  3,  // 7  Statue Total LV
  3,  // 8  Total Achievements Completed
  9,  // 9  Unique Quests Completed
  9,  // 10 Total Tasks Completed
  3,  // 11 Vault Upgrade bonus LV
  3,  // 12 Most Money held in Storage
  3,  // 13 Most Spore Caps held in Inventory at once
  9,  // 14 Total Colosseum Score
  3,  // 15 Trophies Found
  3,  // 16 Nametags Found
  9,  // 17 Premium Hats Found
  3,  // 18 Best Spiketrap Surprise round
  4,  // 19 Tournaments Registrations
  9,  // 20 Lava Dev Streams watched
  3,  // 21 Total Minigame Highscore
  4,  // 22 Total AFK Hours claimed
  3,  // 23 DPS Record on Shimmer Island
  9,  // 24 Total Arcade Gold Ball Shop Upgrade LV
  5,  // 25 Most Balls earned from LBoFaF
  5,  // 26 Jackpots Hit in Arcade
  3,  // 27 Star Talent Points Owned
  3,  // 28 Average kills for a Crystal Spawn
  3,  // 29 Dungeon Rank
  9,  // 30 Highest Drop Rate Multi
  3,  // 31 Constellations Completed
  9,  // 32 Unique Obols Found
  3,  // 33 Total Vial LV
  4,  // 34 Total Sigil LV
  3,  // 35 Post Office PO Boxes Earned
  4,  // 36 Highest Killroy Score on a Warrior
  4,  // 37 Highest Killroy Score on an Archer
  4,  // 38 Highest Killroy Score on a Mage
  4,  // 39 Megafeathers Earned from Orion
  4,  // 40 Megafish Earned from Poppy
  3,  // 41 Megaflesh Earned from Bubba
  3,  // 42 Fastest Time to kill Chaotic Efaunt (in Seconds)
  3,  // 43 Largest Oak Log Printer Sample
  3,  // 44 Largest Copper Ore Printer Sample
  3,  // 45 Largest Spore Cap Printer Sample
  3,  // 46 Largest Goldfish Printer Sample
  3,  // 47 Largest Fly Printer Sample
  3,  // 48 Total Best Wave in Worship
  3,  // 49 Best Non Duplicate Goblin Gorefest Wave
  3,  // 50 Total Prayer Upgrade LV
  3,  // 51 Total Digits of all Deathnote Kills
  3,  // 52 Most Giants Killed in a Single Week
  4,  // 53 Total Refinery Rank
  3,  // 54 Total Atom Upgrade LV
  4,  // 55 Total Construct Buildings LV
  3,  // 56 Equinox Clouds Completed
  3,  // 57 Most Greenstacks in Storage
  3,  // 58 Total Cooking Meals LV
  3,  // 59 Total Kitchen Upgrade LV
  3,  // 60 Highest Power Mob
  3,  // 61 Fastest Time reaching Round 100 Arena (in Seconds)
  3,  // 62 Total Shiny Mob LV
  3,  // 63 Total Mob Breedability LV
  4,  // 64 Total Lab Chips Owned
  3,  // 65 Rift Levels Completed
  3,  // 66 Total Onyx Statues
  3,  // 67 Total Artifacts Found
  3,  // 68 Total Boat Upgrade LV
  3,  // 69 Gold Bar Sailing Treasure Owned
  4,  // 70 Highest Captain LV
  3,  // 71 Most Gaming Bits Owned
  3,  // 72 Total Gaming Plants Evolved
  3,  // 73 Best Gold Nugget
  5,  // 74 Highest Immortal Snail LV
  3,  // 75 Rat King Crowns Reclaimed
  3,  // 76 God Rank in Divinity
  3,  // 77 Fastest Time to Kill 200 Tremor Wurms (in Seconds)
  3,  // 78 Total Opals Found
  3,  // 79 Total LV of Cavern Villagers
  3,  // 80 Total Digits of all Cavern Resources
  3,  // 81 Total Resource Layers Destroyed
  3,  // 82 Best Dawg Den score
  3,  // 83 Best Bravery Monument Round
  5,  // 84 Best Justice Monument Round
  3,  // 85 Best Wisdom Monument Round
  3,  // 86 Total Gambit Time (in Seconds)
  3,  // 87 Best Pure Memory Round Reached
  3,  // 88 Total Crops Discovered
  3,  // 89 Total Golden Food Beanstacks
  5,  // 90 Highest Crop OG
  3,  // 91 Total Land Rank
  3,  // 92 Largest Magic Bean Trade
  3,  // 93 Farming Stickers Found
  3,  // 94 Ninja Floors Unlocked
  9,  // 95 Jade Emporium Upgrades Purchased
  3,  // 96 Total Ninja Knowledge Upgrades LV
  3,  // 97 Total Career Summoning Wins
  3,  // 98 Total Summoning Upgrades LV
  4,  // 99 Familiars Owned in Summoning
  3,  // 100 Total Summoning Boss Stone victories
  9,  // 101 Most DMG Dealt to Gravestone in a Weekly Battle
  4,  // 102 Most Tottoise in Storage
  3,  // 103 Best Deathbringer Max Damage in Wraith Mode
  3,  // 104 Best Windwalker Max Damage in Tempest Mode
  3,  // 105 Best Arcane Cultist Max Damage in Arcanist Mode
  3,  // 106 Spirited Valley Emperor Boss Kills
  3,  // 107 Total Coral Reef upgrades
  3,  // 108 Total Spelunk Shop Upgrades LV
  3,  // 109 Total Spelunk Discoveries made
  3,  // 110 Deepest Depth reached in a single Delve
  3,  // 111 Biggest Haul in a single Delve
  3,  // 112 Highest leveled Spelunker
  3,  // 113 Minehead Opponents Defeated
  3,  // 114 Total Research Grid Upgrades
  3,  // 115 Total Glimbo Trades
  3,  // 116 Unique Sushi Created
  3,  // 117 Button Presses
];

const STORAGE_KEY = 'tome-classifications';

export function getClassifications() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return DEFAULT_CLASSIFICATIONS.map((def, i) => stored[i] ?? def);
  } catch {
    return [...DEFAULT_CLASSIFICATIONS];
  }
}

export function setClassification(displayIndex, value) {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (value === DEFAULT_CLASSIFICATIONS[displayIndex]) {
      delete stored[displayIndex];
    } else {
      stored[displayIndex] = value;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {}
}
