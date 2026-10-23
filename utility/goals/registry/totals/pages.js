import { GOAL_ROUTES } from '../../routes';
import { totalsDescriptor } from './index';
import { getHoleLeaderboardTotals } from '@parsers/world-5/hole';
import { MAX_JARS } from '@parsers/world-5/caverns/the-jars';
import { countOwnedLogBooks } from '@parsers/world-5/gaming';
import { getTotalTachyonsCollected } from '@parsers/class-specific/tesseract';
import { countRealObstructions } from '@parsers/world-7/jellyOperator';
import { getTotalBlessingLevels, getTotalDivinityLevel } from '@parsers/world-5/divinity';
import { getSpeedrunHighscore } from '@parsers/class-specific/speedrun';
import { calcBubbleLevels } from '@parsers/world-2/alchemy';
import { calcStampLevels } from '@parsers/world-1/stamps';
import { calcStatueLevels } from '@parsers/world-1/statues';
import { calcShrineLevels } from '@parsers/world-3/shrines';
import { getEventShopBonus, getEventShopItems, getLifetimeStat, LIFETIME_STATS } from '@parsers/misc';
import { getAchievementWorldTotals } from '@parsers/achievements';
import { getWorldTaskLevels } from '@parsers/tasks';
import { getCrucibleMaxLevel } from '@parsers/world-7/menagerie';
import { worldsArray } from '@utility/helpers';
import { MINEHEAD_BASE_LIVES } from '@parsers/world-7/minehead';

// Each value is the page header's own expression; max is what the page shows after the slash.
export const researchTotals = totalsDescriptor({
  system: 'researchTotals',
  label: 'Research totals',
  route: GOAL_ROUTES.researchTotals,
  entries: [
    { key: 'level', name: 'Research level', value: ({ account }) => account?.research?.researchLevel ?? 0 },
    {
      key: 'observations',
      name: 'Observations found',
      value: ({ account }) => account?.research?.totalOccurrencesFound ?? 0,
      max: ({ account }) => account?.research?.occurrencesToBeFound
    },
    {
      key: 'gridPoints',
      name: 'Grid points',
      value: ({ account }) => account?.research?.gridPTSpent ?? 0,
      max: ({ account }) => account?.research?.gridPTSearned
    },
    { key: 'lenses', name: 'Total lenses', value: ({ account }) => account?.research?.magnifiersOwned ?? 0 },
    { key: 'shapes', name: 'Shapes owned', value: ({ account }) => account?.research?.shapesOwned ?? 0 },
    { key: 'magnifyingGlasses', name: 'Magnifying glasses', value: ({ account }) => account?.research?.magnifyingGlassOwned ?? 0 },
    { key: 'monocles', name: 'Optical monocles', value: ({ account }) => account?.research?.opticalMonocleOwned ?? 0 },
    { key: 'kaleidoscopes', name: 'Kaleidoscopes', value: ({ account }) => account?.research?.kaleidoscopeOwned ?? 0 }
  ]
});

export const spelunkingTotals = totalsDescriptor({
  system: 'spelunkingTotals',
  label: 'Spelunking totals',
  route: GOAL_ROUTES.spelunkingTotals,
  entries: [
    { key: 'power', name: 'Power', icon: 'data/CaveShopUpg17', value: ({ account }) => account?.spelunking?.power?.value },
    {
      key: 'discoveries',
      name: 'Discoveries',
      value: ({ account }) => account?.spelunking?.discoveriesCount,
      max: ({ account }) => account?.spelunking?.maxDiscoveries
    },
    { key: 'grandDiscoveries', name: 'Grand discoveries', value: ({ account }) => account?.spelunking?.totalGrandDiscoveries },
    { key: 'upgradeLevels', name: 'Total upgrade LV', value: ({ account }) => account?.spelunking?.saveTotals?.upgradeLevels ?? 0 },
    // the Lore tab header
    { key: 'depths', name: 'Total best depth', value: ({ account }) => account?.spelunking?.saveTotals?.depths ?? 0 },
    { key: 'manicDepths', name: 'Total best manic depth', value: ({ account }) => account?.spelunking?.saveTotals?.manicDepths ?? 0 }
  ]
});

