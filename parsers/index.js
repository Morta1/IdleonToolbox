import {
  getCharacters,
  getPlayerConstructionExpPerHour,
  getPlayerConstructionSpeed,
  initializeCharacter
} from './character';
import { getCards } from './cards';
import { getObols } from './obols';
import { applyStampsMulti, getStamps, updateStamps } from './stamps';
import { applyStatuesMulti, getStatues } from './statues';
import { getShrineExpBonus, getShrines } from './shrines';
import { getHighscores } from './highScores';
import { getGemShop } from './gemShop';
import { getShops } from './shops';
import { applyArtifactBonusOnSigil, getAlchemy, getEquippedBubbles, getLiquidCauldrons, updateVials } from './alchemy';
import { getStorage } from './storage';
import { getBribes } from './bribes';
import { getConstellations, getStarSigns } from './starSigns';
import { getPrayers } from './prayers';
import { getCoinsArray, tryToParse } from '@utility/helpers';
import { getForge } from './forge';
import { getConstruction, getTowers } from './construction';
import { getAchievements } from './achievements';
import { getRefinery } from './refinery';
import { getTasks } from './tasks';
import { getArcade } from './arcade';
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
  getTypeGen
} from './misc';
import { getLegendTalents } from './world-7/legendTalents';
import { getSaltLick } from './saltLick';
import { getDungeons } from './dungeons';
import { applyMealsMulti, getCooking, getKitchens } from './cooking';
import { getJewelBonus, getLab, getLabBonus, isLabEnabledBySorcererRaw } from './lab';
import { classes } from '@website-data';
import { getGuild } from './guild';
import { getPrinter } from './printer';
import { getTraps } from './traps';
import { getQuests, isWorldFinished } from './quests';
import { getDeathNote, getTopKilledMonsters } from './deathNote';
import { addBreedingChance, getBreeding } from './breeding';
import { applyGodCost, getDivinity } from './divinity';
import { getArtifacts, getSailing } from './sailing';
import { getGaming } from './gaming';
import { getAtoms } from './atomCollider';
import { getRift } from './world-4/rift';
import { getPostOfficeShipments } from './postoffice';
import { getIslands } from './world-2/islands';
import { getEquinox } from './equinox';
import { getTotalizerBonuses, getTotems } from './worship';
import { getSneaking } from '@parsers/world-6/sneaking';
import { getFarming, updateFarming } from '@parsers/world-6/farming';
import { getSummoning } from '@parsers/world-6/summoning';
import { getTome } from '@parsers/world-4/tome';
import { getOwl } from '@parsers/world-1/owl';
import { getKangaroo } from '@parsers/world-2/kangaroo';
import { getVoteBallot } from '@parsers/world-2/voteBallot';
import { getHole } from '@parsers/world-5/hole';
import { getGrimoire } from '@parsers/grimoire';
import { getUpgradeVault } from '@parsers/misc/upgradeVault';
import { getCompass } from '@parsers/compass';
import { getEmperor } from '@parsers/world-6/emperor';
import { getArmorSmithy } from '@parsers/misc/armorSmithy';
import { getTesseract } from '@parsers/tesseract';
import { getSpelunking } from '@parsers/world-7/spelunking';
import { getGallery } from '@parsers/world-7/gallery';
import { getCoralReef } from '@parsers/world-7/coralReef';
import { getClamWork } from '@parsers/world-7/clamWork';
import { getResearch } from '@parsers/world-7/research';
import { getMinehead } from '@parsers/world-7/minehead';
import { getTournament } from '@parsers/world-7/tournament';
import { getAdviceFish } from '@parsers/misc';
import { getBubba } from '@parsers/clickers/bubba';
import { getHatRack } from '@parsers/world-3/hatRack';
import { getFriendBonusStats } from '@parsers/misc';

