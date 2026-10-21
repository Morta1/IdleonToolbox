import { GOAL_ROUTES } from '../../routes';
import { totalsDescriptor } from './index';
import { getHoleLeaderboardTotals } from '@parsers/world-5/hole';
import { countOwnedLogBooks } from '@parsers/world-5/gaming';
import { getTotalTachyonsCollected } from '@parsers/class-specific/tesseract';
import { countRealObstructions } from '@parsers/world-7/jellyOperator';

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
    { key: 'layers', name: 'Total layers destroyed', value: ({ account }) => getHoleLeaderboardTotals(account?.hole).layersDestroyed }
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

export const PAGE_TOTALS = [researchTotals, spelunkingTotals, sushiTotals, compassTotals, tesseractTotals, grimoireTotals,
  vaultTotals, slabTotals, gamingTotals, holeTotals, galleryTotals, jellyTotals, buttonTotals];