export const sushiTotals = totalsDescriptor({
  system: 'sushiTotals',
  label: 'Sushi Station totals',
  route: GOAL_ROUTES.sushiTotals,
  entries: [
    { key: 'uniqueSushi', name: 'Unique sushi', value: ({ account }) => account?.sushiStation?.uniqueSushi ?? 0 },
    { key: 'upgradeLevels', name: 'Total upgrade LV', value: ({ account }) => account?.sushiStation?.saveTotals?.upgradeLevels ?? 0 },
    { key: 'knowledgeLevels', name: 'Total knowledge LV', value: ({ account }) => account?.sushiStation?.saveTotals?.knowledgeLevels ?? 0 },
    { key: 'perfectos', name: 'Perfectos', value: ({ account }) => account?.sushiStation?.saveTotals?.perfectos ?? 0 },
    { key: 'bestCombo', name: 'Best combo', icon: 'etc/Bucks', value: ({ account }) => account?.sushiStation?.currency?.combo?.best ?? 0 }
  ]
});

export const compassTotals = totalsDescriptor({
  system: 'compassTotals',
  label: 'Compass totals',
  route: GOAL_ROUTES.compassTotals,
  entries: [
    { key: 'levels', name: 'Total levels', value: ({ account }) => account?.compass?.totalUpgradeLevels },
    { key: 'dust', name: 'Total dust collected', value: ({ account }) => account?.compass?.totalDustsCollected || 0 },
    {
      key: 'exaltedStamps',
      name: 'Exalted stamps used',
      icon: 'etc/Exalted_Stamp_Frame',
      value: ({ account }) => account?.compass?.usedExaltedStamps ?? 0,
      max: ({ account }) => (account?.compass?.usedExaltedStamps ?? 0) + (account?.compass?.remainingExaltedStamps ?? 0)
    },
    // the Medallions tab header, and the Abominations tab cards
    {
      key: 'medallions',
      name: 'Total medallions',
      icon: 'data/WWcoin',
      value: ({ account }) => account?.compass?.totalAcquiredMedallions ?? 0,
      max: ({ account }) => account?.compass?.medallions?.length
    },
    {
      key: 'abominations',
      name: 'Abominations killed',
      icon: 'data/CompassUpg119',
      value: ({ account }) => account?.compass?.totalKilledAbominations ?? 0,
      max: ({ account }) => account?.compass?.abominations?.length
    }
  ]
});

export const tesseractTotals = totalsDescriptor({
  system: 'tesseractTotals',
  label: 'Tesseract totals',
  route: GOAL_ROUTES.tesseractTotals,
  entries: [
    { key: 'levels', name: 'Total levels', value: ({ account }) => account?.tesseract?.totalUpgradeLevels },
    { key: 'tachyons', name: 'Total tachyons collected', value: ({ account }) => getTotalTachyonsCollected(account) }
  ]
});

export const grimoireTotals = totalsDescriptor({
  system: 'grimoireTotals',
  label: 'Grimoire totals',
  route: GOAL_ROUTES.grimoireTotals,
  entries: [
    { key: 'levels', name: 'Total levels', value: ({ account }) => account?.grimoire?.totalUpgradeLevels },
    { key: 'bones', name: 'Total bones collected', value: ({ account }) => account?.grimoire?.totalBonesCollected || 0 }
  ]
});

export const vaultTotals = totalsDescriptor({
  system: 'vaultTotals',
  label: 'Upgrade Vault totals',
  route: GOAL_ROUTES.vaultTotals,
  entries: [
    { key: 'levels', name: 'Total levels', value: ({ account }) => account?.upgradeVault?.totalUpgradeLevels }
  ]
});

