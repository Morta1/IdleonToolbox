import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { DESCRIPTORS, getDescriptor } from '@utility/goals/registry';
import { pageIcon, totalsDescriptor } from '@utility/goals/registry/totals';
import { GOAL_ROUTES } from '@utility/goals/routes';
import { getHoleLeaderboardTotals } from '@parsers/world-5/hole';
import { MAX_JARS } from '@parsers/world-5/caverns/the-jars';
import { countOwnedLogBooks } from '@parsers/world-5/gaming';
import { getTotalTachyonsCollected } from '@parsers/class-specific/tesseract';
import { getSpeedrunHighscore } from '@parsers/class-specific/speedrun';
import { calcBubbleLevels } from '@parsers/world-2/alchemy';
import { calcStampLevels } from '@parsers/world-1/stamps';
import { calcStatueLevels } from '@parsers/world-1/statues';
import { calcShrineLevels } from '@parsers/world-3/shrines';
import { getEventShopBonus } from '@parsers/misc';
import { CRUCIBLE_MENAGERIE_UNLOCK, isMenagerieUnlockOwned } from '@parsers/world-7/menagerie';
import { worldsArray } from '@utility/helpers';
import { ninjaExtraInfo } from '@website-data';

const TOTALS = DESCRIPTORS.filter((d) => d.totals);

describe('totalsDescriptor', () => {
  const route = '/account/world-7/research';
  const d = totalsDescriptor({
    system: 'stubTotals',
    label: 'Stub totals',
    route,
    entries: [
      { key: 'a', name: 'With max', icon: 'data/Opal', value: () => 3, max: () => 10 },
      { key: 'b', name: 'No max', value: () => undefined, max: () => 0 }
    ]
  });

  it('lists one row per entry with its value and a real max', () => {
    const rows = d.list({ account: {} });
    expect(rows.map(d.key)).toEqual(['a', 'b']);
    expect(rows.map(d.name)).toEqual(['With max', 'No max']);
    expect(rows.map((row) => d.metrics.value.value(row))).toEqual([3, 0]);
    expect(rows.map((row) => d.metrics.value.max(row))).toEqual([10, null]);
  });

  it('an entry without its own icon shows the page icon', () => {
    const rows = d.list({ account: {} });
    expect(d.icon(rows[0])).toBe('data/Opal');
    expect(d.icon(rows[1])).toBe('data/ClassIcons61');
    expect(pageIcon(route)).toBe('data/ClassIcons61');
  });

  it('takes single entries only, named after the page', () => {
    expect(d.entryOnly).toBe(true);
    expect(d.totals).toBe(true);
    expect(d.scope).toBe('account');
  });
});

it.each(TOTALS.map((d) => [d.system, d]))('%s: label is "<page> totals" and the route is the page', (system, d) => {
  expect(d.label).toMatch(/^\S.* totals$/);
  expect(GOAL_ROUTES[system]).toBe(d.route);
  expect(pageIcon(d.route)).toBeTruthy();
});