export const parseData = (idleonData, charNames, companion, guildData, serverVars, accountCreateTime, tournament) => {
  try {
    const staticData = getStaticData(idleonData, charNames, companion, guildData, serverVars, accountCreateTime, tournament);

    // Multiple passes needed to resolve cross-dependencies between parsers
    let processedData = null;
    for (let pass = 0; pass < 3; pass++) {
      processedData = serializeData(idleonData, serverVars, staticData, processedData);
    }

    const { accountData, charactersData } = processedData;
    return { account: accountData, characters: charactersData };
  } catch (err) {
    console.error('Error while parsing data', err);
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'error', {
        event_category: 'error',
        event_label: 'parse',
        value: 1
      });
    }
  }
};

/**
 * Pure/static parsers — only depend on raw input data, never on accountData.
 * Computed once and reused across all passes.
 */
const getStaticData = (idleonData, charNames, companion, guildData, serverVars, accountCreateTime, tournament) => {
  const serializedCharactersData = getCharacters(idleonData, charNames);
  const charactersLevels = serializedCharactersData?.map((char) => {
    const personalValuesMap = char?.[`PersonalValuesMap`];
    return { level: personalValuesMap?.StatList?.[4] ?? 0, class: classes?.[char?.[`CharacterClass`]] ?? '' };
  });
  const { tasks, tasksDescriptions, meritsDescriptions, unlockedRecipes, taskUnlocks } = getTasks(idleonData);
  const { constellations, rawConstellationsDone } = getConstellations(idleonData);

  return {
    serializedCharactersData,
    charactersLevels,
    accountCreateTime,
    companions: getCompanions(companion),
    bundles: getBundles(idleonData),
    serverVars,
    accountOptions: tryToParse(idleonData?.OptLacc),
    gemShopPurchases: getGemShop(idleonData),
    bribes: getBribes(idleonData),
    timeAway: tryToParse(idleonData?.TimeAway),
    obols: getObols(idleonData),
    looty: getSlab(idleonData),
    tasks,
    tasksDescriptions,
    meritsDescriptions,
    unlockedRecipes,
    taskUnlocks,
    postOfficeShipments: getPostOfficeShipments(idleonData),
    towers: getTowers(idleonData),
    achievements: getAchievements(idleonData),
    rift: getRift(idleonData),
    weeklyBossesRaw: tryToParse(idleonData?.WeeklyBoss),
    constellations,
    rawConstellationsDone,
    shopStock: getShops(idleonData),
    traps: getTraps(serializedCharactersData),
    totems: getTotems(idleonData),
    adviceFish: getAdviceFish(idleonData),
    guild: getGuild(idleonData, guildData),
    talentPoints: idleonData?.CYTalentPoints,
    tournamentServerData: tournament ?? null,
  };
};