export const slabTotals = totalsDescriptor({
  system: 'slabTotals',
  label: 'Slab totals',
  route: GOAL_ROUTES.slabTotals,
  entries: [
    {
      key: 'looted',
      name: 'Looted items',
      value: ({ account }) => account?.looty?.lootedItems,
      max: ({ account }) => account?.looty?.totalItems
    },
    { key: 'missing', name: 'Missing items', value: ({ account }) => account?.looty?.missingItems },
    {
      key: 'greenstacks',
      name: 'Greenstacks',
      value: ({ account }) => account?.looty?.greenstackableStackedCount,
      max: ({ account }) => account?.looty?.greenstackableCount
    }
  ]
});

export const gamingTotals = totalsDescriptor({
  system: 'gamingTotals',
  label: 'Gaming totals',
  route: GOAL_ROUTES.gamingTotals,
  entries: [
    {
      key: 'crowns',
      name: 'Crowns',
      icon: 'data/GamingRatCrown',
      value: ({ account }) => account?.gaming?.ratKing?.crownsCount ?? 0,
      max: ({ account }) => account?.gaming?.logBook?.length ?? 0
    },
    {
      key: 'logBook',
      name: 'Log book',
      icon: 'data/GamingPlanth5',
      value: ({ account }) => countOwnedLogBooks(account?.gaming?.logBook),
      max: ({ account }) => account?.gaming?.logBook?.length ?? 0
    },
    { key: 'bestNugget', name: 'Best nugget', icon: 'etc/GamingNugget', value: ({ account }) => parseFloat(account?.gaming?.bestNugget) },
    // the Imports tab: the Immortal Snail and the POiNG Controller
    { key: 'snailLevel', name: 'Snail level', icon: 'data/GamingItem7', value: ({ account }) => account?.gaming?.snailLevel ?? 0 },
    { key: 'poingHighscore', name: 'POiNG highscore', icon: 'data/GamingItem6', value: ({ account }) => account?.gaming?.poingHighscore ?? 0 },
    // the Mutations tab lights up the first unlockedMutations cards
    {
      key: 'mutations',
      name: 'Mutations unlocked',
      icon: 'etc/DNA',
      value: ({ account }) => account?.gaming?.unlockedMutations ?? 0,
      max: ({ account }) => account?.gaming?.mutations?.length
    }
  ]
});

