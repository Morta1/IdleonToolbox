export const drawerWidth = 240;
export const navBarHeight = 70;
export const navItems = ['dashboard', 'characters', 'account', 'tools', 'guilds', 'statistics', 'leaderboards', 'data'];
export const drawerPages = ['characters', 'account', 'tools'];
export const offlinePages = ['tools', 'data', 'statistics', 'leaderboards'];

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
        { label: 'storage', icon: 'data/InvStorage42', tabs: ['Items', 'Slots'] },
        { label: 'quests', icon: 'data/Quest62' },
        { label: 'dungeons', icon: 'data/DungeonA7', tabs: ['Passives', 'Rng Items', 'Traits'] },
        {
          label: 'constellations',
          icon: 'data/StarTitle1',
          tabs: ['Constellations', 'Star Signs'],
          nestedTabs: [
            { tab: 'Star Signs', nestedTab: 'chronus' },
            { tab: 'Star Signs', nestedTab: 'hydron' },
            { tab: 'Star Signs', nestedTab: 'seraph' }
          ]
        },
        { label: 'upgradeVault', icon: 'data/VaultBut' },
        { label: 'randomEvents', icon: 'etc/Mega_Grumblo' },
        { label: 'eventShop', icon: 'etc/Event_Currency' },
        { label: 'guild', icon: 'etc/Guild' }
      ]
    },
    'prem-currency': {
      style: { filter: 'hue-rotate(180deg)' },
      icon: 'data/PremiumGem',
      categories: [
        { label: 'gemShop', icon: 'data/PremiumGem' },
        { label: 'companions', icon: 'data/PremiumGem', style: { filter: 'hue-rotate(280deg)' } }
      ]
    },
    'class-specific': {
      icon: 'data/ClassSwapB',
      categories: [
        { label: 'apocalypses', icon: 'data/UISkillIcon110' },
        { label: 'grimoire', icon: 'data/GrimoireUpg18', tabs: ['Upgrades', 'Upgrade Optimizer', 'Monsters'] },
        {
          label: 'compass',
          icon: 'data/UISkillIcon421',
          tabs: ['Upgrades', 'Upgrade Optimizer', 'Abominations', 'Medallions', 'Portals']
        },
        {
          label: 'tesseract',
          icon: 'data/StatusArc0',
          tabs: ['Upgrades', 'Upgrade Optimizer', 'Maps']
        }
      ]
    },
    'task board': {
      icon: 'etc/TasksStar',
      categories: [
        { label: 'achievements', icon: 'data/TaskAchBorder1' },
        { label: 'tasks', icon: 'etc/TasksStar' },
        { label: 'merits', icon: 'etc/Merit_4' },
        { label: 'unlocks', icon: 'data/PetLockB0' }
      ]
    },
    'world 1': {
      icon: 'data/BadgeG2',
      categories: [
        { label: 'anvil', icon: 'data/ClassIcons43' },
        { label: 'forge', icon: 'data/ForgeD', tabs: ['Slots', 'Upgrades'] },
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
        {
          label: 'killroy',
          icon: 'etc/Killroy_Skull',
          tabs: ['Schedule', 'Upgrades', 'Permanent Upgrades', 'Monsters']
        },
        { label: 'weeklyBosses', icon: 'etc/SWR_Containment' },
        { label: 'kangaroo', icon: 'data/RooA', tabs: ['Upgrades', 'Tar Upgrades', 'Bonuses'] },
        { label: 'voteBallot', icon: 'etc/VoteBallot' }
      ]
    },
    'world 3': {
      icon: 'data/BadgeI2',
      categories: [
        { label: 'Printer', icon: 'data/ConTower0' },
        { label: 'refinery', icon: 'data/TaskSc6' },
        { label: 'atomCollider', icon: 'data/ConTower8' },
        { label: 'Equinox', icon: 'data/Quest78', tabs: ['Upgrades', 'Challenges'] },
        { label: 'buildings', icon: 'data/ConTower7' },
        { label: 'deathNote', icon: 'data/ConTower2' },
        { label: 'worship', icon: 'data/ClassIcons50', tabs: ['Charge', 'Totems'] },
        { label: 'prayers', icon: `data/PrayerSel` },
        { label: 'Traps', icon: 'data/TrapBoxSet1' },
        { label: 'saltLick', icon: 'data/ConTower3' },
        { label: 'construction', icon: 'data/ClassIcons49', tabs: ['Main', 'Cog stat calculator'] },
        { label: 'armorSmithy', icon: 'etc/Armor_Set_Smithy' }
      ]
    },
    'world 4': {
      icon: 'data/Ladle',
      categories: [
        { label: 'cooking', icon: 'data/ClassIcons51', tabs: ['Kitchens', 'Meals'] },
        {
          label: 'breeding', icon: 'data/ClassIcons52',
          tabs: ['Pets', 'Territory', 'Upgrades', 'Arena'],
          nestedTabs: [
            { tab: 'Pets', nestedTab: 'Shinies' },
            { tab: 'Pets', nestedTab: 'Breedability' },
            { tab: 'Pets', nestedTab: 'All' }
          ]
        },
        {
          label: 'laboratory',
          icon: 'data/ClassIcons53',
          tabs: ['Main frame', 'Console', 'Chips And Jewels Rotation']
        },
        { label: 'rift', icon: 'data/Mface75', tabs: ['Tasks', 'Bonuses', 'Skill Mastery', 'Construct Mastery'] },
        { label: 'tome', icon: 'etc/Tome_0' }
      ]
    },
    'world 5': {
      icon: 'data/GemP24',
      categories: [
        {
          label: 'sailing',
          icon: 'data/ClassIcons54',
          tabs: [
            { tab: 'Artifacts', icon: 'data/Arti29' },
            { tab: 'Trades', icon: 'etc/Blob_Trade' },
            { tab: 'Boats and Captains', icon: 'etc/Boat_Frame_5' },
            { tab: 'Loot Pile', icon: 'data/SailT0' },
            { tab: 'Chests', icon: 'data/SailChest5' }]
        },
        { label: 'divinity', icon: 'data/ClassIcons55' },
        { label: 'gaming', icon: 'data/ClassIcons56', tabs: ['Imports', 'Superbits', 'Mutations', 'Log book'] },
        {
          label: 'hole',
          icon: 'data/Quest90',
          tabs: [
            { tab: 'Explore', icon: 'etc/Villager_0' },
            { tab: 'Engineer', icon: 'etc/Villager_1' },
            { tab: 'Bonuses', icon: 'etc/Villager_2' },
            { tab: 'Measure', icon: 'etc/Villager_3' },
            { tab: 'Study', icon: 'etc/Villager_4' }
          ],
          nestedTabs: [
            { tab: 'Explore', icon: 'etc/Cavern_0', nestedTab: 'The well' },
            { tab: 'Explore', icon: 'etc/Cavern_1', nestedTab: 'Motherlode' },
            { tab: 'Explore', icon: 'etc/Cavern_2', nestedTab: 'The den' },
            { tab: 'Explore', icon: 'etc/Cavern_3', nestedTab: 'Bravery' },
            { tab: 'Explore', icon: 'etc/Cavern_4', nestedTab: 'The bell' },
            { tab: 'Explore', icon: 'etc/Cavern_5', nestedTab: 'The harp' },
            { tab: 'Explore', icon: 'etc/Cavern_6', nestedTab: 'The Lamp' },
            { tab: 'Explore', icon: 'etc/Cavern_7', nestedTab: 'The hive' },
            { tab: 'Explore', icon: 'etc/Cavern_8', nestedTab: 'Grotto' },
            { tab: 'Explore', icon: 'etc/Cavern_9', nestedTab: 'Justice' },
            { tab: 'Explore', icon: 'etc/Cavern_10', nestedTab: 'The Jars', nestedTabs: ['Jars', 'Collectibles'] },
            { tab: 'Explore', icon: 'etc/Cavern_11', nestedTab: 'Evertree' },
            { tab: 'Explore', icon: 'etc/Cavern_12', nestedTab: 'Wisdom' },
            { tab: 'Explore', icon: 'etc/Cavern_13', nestedTab: 'Gambit' },
            { tab: 'Explore', icon: 'etc/Cavern_14', nestedTab: 'The Temple' }
          ]
        },
        { label: 'slab', icon: 'etc/Slab' }
      ]
    },
    'world 6': {
      icon: 'etc/sneaking-temp',
      categories: [
        { label: 'farming', icon: 'data/ClassIcons57', tabs: ['Plot', 'Market', 'Exotic Market', 'Rank database', 'Crop'] },
        {
          label: 'sneaking',
          icon: 'data/ClassIcons58',
          tabs: ['Inventory', 'Jade Emporium', 'Upgrades', 'Charms', 'Mastery']
        },
        { label: 'summoning', icon: 'data/ClassIcons59', tabs: ['Upgrades', 'Winner Bonuses', 'Battles', 'Stones'] },
        { label: 'beanstalk', icon: 'etc/beanstalk1' },
        { label: 'emperor', icon: 'data/Boss6' }
      ]
    },
    'world 7': {
      icon: 'etc/Spelunking',
      categories: [
        { label: 'Spelunking', icon: 'etc/Spelunking', tabs: [] },
        { label: 'S2', icon: 'data/ClassIconsNA2', tabs: [] },
        { label: 'S3', icon: 'data/ClassIconsNA2', tabs: [] },

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
    'activeStuffCalculator': {
      icon: 'data/Grasslands1'
    },
    'samplingCompanion': {
      icon: 'data/EquipmentHats69'
    },
    'formulas': {
      icon: 'data/EquipmentStatues29'
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