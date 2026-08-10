import {
  getCharacters,
  getPlayerConstructionExpPerHour,
  getPlayerConstructionSpeed,
  getPlayerCrystalChance,
  initializeCharacter
} from './character';
import { getCards } from './cards';
import { getObols } from './obols';
import { applyStampsMulti, getStamps, updateStamps } from './world-1/stamps';
import { applyStatuesMulti, getStatues } from './world-1/statues';
import { getShrineExpBonus, getShrines } from './world-3/shrines';
import { getHighscores } from './highScores';
import { getGemShop } from './gemShop';
import { getShops } from './shops';
import { applyArtifactBonusOnSigil, getAlchemy, getEquippedBubbles, getLiquidCauldrons, updateVials } from './world-2/alchemy';
import { getStorage } from './storage';
import { getBribes } from './world-1/bribes';
import { getConstellations, getStarSigns } from './starSigns';
import { getPrayers } from './world-3/prayers';
import { getCoinsArray, tryToParse } from '@utility/helpers';
import { getForge } from './world-1/forge';
import { getConstruction, getTowers } from './world-3/construction';
import { getAchievements } from './achievements';
import { getRefinery } from './world-3/refinery';
import { getTasks } from './tasks';
import { getArcade } from './world-2/arcade';
import {
  calculateLeaderboard,
  calculateTotalSkillsLevel,
  enhanceColoTickets,
  enhanceKeysObject,
  getBundles,
  getCompanions,
  getCurrencies,
  getItemCapacity,
  getKillRoy,
  getLibraryBookTimes,
  getSlab,
  getHighestCharacterSkill,
  getTypeGen
} from './misc';
import { getLegendTalents } from './world-7/legendTalents';
import { getSaltLick } from './world-3/saltLick';
import { getDungeons } from './dungeons';
import { applyMealsMulti, getCooking, getKitchens } from './world-4/cooking';
import { getJewelBonus, getLab, getLabBonus, isLabEnabledBySorcererRaw } from './world-4/lab';
import { classes } from '@website-data';
import { getGuild } from './guild';
import { getPrinter } from './world-3/printer';
import { getTraps } from './world-3/traps';
import { getQuests, isWorldFinished } from './quests';
import { getDeathNote, getTopKilledMonsters } from './world-3/deathNote';
import { addBreedingChance, getBreeding } from './world-4/breeding';
import { applyGodCost, getDivinity } from './world-5/divinity';
import { getArtifacts, getLockedSailing, getSailing } from './world-5/sailing';
import { getGaming } from './world-5/gaming';
import { getAtoms } from './world-3/atomCollider';
import { getRift } from './world-4/rift';
import { getPostOfficeShipments } from './world-3/postoffice';
import { getIslands } from './world-2/islands';
import { getEquinox } from './world-3/equinox';
import { getTotalizerBonuses, getTotems } from './world-3/worship';
import { getSneaking } from '@parsers/world-6/sneaking';
import { getFarming, updateFarming } from '@parsers/world-6/farming';
import { getSummoning } from '@parsers/world-6/summoning';
import { getTome } from '@parsers/world-4/tome';
import { getOwl } from '@parsers/world-1/owl';
import { getKangaroo } from '@parsers/world-2/kangaroo';
import { getVoteBallot } from '@parsers/world-2/voteBallot';
import { getHole } from '@parsers/world-5/hole';
import { getGrimoire } from '@parsers/class-specific/grimoire';
import { getUpgradeVault } from '@parsers/misc/upgradeVault';
import { getCompass } from '@parsers/class-specific/compass';
import { getEmperor } from '@parsers/world-6/emperor';
import { getArmorSmithy } from '@parsers/world-3/armorSmithy';
import { getTesseract } from '@parsers/class-specific/tesseract';
import { getSpelunking } from '@parsers/world-7/spelunking';
import { getGallery, getCharacterGalleryBonuses } from '@parsers/world-7/gallery';
import { getCoralReef } from '@parsers/world-7/coralReef';
import { getClamWork } from '@parsers/world-7/clamWork';
import { getResearch } from '@parsers/world-7/research';
import { getMinehead } from '@parsers/world-7/minehead';
import { getButton } from '@parsers/world-7/button';
import { getTournament } from '@parsers/world-7/tournament';
import { getSushiStation } from '@parsers/world-7/sushiStation';
import { getAdviceFish } from '@parsers/misc';
import { getBubba } from '@parsers/clickers/bubba';
import { getHatRack } from '@parsers/world-3/hatRack';
import { getFriendBonusStats } from '@parsers/misc';
import { safeSection } from '@parsers/safeSection';
import type { IdleonData, Account, CompanionData, GuildData, ServerVars, TournamentData } from './types';