export const holeTotals = totalsDescriptor({
  system: 'holeTotals',
  label: 'Hole totals',
  route: GOAL_ROUTES.holeTotals,
  entries: [
    {
      key: 'opalsInvested',
      name: 'Total opals invested',
      icon: 'data/Opal',
      value: ({ account }) => getHoleLeaderboardTotals(account?.hole).opalsInvested
    },
    {
      key: 'jarsDestroyed',
      name: 'Total jars destroyed',
      icon: 'etc/Jar_0',
      value: ({ account }) => account?.hole?.caverns?.theJars?.totalJarsDestroyed
    },
    { key: 'caverns', name: 'Unlocked caverns', value: ({ account }) => account?.hole?.unlockedCaverns },
    { key: 'layers', name: 'Total layers destroyed', value: ({ account }) => getHoleLeaderboardTotals(account?.hole).layersDestroyed },
    {
      key: 'schematics',
      name: 'Unlocked schematics',
      icon: 'etc/Villager_1',
      value: ({ account }) => account?.hole?.unlockedSchematics,
      max: ({ account }) => account?.hole?.totalSchematics
    },
    // each cavern tab's header numbers, with that cavern's icon
    ...[
      { key: 'barExpansions', name: 'Total bar expansions', cavern: 0, value: (hole) => getHoleLeaderboardTotals(hole).barExpansions },
      { key: 'motherlodeLayer', name: 'Motherlode layer', cavern: 1, value: (hole) => hole?.caverns?.motherlode?.layer },
      { key: 'denBestScore', name: 'The Den best score', cavern: 2, value: (hole) => Math.round(hole?.holesObject?.extraCalculations?.[8]) },
      { key: 'braveryLevels', name: 'Total bravery levels', cavern: 3, value: (hole) => getHoleLeaderboardTotals(hole).braveryLevels },
      { key: 'bellRings', name: 'The Bell rings', cavern: 4, value: (hole) => hole?.caverns?.theBell?.rings },
      { key: 'stringLevels', name: 'Total string levels', cavern: 5, value: (hole) => getHoleLeaderboardTotals(hole).stringLevels },
      { key: 'hiveLayer', name: 'The Hive layer', cavern: 7, value: (hole) => hole?.caverns?.theHive?.layer },
      { key: 'grottoLayer', name: 'Grotto layer', cavern: 8, value: (hole) => hole?.caverns?.grotto?.layer },
      { key: 'justiceLevels', name: 'Total justice levels', cavern: 9, value: (hole) => getHoleLeaderboardTotals(hole).justiceLevels },
      { key: 'jars', name: 'Total jars', cavern: 10, value: (hole) => hole?.caverns?.theJars?.totalJars, max: () => MAX_JARS },
      { key: 'jarEnhancing', name: 'Total jar enhancing levels', cavern: 10, value: (hole) => hole?.caverns?.theJars?.totalEnhancingLevels ?? 0 },
      { key: 'evertreeLayer', name: 'Evertree layer', cavern: 11, value: (hole) => hole?.caverns?.evertree?.layer },
      { key: 'gambitPoints', name: 'Gambit points', cavern: 13, value: (hole) => Math.floor(hole?.caverns?.gambit?.points) },
      { key: 'templeLayer', name: 'The Temple layer', cavern: 14, value: (hole) => hole?.caverns?.theTemple?.layer },
      { key: 'templeTorches', name: 'The Temple torches', cavern: 14, value: (hole) => Math.floor(hole?.caverns?.theTemple?.torches) },
      { key: 'fountainUpgrades', name: 'Total fountain upgrades', cavern: 15, value: (hole) => getHoleLeaderboardTotals(hole).fountainUpgrades },
      { key: 'trenchDepth', name: 'The Bottomless Trench depth', cavern: 16, value: (hole) => hole?.caverns?.theBottomlessTrench?.layer }
    ].map(({ cavern, value, ...entry }) => ({
      ...entry,
      icon: `etc/Cavern_${cavern}`,
      value: ({ account }) => value(account?.hole)
    }))
  ]
});

export const galleryTotals = totalsDescriptor({
  system: 'galleryTotals',
  label: 'Gallery totals',
  route: GOAL_ROUTES.galleryTotals,
  entries: [
    { key: 'podiums', name: 'Total podiums', value: ({ account }) => account?.gallery?.podiumsOwned || 0 },
    { key: 'lv2Podiums', name: 'Level 2 podiums', icon: 'data/GalleryPod1', value: ({ account }) => account?.gallery?.lv2PodiumsOwned || 0 },
    { key: 'lv3Podiums', name: 'Level 3 podiums', icon: 'data/GalleryPod2', value: ({ account }) => account?.gallery?.lv3PodiumsOwned || 0 },
    { key: 'lv4Podiums', name: 'Level 4 podiums', icon: 'data/GalleryPod3', value: ({ account }) => account?.gallery?.lv4PodiumsOwned || 0 }
  ]
});

export const jellyTotals = totalsDescriptor({
  system: 'jellyTotals',
  label: 'Jelly Operator totals',
  route: GOAL_ROUTES.jellyTotals,
  entries: [
    {
      key: 'obstructions',
      name: 'Obstructions removed',
      value: ({ account }) => account?.jellyOperator?.obstructionsDefeated ?? 0,
      max: ({ account }) => countRealObstructions(account?.jellyOperator?.obstructions)
    },
    {
      key: 'cellTypes',
      name: 'Cell types unlocked',
      value: ({ account }) => account?.jellyOperator?.unitsOwned ?? 0,
      max: ({ account }) => account?.jellyOperator?.cells?.length ?? 0
    },
    { key: 'cellLevels', name: 'Total cell LV', value: ({ account }) => account?.jellyOperator?.cellLevelTotal ?? 0 },
    { key: 'upgradeLevels', name: 'Total upgrade LV', value: ({ account }) => account?.jellyOperator?.upgradeLevelTotal ?? 0 },
    { key: 'slots', name: 'Jelly slots', value: ({ account }) => account?.jellyOperator?.slotsOwned ?? 0 }
  ]
});