const serializeData = (idleonData, serverVars, staticData, processedData) => {
  const { serializedCharactersData, ...staticAccountFields } = staticData;
  const charactersLevels = staticData.charactersLevels;

  // --- Start from previous pass (or empty) and overlay static fields immutably ---
  const accountData = {
    ...(processedData?.accountData || {}),
    ...staticAccountFields
  };
  let charactersData = processedData?.charactersData || [];

  // --- Dynamic parsers (depend on accountData / processedData) ---
  accountData.alchemy = getAlchemy(idleonData, serializedCharactersData, accountData);
  accountData.armorSmithy = getArmorSmithy(idleonData, serverVars, accountData);
  accountData.equippedBubbles = getEquippedBubbles(idleonData, accountData.alchemy?.bubbles, serializedCharactersData);
  accountData.storage = getStorage(idleonData, 'storage', accountData);
  accountData.saltLick = getSaltLick(idleonData, accountData.storage?.list);
  accountData.dungeons = getDungeons(idleonData, accountData.accountOptions);
  accountData.prayers = getPrayers(idleonData, accountData.storage?.list);
  accountData.cards = getCards(idleonData, accountData);
  accountData.currencies = getCurrencies(accountData, idleonData, processedData);
  accountData.stamps = getStamps(idleonData, accountData);
  accountData.breeding = getBreeding(idleonData, accountData, processedData);
  accountData.cooking = getCooking(idleonData, accountData);
  accountData.divinity = getDivinity(idleonData, serializedCharactersData, accountData);
  accountData.sneaking = getSneaking(idleonData, serverVars, charactersData, accountData);
  accountData.farming = getFarming(idleonData, accountData, processedData?.charactersData);
  accountData.summoning = getSummoning(idleonData, accountData, serializedCharactersData);
  accountData.statues = applyStatuesMulti(accountData, charactersData);
  accountData.hole = getHole(idleonData, accountData);
  accountData.lab = getLab(idleonData, serializedCharactersData, accountData);
  accountData.shrines = getShrines(idleonData, accountData);
  const { statues, zenith } = getStatues(idleonData, serializedCharactersData, accountData);
  accountData.statues = statues;
  accountData.zenith = zenith;

  accountData.lab.connectedPlayers = accountData.lab.connectedPlayers?.map((char) => ({
    ...char,
    isDivinityConnected: accountData?.divinity?.linkedDeities?.[char?.playerId] === 4 || isLabEnabledBySorcererRaw(char, 4)
  }))

  accountData.arcade = getArcade(idleonData, accountData, serverVars);

  // Update values for meals, stamps, vials
  const certifiedStampBookMulti = getLabBonus(accountData.lab.labBonuses, 7);
  accountData.stamps = applyStampsMulti(accountData.stamps, certifiedStampBookMulti);
  accountData.alchemy.vials = updateVials(accountData);
  accountData.equinox = getEquinox(idleonData, accountData);
  const spelunkerObolMulti = getLabBonus(accountData.lab.labBonuses, 8);
  const blackDiamondRhinestone = getJewelBonus(accountData.lab.jewels, 16, spelunkerObolMulti);

  accountData.cooking.meals = applyMealsMulti(accountData.cooking.meals, blackDiamondRhinestone);

  accountData.starSigns = getStarSigns(idleonData, accountData);

  charactersData = serializedCharactersData.map((char) => {
    return initializeCharacter(char, charactersLevels, { ...accountData }, idleonData);
  });
  accountData.grimoire = getGrimoire(idleonData, charactersData, accountData);
  accountData.compass = getCompass(idleonData, charactersData, accountData, serverVars);
  accountData.tesseract = getTesseract(idleonData, charactersData, accountData, serverVars);
  accountData.farming = updateFarming(charactersData, accountData);
  accountData.lab = getLab(idleonData, serializedCharactersData, accountData, charactersData);
  accountData.alchemy.vials = updateVials(accountData);
  let currentWorld = 0;
  accountData.finishedWorlds = [1, 2, 3, 4, 5, 6, 7]?.reduce((res, world) => {
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
  const skills = charactersData?.map(({ name, skillsInfo }) => ({ name, skillsInfo }));
  accountData.totalSkillsLevels = calculateTotalSkillsLevel(skills);
  accountData.construction = getConstruction(idleonData, accountData);
  accountData.atoms = getAtoms(idleonData, accountData);
  const artifacts = getArtifacts(idleonData, charactersData, accountData)
  accountData.alchemy.p2w.sigils = applyArtifactBonusOnSigil(accountData.alchemy.p2w.sigils, artifacts);
  accountData.alchemy.liquidCauldrons = getLiquidCauldrons(accountData);
  accountData.spelunking = getSpelunking(idleonData, accountData, charactersData);
  accountData.hatRack = getHatRack(idleonData, accountData);
  accountData.gaming = getGaming(idleonData, charactersData, accountData, serverVars);
  // reapply atoms
  accountData.atoms = getAtoms(idleonData, accountData);
  accountData.sailing = getSailing(idleonData, artifacts, charactersData, accountData, serverVars, charactersLevels);

  const leaderboard = calculateLeaderboard(skills);
  charactersData = charactersData.map((character) => ({ ...character, skillsInfo: leaderboard[character?.name] }));

  accountData.accountLevel = charactersData?.reduce((sum, { level }) => sum + level, 0);
  accountData.highscores = getHighscores(idleonData, accountData);

  accountData.forge = getForge(idleonData, accountData);
  accountData.refinery = getRefinery(idleonData, accountData.storage?.list, accountData.tasks);
  accountData.printer = getPrinter(idleonData, charactersData, accountData);
  accountData.quests = getQuests(charactersData);
  accountData.islands = getIslands(accountData, charactersData);
  accountData.deathNote = getDeathNote(idleonData, charactersData, accountData);
  accountData.topKilledMonsters = getTopKilledMonsters(charactersData);
  accountData.killroy = getKillRoy(idleonData, charactersData, accountData, serverVars);
  accountData.anvil = charactersData.map(({ anvil }) => anvil);

  const bankMoney = parseFloat(idleonData?.MoneyBANK);
  const playersMoney = charactersData?.reduce((res, char) => {
    return res + parseFloat(char?.money ? char?.money : 0)
  }, 0);
  const money = bankMoney + playersMoney;
  accountData.currencies.rawMoney = money;
  accountData.currencies.money = getCoinsArray(money);
  accountData.currencies.gems = idleonData?.GemsOwned;
  accountData.currencies.KeysAll = enhanceKeysObject(accountData?.currencies?.KeysAll, charactersData, accountData);
  accountData.currencies.ColosseumTickets = enhanceColoTickets(accountData?.currencies?.ColosseumTickets, charactersData, accountData);
  accountData.currencies.penPals = accountData.accountOptions?.[99] ?? 0
  accountData.cooking.kitchens = getKitchens(idleonData, charactersData, accountData);
  accountData.libraryTimes = getLibraryBookTimes(idleonData, charactersData, accountData);
  accountData.breeding = addBreedingChance(idleonData, accountData);
  if (accountData.divinity) {
    accountData.divinity.deities = applyGodCost(accountData);
  }
  charactersData = charactersData?.map((character) => {
    const { carryCapBags } = character;
    character.carryCapBags = carryCapBags?.map((carryBag) => {
      const typeGen = getTypeGen(carryBag?.Class);
      const capacity = getItemCapacity(typeGen, character, accountData);
      return {
        ...carryBag,
        capacityPerSlot: capacity?.value,
        breakdown: capacity?.breakdown,
        maxCapacity: capacity?.value * character?.inventorySlots
      }
    })
    character.constructionSpeed = getPlayerConstructionSpeed(character, accountData);
    character.constructionExpPerHour = getPlayerConstructionExpPerHour(character, accountData);
    return character;
  })
  accountData.stamps = updateStamps(accountData, charactersData);
  accountData.shrinesExpBonus = getShrineExpBonus(charactersData, accountData);
  accountData.msaTotalizer = getTotalizerBonuses(accountData);
  accountData.tome = getTome(idleonData, accountData, charactersData, serverVars);
  accountData.owl = getOwl(idleonData, accountData);
  accountData.kangaroo = getKangaroo(idleonData, accountData);
  accountData.voteBallot = getVoteBallot(idleonData, accountData);
  accountData.upgradeVault = getUpgradeVault(idleonData, accountData, charactersData);
  accountData.emperor = getEmperor(idleonData, accountData);
  accountData.legendTalents = getLegendTalents(idleonData, accountData, charactersData);
  accountData.gallery = getGallery(idleonData, accountData);
  accountData.coralReef = getCoralReef(idleonData, accountData, charactersData);
  accountData.clamWork = getClamWork(idleonData, accountData);
  accountData.minehead = getMinehead(idleonData, accountData, serverVars);
  accountData.tournament = getTournament(idleonData, accountData, staticData.tournamentServerData);
  accountData.research = getResearch(idleonData, accountData, charactersData);
  accountData.bubba = getBubba(idleonData, accountData);
  accountData.friendBonusStats = getFriendBonusStats(accountData);

  return { accountData, charactersData };
};