export const parseData = (idleonData: IdleonData, charNames: string[], companion: CompanionData, guildData: GuildData | null, serverVars: ServerVars, accountCreateTime: number, tournament: TournamentData | null) => {
  try {
    const staticData = getStaticData(idleonData, charNames, companion, guildData, serverVars, accountCreateTime, tournament);

    // Multiple passes needed to resolve cross-dependencies between parsers
    let processedData: any = null;
    for (let pass = 0; pass < 3; pass++) {
      processedData = serializeData(idleonData, serverVars, staticData, processedData);
    }

    const { accountData, charactersData } = processedData;
    return { account: accountData, characters: charactersData };
  } catch (err) {
    console.error('Error while parsing data', err);
    if (typeof window !== 'undefined' && typeof window.gtag !== 'undefined') {
      window.gtag('event', 'error', {
        event_category: 'error',
        event_label: 'parse',
        value: 1
      });
    }
    return { account: {}, characters: [] };
  }
};

/**
 * Pure/static parsers — only depend on raw input data, never on accountData.
 * Computed once and reused across all passes.
 */
const getStaticData = (idleonData: IdleonData, charNames: string[], companion: CompanionData, guildData: GuildData | null, serverVars: ServerVars, accountCreateTime: number, tournament: TournamentData | null) => {
  const serializedCharactersData = getCharacters(idleonData, charNames);
  const charactersLevels = serializedCharactersData?.map((char: any) => {
    const personalValuesMap = char?.[`PersonalValuesMap`];
    return { level: personalValuesMap?.StatList?.[4] ?? 0, class: classes?.[char?.[`CharacterClass`]] ?? '' };
  });
  const { tasks, tasksDescriptions, meritsDescriptions, unlockedRecipes, taskUnlocks } =
    safeSection<any>('tasks', { tasks: [], tasksDescriptions: [], meritsDescriptions: [], unlockedRecipes: [], taskUnlocks: [] },
      () => getTasks(idleonData));
  const { constellations, rawConstellationsDone } =
    safeSection<any>('constellations', { constellations: [], rawConstellationsDone: 0 },
      () => getConstellations(idleonData));
  const accountOptions = tryToParse(idleonData?.OptLacc);

  return {
    serializedCharactersData,
    charactersLevels,
    accountCreateTime,
    companions: safeSection<any>('companions', {}, () => getCompanions(companion, accountOptions)),
    bundles: safeSection<any>('bundles', [], () => getBundles(idleonData)),
    serverVars,
    accountOptions,
    gemShopPurchases: safeSection<any>('gemShopPurchases', [], () => getGemShop(idleonData)),
    bribes: safeSection<any>('bribes', [], () => getBribes(idleonData)),
    timeAway: tryToParse(idleonData?.TimeAway),
    obols: safeSection<any>('obols', { inventory: [], list: [], stats: {} }, () => getObols(idleonData)),
    looty: safeSection<any>('looty', {}, () => getSlab(idleonData)),
    tasks,
    tasksDescriptions,
    meritsDescriptions,
    unlockedRecipes,
    taskUnlocks,
    postOfficeShipments: safeSection<any>('postOfficeShipments', [], () => getPostOfficeShipments(idleonData)),
    towers: safeSection<any>('towers', {}, () => getTowers(idleonData)),
    achievements: safeSection<any>('achievements', [], () => getAchievements(idleonData)),
    rift: safeSection<any>('rift', {}, () => getRift(idleonData)),
    weeklyBossesRaw: tryToParse(idleonData?.WeeklyBoss),
    constellations,
    rawConstellationsDone,
    shopStock: safeSection<any>('shopStock', [], () => getShops(idleonData)),
    traps: safeSection<any>('traps', [], () => getTraps(serializedCharactersData)),
    totems: safeSection<any>('totems', [], () => getTotems(idleonData)),
    adviceFish: safeSection<any>('adviceFish', {}, () => getAdviceFish(idleonData)),
    guild: safeSection<any>('guild', null, () => getGuild(idleonData, guildData)),
    talentPoints: idleonData?.CYTalentPoints,
    tournamentServerData: tournament ?? null,
  };
};