export const buttonTotals = totalsDescriptor({
  system: 'buttonTotals',
  label: 'The Button totals',
  route: GOAL_ROUTES.buttonTotals,
  entries: [
    { key: 'presses', name: 'Total presses', value: ({ account }) => account?.button?.totalPresses || 0 }
  ]
});

export const divinityTotals = totalsDescriptor({
  system: 'divinityTotals',
  label: 'Divinity totals',
  route: GOAL_ROUTES.divinityTotals,
  entries: [
    { key: 'godRank', name: 'God rank', value: ({ account }) => account?.divinity?.godRank || 1 },
    { key: 'blessingLevels', name: 'Total blessing levels', value: ({ account }) => getTotalBlessingLevels(account?.divinity?.deities) },
    // the Coral Kid Upgrades tab cards
    { key: 'coralKidLevels', name: 'Total Coral Kid upgrade LV', value: ({ account }) => account?.coralReef?.coralKidUpgradeLevelTotal ?? 0 },
    { key: 'divinityLevels', name: 'Total Divinity LV', value: ({ characters }) => getTotalDivinityLevel(characters) }
  ]
});

export const sneakingTotals = totalsDescriptor({
  system: 'sneakingTotals',
  label: 'Sneaking totals',
  route: GOAL_ROUTES.sneakingTotals,
  entries: [
    { key: 'mastery', name: 'Ninja mastery', value: ({ account }) => account?.sneaking?.ninjaMastery ?? 0 },
    { key: 'floors', name: 'Floors unlocked', icon: 'data/NjD0', value: ({ account }) => account?.sneaking?.unlockedFloors ?? 0 }
  ]
});

export const farmingTotals = totalsDescriptor({
  system: 'farmingTotals',
  label: 'Farming totals',
  route: GOAL_ROUTES.farmingTotals,
  entries: [
    { key: 'cropsFound', name: 'Crops found', value: ({ account }) => account?.farming?.cropsFound ?? 0 },
    {
      key: 'rankPoints',
      name: 'Rank points',
      value: ({ account }) => account?.farming?.usedPoints ?? 0,
      max: ({ account }) => account?.farming?.totalPoints
    }
  ]
});

export const adviceFishTotals = totalsDescriptor({
  system: 'adviceFishTotals',
  label: 'Advice Fish totals',
  route: GOAL_ROUTES.adviceFishTotals,
  entries: [
    { key: 'upgradeLevels', name: 'Total upgrade LV', value: ({ account }) => account?.spelunking?.saveTotals?.adviceFishUpgradeLevels ?? 0 }
  ]
});

export const zenithTotals = totalsDescriptor({
  system: 'zenithTotals',
  label: 'Zenith Market totals',
  route: GOAL_ROUTES.zenithTotals,
  entries: [
    { key: 'upgradeLevels', name: 'Total upgrade LV', value: ({ account }) => account?.spelunking?.saveTotals?.zenithMarketUpgradeLevels ?? 0 }
  ]
});

export const speedrunTotals = totalsDescriptor({
  system: 'speedrunTotals',
  label: 'Speedrun totals',
  route: GOAL_ROUTES.speedrunTotals,
  entries: [
    { key: 'highscore', name: 'Portal highscore', icon: 'data/UISkillIcon45', value: ({ account }) => getSpeedrunHighscore(account) }
  ]
});