// Each row: the page's own header expression, or a total summed from the fixture's save, on the latest fixture. [value, max] (max null when the page shows none).
const { account, characters } = parseFixture(latest);
const real = (n) => (n > 0 ? n : null);
const research = account.research;
const spelunking = account.spelunking;
const sushi = account.sushiStation;
const hole = account.hole;
const gallery = account.gallery;
const jelly = account.jellyOperator;
const eventShopItems = ninjaExtraInfo[39].toChunks(2);
// the Achievements page header: 70 slots per world, fillers left out, worlds with none hidden
const achievementWorlds = worldsArray.map((_, worldIndex) => {
  const shown = account.achievements.slice(worldIndex * 70, worldIndex * 70 + 70)
    .filter(({ name, visualIndex }) => visualIndex !== -1 && !name?.includes('FILLER'));
  return { key: `world${worldIndex + 1}`, completed: shown.filter(({ completed }) => completed).length, total: shown.length };
});
const achievementOracle = [...achievementWorlds, {
  key: 'total',
  completed: achievementWorlds.reduce((sum, { completed }) => sum + completed, 0),
  total: achievementWorlds.reduce((sum, { total }) => sum + total, 0)
}];
const ribbons = account.cooking.cookingMastery.ribbons;
const PAGE_VALUES = [
  ['researchTotals', 'level', research.researchLevel ?? 0, null],
  ['researchTotals', 'observations', research.totalOccurrencesFound ?? 0, real(research.occurrencesToBeFound)],
  ['researchTotals', 'gridPoints', research.gridPTSpent ?? 0, real(research.gridPTSearned)],
  ['researchTotals', 'lenses', research.magnifiersOwned ?? 0, null],
  ['spelunkingTotals', 'power', spelunking.power.value, null],
  ['spelunkingTotals', 'discoveries', spelunking.discoveriesCount, real(spelunking.maxDiscoveries)],
  ['spelunkingTotals', 'grandDiscoveries', spelunking.totalGrandDiscoveries, null],
  ['spelunkingTotals', 'upgradeLevels', spelunking.saveTotals?.upgradeLevels ?? 0, null],
  ['sushiTotals', 'uniqueSushi', sushi.uniqueSushi ?? 0, null],
  ['sushiTotals', 'upgradeLevels', sushi.saveTotals?.upgradeLevels ?? 0, null],
  ['sushiTotals', 'knowledgeLevels', sushi.saveTotals?.knowledgeLevels ?? 0, null],
  ['sushiTotals', 'perfectos', sushi.saveTotals?.perfectos ?? 0, null],
  ['compassTotals', 'levels', account.compass.totalUpgradeLevels, null],
  ['compassTotals', 'dust', account.compass.totalDustsCollected || 0, null],
  ['tesseractTotals', 'levels', account.tesseract.totalUpgradeLevels, null],
  ['tesseractTotals', 'tachyons', getTotalTachyonsCollected(account), null],
  ['grimoireTotals', 'levels', account.grimoire.totalUpgradeLevels, null],
  ['grimoireTotals', 'bones', account.grimoire.totalBonesCollected || 0, null],
  ['vaultTotals', 'levels', account.upgradeVault.totalUpgradeLevels, null],
  ['slabTotals', 'looted', account.looty.lootedItems, real(account.looty.totalItems)],
  ['slabTotals', 'missing', account.looty.missingItems, null],
  ['slabTotals', 'greenstacks', account.looty.greenstackableStackedCount, real(account.looty.greenstackableCount)],
  ['gamingTotals', 'crowns', account.gaming.ratKing?.crownsCount ?? 0, real(account.gaming.logBook?.length ?? 0)],
  ['gamingTotals', 'logBook', countOwnedLogBooks(account.gaming.logBook), real(account.gaming.logBook?.length ?? 0)],
  ['holeTotals', 'opalsInvested', getHoleLeaderboardTotals(hole).opalsInvested, null],
  ['holeTotals', 'caverns', hole.unlockedCaverns, null],
  ['holeTotals', 'layers', getHoleLeaderboardTotals(hole).layersDestroyed, null],
  // Engineer tab and the cavern headers
  ['holeTotals', 'schematics', hole.unlockedSchematics, real(hole.totalSchematics)],
  ['holeTotals', 'barExpansions', getHoleLeaderboardTotals(hole).barExpansions, null],
  ['holeTotals', 'motherlodeLayer', hole.caverns.motherlode.layer, null],
  ['holeTotals', 'denBestScore', Math.round(hole.holesObject.extraCalculations[8]), null],
  ['holeTotals', 'braveryLevels', getHoleLeaderboardTotals(hole).braveryLevels, null],
  ['holeTotals', 'bellRings', hole.caverns.theBell.rings, null],
  ['holeTotals', 'stringLevels', getHoleLeaderboardTotals(hole).stringLevels, null],
  ['holeTotals', 'hiveLayer', hole.caverns.theHive.layer, null],
  ['holeTotals', 'grottoLayer', hole.caverns.grotto.layer, null],
  ['holeTotals', 'justiceLevels', getHoleLeaderboardTotals(hole).justiceLevels, null],
  ['holeTotals', 'jars', hole.caverns.theJars.totalJars, MAX_JARS],
  ['holeTotals', 'jarsDestroyed', hole.caverns.theJars.totalJarsDestroyed, null],
  ['holeTotals', 'jarEnhancing', hole.caverns.theJars.totalEnhancingLevels ?? 0, null],
  ['holeTotals', 'evertreeLayer', hole.caverns.evertree.layer, null],
  ['holeTotals', 'gambitPoints', Math.floor(hole.caverns.gambit.points), null],
  ['holeTotals', 'templeLayer', hole.caverns.theTemple.layer, null],
  ['holeTotals', 'templeTorches', Math.floor(hole.caverns.theTemple.torches), null],
  ['holeTotals', 'fountainUpgrades', getHoleLeaderboardTotals(hole).fountainUpgrades, null],
  ['holeTotals', 'trenchDepth', hole.caverns.theBottomlessTrench.layer, null],
  ['galleryTotals', 'podiums', gallery.podiumsOwned || 0, null],
  ['galleryTotals', 'lv2Podiums', gallery.lv2PodiumsOwned || 0, null],
  ['galleryTotals', 'lv3Podiums', gallery.lv3PodiumsOwned || 0, null],
  ['galleryTotals', 'lv4Podiums', gallery.lv4PodiumsOwned || 0, null],
  ['jellyTotals', 'obstructions', jelly.obstructionsDefeated ?? 0, real(jelly.maxObstructionsDefeated)],
  ['jellyTotals', 'cellTypes', jelly.unitsOwned ?? 0, real(jelly.cells?.length ?? 0)],
  ['jellyTotals', 'cellLevels', jelly.cellLevelTotal ?? 0, null],
  ['jellyTotals', 'upgradeLevels', jelly.upgradeLevelTotal ?? 0, null],
  ['jellyTotals', 'slots', jelly.slotsOwned ?? 0, null],
  ['buttonTotals', 'presses', account.button.totalPresses || 0, null],
  // divinity.jsx header and the Coral Kid Upgrades tab cards
  ['divinityTotals', 'godRank', account.divinity.godRank || 1, null],
  ['divinityTotals', 'blessingLevels', account.divinity.deities.reduce((sum, { level }) => sum + (level || 0), 0), null],
  ['divinityTotals', 'coralKidLevels', account.coralReef.coralKidUpgradeLevelTotal ?? 0, null],
  ['divinityTotals', 'divinityLevels', characters.reduce((sum, c) => sum + (c.skillsInfo?.divinity?.level ?? 0), 0), null],
  ['sneakingTotals', 'mastery', account.sneaking.ninjaMastery ?? 0, null],
  ['sneakingTotals', 'floors', account.sneaking.unlockedFloors ?? 0, null],
  ['farmingTotals', 'cropsFound', account.farming.cropsFound, null],
  ['farmingTotals', 'rankPoints', account.farming.usedPoints, real(account.farming.totalPoints)],
  ['adviceFishTotals', 'upgradeLevels', spelunking.saveTotals?.adviceFishUpgradeLevels ?? 0, null],
  ['zenithTotals', 'upgradeLevels', spelunking.saveTotals?.zenithMarketUpgradeLevels ?? 0, null],
  ['speedrunTotals', 'highscore', getSpeedrunHighscore(account), null],
  // Compass header exalted stamps (used / used + remaining), the Medallions tab header, the Abominations cards
  ['compassTotals', 'exaltedStamps', account.compass.usedExaltedStamps, real(account.compass.usedExaltedStamps + account.compass.remainingExaltedStamps)],
  ['compassTotals', 'medallions', account.compass.totalAcquiredMedallions, real(account.compass.medallions.length)],
  ['compassTotals', 'abominations', account.compass.abominations.filter(({ unlocked }) => unlocked > 0).length, real(account.compass.abominations.length)],
  // General page Totals list
  ['generalTotals', 'bubbles', calcBubbleLevels(account.alchemy.bubbles), null],
  ['generalTotals', 'stamps', calcStampLevels(account.stamps), null],
  ['generalTotals', 'statues', calcStatueLevels(account.statues), null],
  ['generalTotals', 'shrines', calcShrineLevels(account.shrines), null],
  // the save keeps the highest damage as a string
  ['generalTotals', 'highestDamage', Number(account.tasks[0][1][0] ?? 0), null],
  ['generalTotals', 'poOrders', account.tasks[0][1][5] ?? 0, null],
  ['generalTotals', 'monstersKilled', account.tasks[0][0][0] ?? 0, null],
  ['generalTotals', 'refinedSalts', account.tasks[0][2][0] ?? 0, null],
  ['generalTotals', 'matsPrinted', account.tasks[0][2][3] ?? 0, null],
  ['generalTotals', 'trashedCogs', account.tasks[0][2][1] ?? 0, null],
  ['generalTotals', 'plantsPicked', account.tasks[0][4][3] ?? 0, null],
  ['storageTotals', 'slots', account.storage.slots.value, null],
  ['questTotals', 'unique', account.totalQuestsCompleted ?? 0, null],
  ['dungeonTotals', 'rank', account.dungeons.rank, null],
  ['eventShopTotals', 'bonuses', eventShopItems.filter((_, index) => getEventShopBonus(account, index)).length, real(eventShopItems.length)],
  ['bubbaTotals', 'upgradesUnlocked', account.bubba.upgrades.filter(({ unlocked }) => unlocked).length, real(account.bubba.upgrades.length)],
  // Royal Armory Outposts and Resources tab headers
  ['armoryTotals', 'outposts', account.royalGuardian.outposts.length, null],
  ['armoryTotals', 'unitTypes', account.royalGuardian.outpostStats.unitsUnlocked ?? 0, real(account.royalGuardian.outpostStats.unitNames.length)],
  ['armoryTotals', 'glorified', account.royalGuardian.outposts.filter(({ boosted }) => boosted).length, real(account.royalGuardian.outposts.length)],
  ['armoryTotals', 'worlds', account.royalGuardian.outpostStats.worldsUnlocked ?? 0, null],
  ['armoryTotals', 'nodeLevels', account.royalGuardian.resources.reduce((sum, { nodeLevel }) => sum + nodeLevel, 0), null],
  ...achievementOracle.map(({ key, completed, total }) => ['achievementTotals', key, completed, real(total)]),
  ...worldsArray.map((_, world) => {
    // the Tasks page header for that world tab
    const worldTasks = account.tasksDescriptions?.[world]?.slice(0, 9) ?? [];
    const counted = worldTasks.filter(({ name }) => name !== 'Undisclosed_Task');
    return ['taskTotals', `world${world + 1}`, counted.reduce((sum, { level }) => sum + level, 0), real(counted.reduce((sum, { maxLevel }) => sum + maxLevel, 0))];
  }),
  // Cooking Mastery tab header
  ['cookingTotals', 'masteryLevel', account.cooking.cookingMastery.level, null],
  ['cookingTotals', 'masteryRank', account.cooking.cookingMastery.rank, null],
  ['cookingTotals', 'purplePoints', account.cooking.cookingMastery.points.categorySpent, real(account.cooking.cookingMastery.points.categorySpent + account.cooking.cookingMastery.points.categoryLeft)],
  ['cookingTotals', 'yellowPoints', account.cooking.cookingMastery.points.nodeSpent, real(account.cooking.cookingMastery.points.nodeSpent + account.cooking.cookingMastery.points.nodeLeft)],
  // Breeding Arena tab
  ['breedingTotals', 'arenaLevel', account.breeding.maxArenaLevel, null],
  ['breedingTotals', 'crucibleLevel', isMenagerieUnlockOwned(account, CRUCIBLE_MENAGERIE_UNLOCK) ? account.breeding.maxCrucibleLevel ?? 0 : 0, null],
  ['tomeTotals', 'points', account.tome.totalPoints, null],
  // Research header cards
  ['researchTotals', 'shapes', research.shapesOwned ?? 0, null],
  ['researchTotals', 'magnifyingGlasses', research.magnifyingGlassOwned ?? 0, null],
  ['researchTotals', 'monocles', research.opticalMonocleOwned ?? 0, null],
  ['researchTotals', 'kaleidoscopes', research.kaleidoscopeOwned ?? 0, null],
  // Spelunking Lore tab header
  ['spelunkingTotals', 'depths', spelunking.saveTotals.depths ?? 0, null],
  ['spelunkingTotals', 'manicDepths', spelunking.saveTotals.manicDepths ?? 0, null],
  ['sushiTotals', 'bestCombo', sushi.currency.combo.best ?? 0, null],
  // Gaming General header and the Imports and Mutations tabs
  ['gamingTotals', 'bestNugget', parseFloat(account.gaming.bestNugget), null],
  ['gamingTotals', 'snailLevel', account.gaming.snailLevel, null],
  ['gamingTotals', 'poingHighscore', account.gaming.poingHighscore, null],
  ['gamingTotals', 'mutations', account.gaming.unlockedMutations, real(account.gaming.mutations.length)],
  ['summoningTotals', 'endlessLevel', account.summoning.highestEndlessLevel, null],
  ['summoningTotals', 'upgradeLevels', account.summoning.totalUpgradesLevels, null],
  ['clamTotals', 'workerClass', account.clamWork.workerClass ?? 0, null],
  ['clamTotals', 'scurgeLevel', account.clamWork.scurge.level ?? 0, null],
  // Menagerie page header
  ['menagerieTotals', 'rank', account.menagerie.rank ?? 0, null],
  ['menagerieTotals', 'unlocks', account.menagerie.unlocks.filter(({ owned }) => owned).length, real(account.menagerie.unlocks.length)],
  ['menagerieTotals', 'boostLevels', account.menagerie.boosts.reduce((sum, { level }) => sum + (level ?? 0), 0), null],
  ['mineheadTotals', 'opponentsBeat', account.minehead.opponentsBeat ?? 0, null],
  ['mineheadTotals', 'maxLives', account.minehead.maxHP_You ?? 3, null],
  ['glimboTotals', 'trades', account.minehead.glimboTotalTrades ?? 0, null],
  ['menagerieTotals', 'shells', account.menagerie.shells ?? 0, real(account.menagerie.shellReq)],
  // Royal Armory page header and Royal Statues tab
  ['armoryTotals', 'armoryLevels', account.royalGuardian.armory.totalLevels || 0, null],
  ['armoryTotals', 'shelves', account.royalGuardian.armory.unlockedSlots ?? 0, real(account.royalGuardian.armory.slotToId.length)],
  ['armoryTotals', 'statueLevels', 44, null],
  // Cooking Ribbons tab header
  ['cookingTotals', 'ribbonRanks', ribbons.total ?? 0, null],
  ['cookingTotals', 'highestRibbon', ribbons.highest ?? 0, null],
  ['cookingTotals', 'ribbonedMeals', ribbons.ribbonedMeals ?? 0, real(ribbons.totalMeals)],
  ['gamingTotals', 'paletteLevels', 444, null],
  ['holeTotals', 'measurementLevels', getHoleLeaderboardTotals(hole).measurementLevels, null],
  // Farming Market and Stickers tab headers
  ['farmingTotals', 'dayMarketLevels', 1308, null],
  ['farmingTotals', 'nightMarketLevels', 789, null],
  ['farmingTotals', 'stickers', account.farming.totalStickers ?? 0, null],
  ['petsTotals', 'boxesOpened', account.companions.totalBoxesOpened ?? 0, null],
  ['taskUnlockTotals', 'recipes', account.taskUnlocks.unlockedRecipes ?? 0, null],
  ['killroyTotals', 'kills', account.killroy.totalKills ?? 0, null],
  ['sigilTotals', 'levels', 102, null],
  ['vialTotals', 'levels', 855, null],
  ['buildingTotals', 'levels', account.towers.totalLevels ?? 0, null],
  ['hatRackTotals', 'hats', account.hatRack.totalHats || 0, null],
  ['equinoxTotals', 'upgradeLevels', 94, null],
  ['emperorTotals', 'showdown', account.emperor.highestEmperorShowdown || 0, null],
  ['friendsTotals', 'slots', account.friendBonusStats.slots, null],
  ['sailingTotals', 'boatLevels', 7119, null],
  ['sailingTotals', 'boats', account.sailing.boats.length, null],
  ['legendTotals', 'points', account.legendTalents.pointsSpent || 0, real(account.legendTalents.pointsOwned.value)]
];

describe('totals equal the page header on the latest fixture', () => {
  it.each(PAGE_VALUES)('%s %s', (system, key, value, max) => {
    const d = getDescriptor(system);
    const ctx = parseFixture(latest);
    const row = d.list(ctx).find((r) => d.key(r) === key);
    expect(row).toBeDefined();
    expect(d.metrics.value.value(row, ctx)).toBe(value);
    expect(d.metrics.value.max(row, ctx)).toBe(max);
  });

  it('the table covers every totals entry', () => {
    const covered = PAGE_VALUES.map(([system, key]) => `${system}:${key}`).toSorted();
    const listed = TOTALS.flatMap((d) => d.list(parseFixture(latest)).map((row) => `${d.system}:${d.key(row)}`)).toSorted();
    expect(listed).toEqual(covered);
  });
});