const serializeData = (idleonData: IdleonData, serverVars: ServerVars, staticData: any, processedData: any) => {
  const { serializedCharactersData, ...staticAccountFields } = staticData;
  const charactersLevels = staticData.charactersLevels;

  // --- Start from previous pass (or empty) and overlay static fields immutably ---
  const accountData: any = {
    ...(processedData?.accountData || {}),
    ...staticAccountFields
  };
  let charactersData: any[] = processedData?.charactersData || [];

  // --- Dynamic parsers (depend on accountData / processedData) ---
  accountData.alchemy = safeSection<any>('alchemy', {}, () => getAlchemy(idleonData, serializedCharactersData, accountData));
  accountData.armorSmithy = safeSection<any>('armorSmithy', {}, () => getArmorSmithy(idleonData, serverVars, accountData));
  accountData.equippedBubbles = safeSection<any>('equippedBubbles', [], () => getEquippedBubbles(idleonData, accountData.alchemy?.bubbles, serializedCharactersData));
  accountData.storage = safeSection<any>('storage', {}, () => getStorage(idleonData, 'storage', accountData));
  accountData.saltLick = safeSection<any>('saltLick', [], () => getSaltLick(idleonData, accountData.storage?.list));
  accountData.dungeons = safeSection<any>('dungeons', {}, () => getDungeons(idleonData, accountData.accountOptions));
  accountData.prayers = safeSection<any>('prayers', [], () => getPrayers(idleonData, accountData.storage?.list));
  accountData.cards = safeSection<any>('cards', {}, () => getCards(idleonData, accountData));
  accountData.currencies = safeSection<any>('currencies', {}, () => getCurrencies(accountData, idleonData, processedData));
  accountData.stamps = safeSection<any>('stamps', {}, () => getStamps(idleonData, accountData));
  accountData.breeding = safeSection<any>('breeding', {}, () => getBreeding(idleonData, accountData, processedData));
  // charactersData is the previous pass's enriched characters (with skillsInfo); empty on pass 1.
  // Cooking Mastery's cross-character cooking-level sum resolves via the multi-pass serialization.
  accountData.cooking = safeSection<any>('cooking', {}, () => getCooking(idleonData, accountData, charactersData));
  accountData.divinity = safeSection<any>('divinity', null, () => getDivinity(idleonData, serializedCharactersData, accountData));
  accountData.sneaking = safeSection<any>('sneaking', {}, () => getSneaking(idleonData, serverVars, charactersData, accountData));
  accountData.farming = safeSection<any>('farming', {}, () => getFarming(idleonData, accountData, processedData?.charactersData));
  accountData.summoning = safeSection<any>('summoning', {}, () => getSummoning(idleonData, accountData, serializedCharactersData));
  accountData.statues = applyStatuesMulti(accountData, charactersData);
  accountData.hole = safeSection<any>('hole', {}, () => getHole(idleonData, accountData));
  accountData.lab = safeSection<any>('lab', {}, () => getLab(idleonData, serializedCharactersData, accountData));
  accountData.shrines = safeSection<any>('shrines', [], () => getShrines(idleonData, accountData));
  const { statues, zenith } = safeSection<any>('statues', { statues: [], zenith: {} }, () => getStatues(idleonData, serializedCharactersData, accountData));
  accountData.statues = statues;
  accountData.zenith = zenith;

  if (accountData.lab) {
    accountData.lab.connectedPlayers = accountData.lab.connectedPlayers?.map((char: any) => ({
      ...char,
      isDivinityConnected: accountData?.divinity?.linkedDeities?.[char?.playerId] === 4 || isLabEnabledBySorcererRaw(char, 4)
    }));
  }

  accountData.arcade = safeSection<any>('arcade', {}, () => getArcade(idleonData, accountData, serverVars));

  // Update values for meals, stamps, vials
  const certifiedStampBookMulti = getLabBonus(accountData.lab?.labBonuses, 7);
  accountData.stamps = applyStampsMulti(accountData.stamps, certifiedStampBookMulti);
  if (accountData.alchemy) {
    accountData.alchemy.vials = updateVials(accountData);
  }
  accountData.equinox = safeSection<any>('equinox', null, () => getEquinox(idleonData, accountData));
  const spelunkerObolMulti = getLabBonus(accountData.lab?.labBonuses, 8);
  const blackDiamondRhinestone = getJewelBonus(accountData.lab?.jewels, 16, spelunkerObolMulti);

  if (accountData.cooking) {
    accountData.cooking.meals = applyMealsMulti(accountData.cooking.meals, blackDiamondRhinestone);
  }

  accountData.starSigns = safeSection<any>('starSigns', [], () => getStarSigns(idleonData, accountData));

  charactersData = serializedCharactersData.map((char: any) => {
    return initializeCharacter(char, charactersLevels, { ...accountData }, idleonData);
  });
  accountData.grimoire = safeSection<any>('grimoire', {}, () => getGrimoire(idleonData, charactersData, accountData));
  accountData.compass = safeSection<any>('compass', {}, () => getCompass(idleonData, charactersData, accountData, serverVars));
  accountData.tesseract = safeSection<any>('tesseract', {}, () => getTesseract(idleonData, charactersData, accountData, serverVars));
  accountData.farming = updateFarming(charactersData, accountData);
  accountData.lab = safeSection<any>('lab', {}, () => getLab(idleonData, serializedCharactersData, accountData, charactersData));
  if (accountData.alchemy) {
    accountData.alchemy.vials = updateVials(accountData);
  }
  let currentWorld = 0;
  accountData.finishedWorlds = [1, 2, 3, 4, 5, 6, 7]?.reduce((res: any, world: number) => {
    const finishedWorld = !!isWorldFinished(charactersData, accountData, world);
    if (finishedWorld) {
      currentWorld = world;
    }
    return {
      ...res,
      [`World${world}`]: finishedWorld
    }
  }, {});
  accountData.currentWorld = currentWorld + 1;
  accountData.statues = applyStatuesMulti(accountData, charactersData);
  const skills = charactersData?.map(({ name, skillsInfo }: any) => ({ name, skillsInfo }));
  accountData.totalSkillsLevels = calculateTotalSkillsLevel(skills);
  accountData.highestSummoningLevel = safeSection<any>('highestSummoningLevel', 0, () => getHighestCharacterSkill(charactersData, 'summoning'));
  accountData.atoms = safeSection<any>('atoms', {}, () => getAtoms(idleonData, accountData));
  const artifacts = getArtifacts(idleonData, charactersData, accountData)
  if (accountData.alchemy?.p2w) {
    accountData.alchemy.p2w.sigils = applyArtifactBonusOnSigil(accountData.alchemy.p2w.sigils, artifacts);
  }
  if (accountData.alchemy) {
    accountData.alchemy.liquidCauldrons = safeSection<any>('alchemy.liquidCauldrons', [], () => getLiquidCauldrons(accountData));
  }
  accountData.spelunking = safeSection<any>('spelunking', {}, () => getSpelunking(idleonData, accountData, charactersData));
  accountData.hatRack = safeSection<any>('hatRack', {}, () => getHatRack(idleonData, accountData));
  accountData.gaming = safeSection<any>('gaming', null, () => getGaming(idleonData, charactersData, accountData, serverVars));
  // reapply atoms
  accountData.atoms = safeSection<any>('atoms', {}, () => getAtoms(idleonData, accountData));
  // Fallback is the locked shape rather than null so `account.sailing` is always an object with an
  // `unlocked` flag and empty collections - consumers branch on the flag, and some of them index
  // into these keys without optional-chaining every hop.
  accountData.sailing = safeSection<any>('sailing', getLockedSailing(artifacts), () => getSailing(idleonData, artifacts, charactersData, accountData, serverVars, charactersLevels));

  const leaderboard = calculateLeaderboard(skills);
  charactersData = charactersData.map((character: any) => ({ ...character, skillsInfo: (leaderboard as Record<string, any>)[character?.name] }));

  // A character slot with no parsed level (e.g. an empty companion slot with no class/stats data,
  // see the same gap in sailing.ts's Crystal_Steak fix) contributes 0 levels rather than poisoning
  // the whole sum to NaN via `sum + undefined`.
  accountData.accountLevel = charactersData?.reduce((sum: number, { level }: any) => sum + (level ?? 0), 0);
  accountData.highscores = safeSection<any>('highscores', { coloHighscores: [], minigameHighscores: [] }, () => getHighscores(idleonData, accountData));

  accountData.forge = safeSection<any>('forge', {}, () => getForge(idleonData, accountData));
  accountData.refinery = safeSection<any>('refinery', {}, () => getRefinery(idleonData, accountData.storage?.list, accountData.tasks));
  accountData.printer = safeSection<any>('printer', {}, () => getPrinter(idleonData, charactersData, accountData));
  accountData.quests = safeSection<any>('quests', {}, () => getQuests(charactersData));
  accountData.islands = safeSection<any>('islands', {}, () => getIslands(accountData, charactersData));
  accountData.deathNote = safeSection<any>('deathNote', {}, () => getDeathNote(idleonData, charactersData, accountData));
  accountData.topKilledMonsters = safeSection<any>('topKilledMonsters', [], () => getTopKilledMonsters(charactersData));
  accountData.killroy = safeSection<any>('killroy', {}, () => getKillRoy(idleonData, charactersData, accountData, serverVars));
  accountData.anvil = charactersData.map(({ anvil }: any) => anvil);

  // No save means no bank field at all - `parseFloat(undefined)` is NaN, not 0, so this needs the
  // same `? value : 0` guard `playersMoney` below already uses for a missing character's money.
  const bankMoney = parseFloat((idleonData?.MoneyBANK ? idleonData?.MoneyBANK : 0) as any);
  const playersMoney = charactersData?.reduce((res: number, char: any) => {
    return res + parseFloat(char?.money ? char?.money : 0)
  }, 0);
  const money = bankMoney + playersMoney;
  accountData.currencies.rawMoney = money;
  accountData.currencies.money = getCoinsArray(money);
  accountData.currencies.gems = idleonData?.GemsOwned ?? 0;
  accountData.currencies.KeysAll = safeSection<any>('currencies.KeysAll', [], () => enhanceKeysObject(accountData?.currencies?.KeysAll, charactersData, accountData));
  accountData.currencies.ColosseumTickets = safeSection<any>('currencies.ColosseumTickets', {}, () => enhanceColoTickets(accountData?.currencies?.ColosseumTickets, charactersData, accountData));
  accountData.currencies.penPals = accountData.accountOptions?.[99] ?? 0
  if (accountData.cooking) {
    accountData.cooking.kitchens = safeSection<any>('cooking.kitchens', [], () => getKitchens(idleonData, charactersData, accountData));
  }
  accountData.libraryTimes = safeSection<any>('libraryTimes', {}, () => getLibraryBookTimes(idleonData, charactersData, accountData));
  accountData.breeding = addBreedingChance(idleonData, accountData);
  if (accountData.divinity) {
    accountData.divinity.deities = applyGodCost(accountData);
  }
  charactersData = charactersData?.map((character: any) => {
    const { carryCapBags } = character;
    character.carryCapBags = carryCapBags?.map((carryBag: any) => {
      const typeGen = getTypeGen(carryBag?.Class);
      const capacity = getItemCapacity(typeGen, character, accountData);
      return {
        ...carryBag,
        capacityPerSlot: capacity?.value,
        breakdown: capacity?.breakdown,
        maxCapacity: capacity?.value * character?.inventorySlots
      }
    })
    character.crystalSpawnChance = getPlayerCrystalChance(character, accountData, idleonData);
    character.constructionSpeed = getPlayerConstructionSpeed(character, accountData);
    character.constructionExpPerHour = getPlayerConstructionExpPerHour(character, accountData);
    return character;
  })
  // Must run after constructionExpPerHour: the board's player XP totals are built from it, and the
  // optimizer on the construction page re-scores the same board with the very same characters.
  accountData.construction = safeSection<any>('construction', {}, () => getConstruction(idleonData, accountData, charactersData));
  accountData.stamps = updateStamps(accountData, charactersData);
  accountData.shrinesExpBonus = safeSection<any>('shrinesExpBonus', {}, () => getShrineExpBonus(charactersData, accountData));
  accountData.msaTotalizer = safeSection<any>('msaTotalizer', {}, () => getTotalizerBonuses(accountData));
  accountData.tome = safeSection<any>('tome', {}, () => getTome(idleonData, accountData, charactersData, serverVars));
  accountData.owl = safeSection<any>('owl', {}, () => getOwl(idleonData, accountData));
  accountData.kangaroo = safeSection<any>('kangaroo', {}, () => getKangaroo(idleonData, accountData));
  accountData.voteBallot = safeSection<any>('voteBallot', {}, () => getVoteBallot(idleonData, accountData));
  accountData.upgradeVault = safeSection<any>('upgradeVault', {}, () => getUpgradeVault(idleonData, accountData, charactersData));
  accountData.emperor = safeSection<any>('emperor', {}, () => getEmperor(idleonData, accountData));
  accountData.legendTalents = safeSection<any>('legendTalents', {}, () => getLegendTalents(idleonData, accountData, charactersData));
  accountData.gallery = safeSection<any>('gallery', {}, () => getGallery(idleonData, accountData));
  charactersData?.forEach((character: any) => {
    character.gallery = getCharacterGalleryBonuses(idleonData, accountData, character);
  });
  accountData.coralReef = safeSection<any>('coralReef', {}, () => getCoralReef(idleonData, accountData, charactersData));
  accountData.clamWork = safeSection<any>('clamWork', {}, () => getClamWork(idleonData, accountData));
  accountData.minehead = safeSection<any>('minehead', {}, () => getMinehead(idleonData, accountData, serverVars));
  accountData.tournament = safeSection<any>('tournament', {}, () => getTournament(idleonData, accountData, staticData.tournamentServerData));
  accountData.research = safeSection<any>('research', {}, () => getResearch(idleonData, accountData, charactersData));
  accountData.button = safeSection<any>('button', {}, () => getButton(accountData, charactersData));
  accountData.sushiStation = safeSection<any>('sushiStation', null, () => getSushiStation(idleonData, accountData));
  accountData.bubba = safeSection<any>('bubba', {}, () => getBubba(idleonData, accountData));
  accountData.friendBonusStats = safeSection<any>('friendBonusStats', {}, () => getFriendBonusStats(accountData));

  return { accountData, charactersData };
};