export const generalTotals = totalsDescriptor({
  system: 'generalTotals',
  label: 'General totals',
  route: GOAL_ROUTES.generalTotals,
  // the Totals list
  entries: [
    { key: 'bubbles', name: 'Bubbles', icon: 'data/aBrewOptionA0', value: ({ account }) => calcBubbleLevels(account?.alchemy?.bubbles) },
    { key: 'stamps', name: 'Stamps', icon: 'data/StampA34', value: ({ account }) => calcStampLevels(account?.stamps) },
    { key: 'statues', name: 'Statues', icon: 'data/EquipmentStatues1', value: ({ account }) => calcStatueLevels(account?.statues) },
    { key: 'shrines', name: 'Shrines', icon: 'data/UISkillIcon639', value: ({ account }) => calcShrineLevels(account?.shrines) },
    ...LIFETIME_STATS.map((stat) => ({
      key: stat.key,
      name: stat.name,
      icon: `data/${stat.icon}`,
      value: ({ account }) => getLifetimeStat(account, stat)
    }))
  ]
});

export const storageTotals = totalsDescriptor({
  system: 'storageTotals',
  label: 'Storage totals',
  route: GOAL_ROUTES.storageTotals,
  entries: [
    { key: 'slots', name: 'Slots owned', icon: 'data/InvStorage1', value: ({ account }) => account?.storage?.slots?.value }
  ]
});

export const questTotals = totalsDescriptor({
  system: 'questTotals',
  label: 'Quest totals',
  route: GOAL_ROUTES.questTotals,
  entries: [
    { key: 'unique', name: 'Unique quests completed', value: ({ account }) => account?.totalQuestsCompleted ?? 0 }
  ]
});

export const dungeonTotals = totalsDescriptor({
  system: 'dungeonTotals',
  label: 'Dungeon totals',
  route: GOAL_ROUTES.dungeonTotals,
  entries: [
    { key: 'rank', name: 'Rank', value: ({ account }) => account?.dungeons?.rank }
  ]
});

export const eventShopTotals = totalsDescriptor({
  system: 'eventShopTotals',
  label: 'Event Shop totals',
  route: GOAL_ROUTES.eventShopTotals,
  entries: [
    {
      key: 'bonuses',
      name: 'Total bonuses',
      value: ({ account }) => getEventShopItems().filter((_, index) => getEventShopBonus(account, index)).length,
      max: () => getEventShopItems().length
    }
  ]
});

export const bubbaTotals = totalsDescriptor({
  system: 'bubbaTotals',
  label: 'Bubba totals',
  route: GOAL_ROUTES.bubbaTotals,
  entries: [
    // the upgrade cards light up as meat production unlocks them
    {
      key: 'upgradesUnlocked',
      name: 'Upgrades unlocked',
      icon: 'etc/Bubba_0',
      value: ({ account }) => (account?.bubba?.upgrades ?? []).filter(({ unlocked }) => unlocked).length,
      max: ({ account }) => account?.bubba?.upgrades?.length
    }
  ]
});

export const armoryTotals = totalsDescriptor({
  system: 'armoryTotals',
  label: 'Royal Armory totals',
  route: GOAL_ROUTES.armoryTotals,
  // the Outposts and Resources tab headers
  entries: [
    { key: 'outposts', name: 'Outposts built', value: ({ account }) => (account?.royalGuardian?.outposts ?? []).length },
    {
      key: 'unitTypes',
      name: 'Unit types unlocked',
      value: ({ account }) => account?.royalGuardian?.outpostStats?.unitsUnlocked ?? 0,
      max: ({ account }) => account?.royalGuardian?.outpostStats?.unitNames?.length
    },
    {
      key: 'glorified',
      name: 'Glorified outposts',
      value: ({ account }) => (account?.royalGuardian?.outposts ?? []).filter(({ boosted }) => boosted).length,
      max: ({ account }) => (account?.royalGuardian?.outposts ?? []).length
    },
    { key: 'worlds', name: 'Worlds unlocked', value: ({ account }) => account?.royalGuardian?.outpostStats?.worldsUnlocked ?? 0 },
    {
      key: 'nodeLevels',
      name: 'Total node levels',
      value: ({ account }) => (account?.royalGuardian?.resources ?? []).reduce((sum, { nodeLevel }) => sum + nodeLevel, 0)
    }
  ]
});

