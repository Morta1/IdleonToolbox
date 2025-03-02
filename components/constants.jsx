export const drawerWidth = 240;
export const navBarHeight = 70;
export const navItems = ['dashboard', 'characters', 'account', 'tools', 'guilds', 'leaderboards', 'data'];
export const drawerPages = ['characters', 'account', 'tools'];
export const offlinePages = ['tools', 'data', 'leaderboards'];

export const PAGES = {
  GENERAL: {
    dashboard: {},
    characters: {},
    guilds: {},
    leaderboards: {},
    data: {}
  },
  ACCOUNT: {
    'misc': {
      icon: 'data/CharSlot',
      categories: [
        { label: 'general', icon: 'data/ClassIcons1' },
        { label: 'storage', icon: 'data/InvStorage42' },
        { label: 'quests', icon: 'data/Quest62' },
        { label: 'dungeons', icon: 'data/DungeonA7' },
        { label: 'apocalypses', icon: 'data/UISkillIcon110' },
        { label: 'grimoire', icon: 'data/GrimoireUpg18' },
        { label: 'constellations', icon: 'data/StarTitle1' },
        { label: 'upgradeVault', icon: 'data/VaultBut' },
        { label: 'randomEvents', icon: 'etc/Mega_Grumblo' },
        { label: 'guild', icon: 'etc/Guild' }
      ]
    },
    'premium-currency': {
      style: { filter: 'hue-rotate(180deg)' },
      icon: 'data/PremiumGem',
      categories: [
        { label: 'gemShop', icon: 'data/PremiumGem' },
        { label: 'companions', icon: 'data/PremiumGem', style: { filter: 'hue-rotate(280deg)' } }
      ]
    },
    'task board': {
      icon: 'etc/TasksStar',
      categories: [
        { label: 'achievements', icon: 'data/TaskAchBorder1' },
        { label: 'tasks', icon: 'etc/TasksStar' },
        { label: 'merits', icon: 'etc/Merit_4' }
      ]
    },
    'world 1': {
      icon: 'data/BadgeG2',
      categories: [
        { label: 'anvil', icon: 'data/ClassIcons43' },
        { label: 'forge', icon: 'data/ForgeD' },
        { label: 'bribes', icon: 'data/BribeW' },
        { label: 'stamps', icon: 'data/StampA34' },
        { label: 'owl', icon: 'etc/Owl' }
      ]
    },
    'world 2': {
      icon: 'data/BadgeD2',
      categories: [
        { label: 'bubbles', icon: 'data/aBrewOptionA0' },
        { label: 'Cauldrons', icon: 'data/aStirringStick0' },
        { label: 'vials', icon: 'data/aVials1' },
        { label: 'sigils', icon: 'data/LabBonus12' },
        { label: 'arcadeShop', icon: 'data/PachiBall1' },
        { label: 'islands', icon: 'data/Island1' },
        { label: 'killroy', icon: 'etc/Killroy_Skull' },
        { label: 'weeklyBosses', icon: 'etc/SWR_Containment' },
        { label: 'kangaroo', icon: 'data/RooA' },
        { label: 'voteBallot', icon: 'etc/VoteBallot' }
      ]
    },
    'world 3': {
      icon: 'data/BadgeI2',
      categories: [
        { label: 'Printer', icon: 'data/ConTower0' },
        { label: 'refinery', icon: 'data/TaskSc6' },
        { label: 'atomCollider', icon: 'data/ConTower8' },
        { label: 'Equinox', icon: 'data/Quest78' },
        { label: 'buildings', icon: 'data/ConTower7' },
        { label: 'deathNote', icon: 'data/ConTower2' },
        { label: 'worship', icon: 'data/ClassIcons50' },
        { label: 'prayers', icon: `data/PrayerSel` },
        { label: 'Traps', icon: 'data/TrapBoxSet1' },
        { label: 'saltLick', icon: 'data/ConTower3' },
        { label: 'construction', icon: 'data/ClassIcons49' }
      ]
    },
    'world 4': {
      icon: 'data/Ladle',
      categories: [
        { label: 'cooking', icon: 'data/ClassIcons51' },
        { label: 'breeding', icon: 'data/ClassIcons52' },
        { label: 'laboratory', icon: 'data/ClassIcons53' },
        { label: 'rift', icon: 'data/Mface75' },
        { label: 'tome', icon: 'etc/Tome_0' }
      ]
    },
    'world 5': {
      icon: 'data/GemP24',
      categories: [
        { label: 'sailing', icon: 'data/ClassIcons54' },
        { label: 'divinity', icon: 'data/ClassIcons55' },
        { label: 'gaming', icon: 'data/ClassIcons56' },
        { label: 'hole', icon: 'data/Quest90' },
        { label: 'slab', icon: 'etc/Slab' }
      ]
    },
    'world 6': {
      icon: 'etc/sneaking-temp',
      categories: [
        { label: 'farming', icon: 'data/ClassIcons57' },
        { label: 'sneaking', icon: 'data/ClassIcons58' },
        { label: 'summoning', icon: 'data/ClassIcons59' },
        { label: 'beanstalk', icon: 'etc/beanstalk1' }
      ]
    }

  },
  TOOLS: {
    'cardSearch': {
      icon: 'data/2CardsA0'
    },
    'builds': {
      icon: 'data/SmithingHammerChisel_x1'
    },
    'itemPlanner': {
      icon: 'data/EquipmentWeapons1'
    },
    'itemBrowser': {
      icon: 'data/EquipmentWeapons2'
    },
    'materialTracker': {
      icon: 'data/Refinery1'
    },
    'activeExpCalculator': {
      icon: 'data/StatusExp'
    },
    'godPlanner': {
      icon: 'data/DivGod1'
    },
    'guaranteedDropCalculator': {
      icon: 'data/TreeInterior1b'
    }
  }
}