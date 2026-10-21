import { GOAL_ROUTES } from '../../routes';
import { totalsDescriptor } from './index';
import { getHoleLeaderboardTotals } from '@parsers/world-5/hole';
import { MAX_JARS } from '@parsers/world-5/caverns/the-jars';
import { countOwnedLogBooks } from '@parsers/world-5/gaming';
import { getTotalTachyonsCollected } from '@parsers/class-specific/tesseract';
import { countRealObstructions } from '@parsers/world-7/jellyOperator';
import { getTotalBlessingLevels, getTotalDivinityLevel } from '@parsers/world-5/divinity';
import { getSpeedrunHighscore } from '@parsers/class-specific/speedrun';

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
    { key: 'lenses', name: 'Total lenses', value: ({ account }) => account?.research?.magnifiersOwned ?? 0 }
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
    { key: 'upgradeLevels', name: 'Total upgrade LV', value: ({ account }) => account?.spelunking?.saveTotals?.upgradeLevels ?? 0 }
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
    { key: 'perfectos', name: 'Perfectos', value: ({ account }) => account?.sushiStation?.saveTotals?.perfectos ?? 0 }
  ]
});

export const compassTotals = totalsDescriptor({
  system: 'compassTotals',
  label: 'Compass totals',
  route: GOAL_ROUTES.compassTotals,
  entries: [
    { key: 'levels', name: 'Total levels', value: ({ account }) => account?.compass?.totalUpgradeLevels },
    { key: 'dust', name: 'Total dust collected', value: ({ account }) => account?.compass?.totalDustsCollected || 0 }
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

export const PAGE_TOTALS = [researchTotals, spelunkingTotals, sushiTotals, compassTotals, tesseractTotals, grimoireTotals,
  vaultTotals, slabTotals, gamingTotals, holeTotals, galleryTotals, jellyTotals, buttonTotals,
  divinityTotals, sneakingTotals, farmingTotals, adviceFishTotals, zenithTotals, speedrunTotals];