// The Achievements page header: one entry per world, then all worlds
const achievementWorld = (account, worldIndex) => getAchievementWorldTotals(account?.achievements, worldsArray).worldTotals
  .find((world) => world.worldIndex === worldIndex);
export const achievementTotals = totalsDescriptor({
  system: 'achievementTotals',
  label: 'Achievement totals',
  route: GOAL_ROUTES.achievementTotals,
  entries: [
    ...worldsArray.map((worldName, worldIndex) => ({
      key: `world${worldIndex + 1}`,
      name: `${worldName} achievements`,
      value: ({ account }) => achievementWorld(account, worldIndex)?.completed ?? 0,
      max: ({ account }) => achievementWorld(account, worldIndex)?.total
    })),
    {
      key: 'total',
      name: 'Total achievements',
      value: ({ account }) => getAchievementWorldTotals(account?.achievements, worldsArray).combined.completed,
      max: ({ account }) => getAchievementWorldTotals(account?.achievements, worldsArray).combined.total
    }
  ]
});

export const taskTotals = totalsDescriptor({
  system: 'taskTotals',
  label: 'Task totals',
  route: GOAL_ROUTES.taskTotals,
  // each world tab's "Task levels"
  entries: worldsArray.map((worldName, world) => ({
    key: `world${world + 1}`,
    name: `${worldName} task levels`,
    value: ({ account }) => getWorldTaskLevels(account?.tasksDescriptions, world).totalLevels,
    max: ({ account }) => getWorldTaskLevels(account?.tasksDescriptions, world).maxLevels
  }))
});

// The Mastery tab's points read "spent / spent + left"
const masteryPoints = (account, kind) => {
  const points = account?.cooking?.cookingMastery?.points;
  return { spent: points?.[`${kind}Spent`] ?? 0, total: (points?.[`${kind}Spent`] ?? 0) + (points?.[`${kind}Left`] ?? 0) };
};
export const cookingTotals = totalsDescriptor({
  system: 'cookingTotals',
  label: 'Cooking totals',
  route: GOAL_ROUTES.cookingTotals,
  // the Mastery tab header
  entries: [
    { key: 'masteryLevel', name: 'Mastery level', value: ({ account }) => account?.cooking?.cookingMastery?.level },
    { key: 'masteryRank', name: 'Mastery rank', value: ({ account }) => account?.cooking?.cookingMastery?.rank },
    {
      key: 'purplePoints',
      name: 'Purple points',
      value: ({ account }) => masteryPoints(account, 'category').spent,
      max: ({ account }) => masteryPoints(account, 'category').total
    },
    {
      key: 'yellowPoints',
      name: 'Yellow points',
      value: ({ account }) => masteryPoints(account, 'node').spent,
      max: ({ account }) => masteryPoints(account, 'node').total
    }
  ]
});

export const breedingTotals = totalsDescriptor({
  system: 'breedingTotals',
  label: 'Breeding totals',
  route: GOAL_ROUTES.breedingTotals,
  // the Arena tab
  entries: [
    { key: 'arenaLevel', name: 'Arena max level', value: ({ account }) => account?.breeding?.maxArenaLevel },
    { key: 'crucibleLevel', name: 'Crucible max level', value: ({ account }) => getCrucibleMaxLevel(account) }
  ]
});

export const tomeTotals = totalsDescriptor({
  system: 'tomeTotals',
  label: 'Tome totals',
  route: GOAL_ROUTES.tomeTotals,
  entries: [
    { key: 'points', name: 'Total points', value: ({ account }) => account?.tome?.totalPoints }
  ]
});

export const summoningTotals = totalsDescriptor({
  system: 'summoningTotals',
  label: 'Summoning totals',
  route: GOAL_ROUTES.summoningTotals,
  entries: [
    { key: 'endlessLevel', name: 'Highest endless level', icon: 'etc/Endless_Summoning', value: ({ account }) => account?.summoning?.highestEndlessLevel },
    // the Upgrades tab toggle "Upgrades: n"
    { key: 'upgradeLevels', name: 'Total upgrade LV', value: ({ account }) => account?.summoning?.totalUpgradesLevels }
  ]
});

export const clamTotals = totalsDescriptor({
  system: 'clamTotals',
  label: 'Clam Work totals',
  route: GOAL_ROUTES.clamTotals,
  entries: [
    { key: 'workerClass', name: 'Worker class', value: ({ account }) => account?.clamWork?.workerClass ?? 0 },
    // the Scurge tab header
    { key: 'scurgeLevel', name: 'Scurge LV', value: ({ account }) => account?.clamWork?.scurge?.level ?? 0 }
  ]
});

export const menagerieTotals = totalsDescriptor({
  system: 'menagerieTotals',
  label: 'Menagerie totals',
  route: GOAL_ROUTES.menagerieTotals,
  entries: [
    { key: 'rank', name: 'Menagerie rank', value: ({ account }) => account?.menagerie?.rank ?? 0 },
    {
      key: 'unlocks',
      name: 'Unlocks owned',
      value: ({ account }) => account?.menagerie?.unlocks?.filter(({ owned }) => owned)?.length ?? 0,
      max: ({ account }) => account?.menagerie?.unlocks?.length ?? 0
    },
    {
      key: 'boostLevels',
      name: 'Total Boost LV',
      value: ({ account }) => account?.menagerie?.boosts?.reduce((sum, { level }) => sum + (level ?? 0), 0) ?? 0
    }
  ]
});

export const mineheadTotals = totalsDescriptor({
  system: 'mineheadTotals',
  label: 'Minehead totals',
  route: GOAL_ROUTES.mineheadTotals,
  entries: [
    { key: 'opponentsBeat', name: 'Opponents beat', value: ({ account }) => account?.minehead?.opponentsBeat ?? 0 },
    { key: 'maxLives', name: 'Max lives', value: ({ account }) => account?.minehead?.maxHP_You ?? MINEHEAD_BASE_LIVES }
  ]
});

export const glimboTotals = totalsDescriptor({
  system: 'glimboTotals',
  label: 'Glimbo totals',
  route: GOAL_ROUTES.glimboTotals,
  entries: [
    { key: 'trades', name: 'Total trades', value: ({ account }) => account?.minehead?.glimboTotalTrades ?? 0 }
  ]
});

export const legendTotals = totalsDescriptor({
  system: 'legendTotals',
  label: 'Legend Talents totals',
  route: GOAL_ROUTES.legendTotals,
  entries: [
    {
      key: 'points',
      name: 'Legend points spent',
      value: ({ account }) => account?.legendTalents?.pointsSpent || 0,
      max: ({ account }) => account?.legendTalents?.pointsOwned?.value
    }
  ]
});

export const PAGE_TOTALS = [researchTotals, spelunkingTotals, sushiTotals, compassTotals, tesseractTotals, grimoireTotals,
  vaultTotals, slabTotals, gamingTotals, holeTotals, galleryTotals, jellyTotals, buttonTotals,
  divinityTotals, sneakingTotals, farmingTotals, adviceFishTotals, zenithTotals, speedrunTotals,
  generalTotals, storageTotals, questTotals, dungeonTotals, eventShopTotals, bubbaTotals, armoryTotals, achievementTotals, taskTotals,
  cookingTotals, breedingTotals, tomeTotals,
  summoningTotals, clamTotals, menagerieTotals, mineheadTotals, glimboTotals, legendTotals];
