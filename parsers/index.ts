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
import { getCoinsArray, tryToParse } from '../utility/helpers';
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
  getLooty,
  getTypeGen
} from './misc';
import { getSaltLick } from './saltLick';
import { getDungeons } from './dungeons';
import { applyMealsMulti, getCooking, getKitchens } from './cooking';
import { applyBonusDesc, getJewelBonus, getLab, getLabBonus, isLabEnabledBySorcererRaw } from './lab';
import { classes } from '../data/website-data';
import { getGuild } from './guild';
import { getPrinter } from './printer';
import { getTraps } from './traps';
import { getQuests, isWorldFinished } from './quests';
import { getDeathNote } from './deathNote';
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
import { getSneaking } from "@parsers/world-6/sneaking";
import { getFarming, updateFarming } from "@parsers/world-6/farming";
import { getSummoning } from "@parsers/world-6/summoning";
import { getTome } from "@parsers/world-4/tome";
import { getOwl } from "@parsers/world-1/owl";
import { getKangaroo } from "@parsers/world-2/kangaroo";
import { getVoteBallot } from "@parsers/world-2/voteBallot";

export const parseData = (idleonData: IdleonData, charNames: string[], companion: Record<string, any>, guildData: Record<string, any>, serverVars: Record<string, any>, accountCreateTime: number) => {
  let accountData, charactersData;

  try {
    console.info('%cStart Parsing', 'color:orange');
    const processedData = serializeData(idleonData, charNames, companion, guildData, serverVars, accountCreateTime);
    const parsed = serializeData(idleonData, charNames, companion, guildData, serverVars, accountCreateTime, processedData);
    accountData = parsed?.accountData;
    charactersData = parsed?.charactersData;
    console.info('data', { account: accountData, characters: charactersData })
    console.info('%cParsed successfully', 'color: green');
    return { account: accountData, characters: charactersData };
  } catch (err) {
    console.error('Error while parsing data', err);
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'error', {
        event_category: 'error',
        event_label: 'engagement',
        value: JSON.stringify(err)
      })
    }
  }
};

const serializeData = (idleonData: IdleonData, charNames: string[], companion: Record<string, any>, guildData: Record<string, any>, serverVars: Record<string, any>, accountCreateTime: number, processedData?: any) => {
  const accountData: Account = processedData?.accountData || {};
  let charactersData: Character[] = processedData?.charactersData || [];
  const serializedCharactersData = getCharacters(idleonData, charNames);
  accountData.accountCreateTime = accountCreateTime;
  accountData.companions = getCompanions(companion);
  accountData.bundles = getBundles(idleonData);
  accountData.serverVars = serverVars;
  accountData.accountOptions = idleonData?.OptionsListAccount || tryToParse(idleonData?.OptLacc); //
  accountData.bribes = getBribes(idleonData);
  accountData.timeAway = tryToParse(idleonData?.TimeAway) || idleonData?.TimeAway;
  accountData.alchemy = getAlchemy(idleonData, accountData, serializedCharactersData);
  accountData.equippedBubbles = getEquippedBubbles(idleonData, accountData.alchemy?.bubbles, serializedCharactersData);
  accountData.storage = getStorage(idleonData); // changed from inventory
  accountData.saltLick = getSaltLick(idleonData, accountData.storage);
  accountData.dungeons = getDungeons(idleonData, accountData.accountOptions);
  accountData.prayers = getPrayers(idleonData, accountData.storage);
  accountData.cards = getCards(idleonData, accountData);
  accountData.gemShopPurchases = getGemShop(idleonData);
  accountData.guild = getGuild(idleonData, guildData);
  accountData.currencies = getCurrencies(accountData, idleonData);
  accountData.stamps = getStamps(idleonData, accountData);
  accountData.obols = getObols(idleonData);
  accountData.looty = getLooty(idleonData);
  const { tasks, tasksDescriptions, meritsDescriptions } = getTasks(idleonData)
  accountData.tasks = tasks; //
  accountData.tasksDescriptions = tasksDescriptions; //
  accountData.meritsDescriptions = meritsDescriptions; //
  accountData.breeding = getBreeding(idleonData, accountData);
  accountData.cooking = getCooking(idleonData, accountData);
  accountData.divinity = getDivinity(idleonData, serializedCharactersData, accountData);
  accountData.postOfficeShipments = getPostOfficeShipments(idleonData);
  accountData.sneaking = getSneaking(idleonData, serverVars, serializedCharactersData, accountData);
  accountData.farming = getFarming(idleonData, accountData);
  accountData.summoning = getSummoning(idleonData, accountData, serializedCharactersData);
  // lab dependencies: cooking, cards, gemShopPurchases, tasks, accountOptions, breeding, deathNote, storage
  accountData.lab = getLab(idleonData, serializedCharactersData, accountData);
  accountData.towers = getTowers(idleonData);
  accountData.shrines = getShrines(idleonData, accountData);
  accountData.statues = getStatues(idleonData, serializedCharactersData);
  accountData.achievements = getAchievements(idleonData);

  accountData.lab.connectedPlayers = accountData.lab.connectedPlayers?.map((char: Character) => ({
    ...char,
    isDivinityConnected: accountData?.divinity?.linkedDeities?.[char?.playerId] === 4 || isLabEnabledBySorcererRaw(char, 4)
  }))

  accountData.rift = getRift(idleonData);
  accountData.arcade = getArcade(idleonData, accountData, serverVars);

  // Update values for meals, stamps, vials
  const certifiedStampBookMulti = getLabBonus(accountData.lab.labBonuses, 7); // stamp multi
  accountData.stamps = applyStampsMulti(accountData.stamps, certifiedStampBookMulti);
  accountData.alchemy.vials = updateVials(accountData);
  accountData.equinox = getEquinox(idleonData, accountData);
  const spelunkerObolMulti = getLabBonus(accountData.lab.labBonuses, 8); // gem multi
  const blackDiamondRhinestone = getJewelBonus(accountData.lab.jewels, 16, spelunkerObolMulti);

  accountData.cooking.meals = applyMealsMulti(accountData.cooking.meals, blackDiamondRhinestone);

  const charactersLevels = serializedCharactersData?.map((char: Character) => {
    const personalValuesMap = char?.[`PersonalValuesMap`];
    return { level: personalValuesMap?.StatList?.[4] ?? 0, class: classes?.[char?.[`CharacterClass`]] ?? '' };
  });
  accountData.starSigns = getStarSigns(idleonData);
  const { constellations, rawConstellationsDone } = getConstellations(idleonData)
  accountData.constellations = constellations;
  accountData.rawConstellationsDone = rawConstellationsDone;
  accountData.charactersLevels = charactersLevels;

  charactersData = serializedCharactersData.map((char: Character) => {
    return initializeCharacter(char, charactersLevels, { ...accountData }, idleonData);
  });
  accountData.farming = updateFarming(charactersData, accountData);
  accountData.lab = getLab(idleonData, serializedCharactersData, accountData, charactersData);
  accountData.alchemy.vials = updateVials(accountData);
  accountData.finishedWorlds = [1, 2, 3, 4, 5, 6]?.reduce((res, world) => {
    return {
      ...res,
      [`World${world}`]: !!isWorldFinished(charactersData, world)
    }
  }, {});
  accountData.statues = applyStatuesMulti(accountData, charactersData);
  const skills = charactersData?.map(({ name, skillsInfo }) => ({ name, skillsInfo }));
  accountData.totalSkillsLevels = calculateTotalSkillsLevel(skills);
  accountData.construction = getConstruction(idleonData, accountData);
  accountData.atoms = getAtoms(idleonData, accountData);
  const artifacts = getArtifacts(idleonData, charactersData, accountData)
  accountData.alchemy.p2w.sigils = applyArtifactBonusOnSigil(accountData.alchemy.p2w.sigils, artifacts);
  accountData.alchemy.liquidCauldrons = getLiquidCauldrons(accountData);
  accountData.gaming = getGaming(idleonData, charactersData, accountData, serverVars);
  // reapply atoms
  accountData.atoms = getAtoms(idleonData, accountData);
  accountData.sailing = getSailing(idleonData, artifacts, charactersData, accountData, serverVars, charactersLevels);

  const leaderboard: any = calculateLeaderboard(skills);
  charactersData = charactersData.map((character) => ({ ...character, skillsInfo: leaderboard[character?.name] }));

  accountData.accountLevel = charactersData?.reduce((sum, { level }) => sum + level, 0);
  accountData.highscores = getHighscores(idleonData, accountData);
  accountData.shopStock = getShops(idleonData);

  accountData.forge = getForge(idleonData, accountData);
  accountData.refinery = getRefinery(idleonData, accountData.storage, accountData.tasks);
  accountData.printer = getPrinter(idleonData, charactersData, accountData);
  accountData.traps = getTraps(serializedCharactersData);
  accountData.quests = getQuests(charactersData);
  accountData.islands = getIslands(accountData);
  accountData.deathNote = getDeathNote(idleonData, charactersData, accountData);
  accountData.killroy = getKillRoy(idleonData, charactersData, accountData, serverVars);
  // reduce anvil
  accountData.anvil = charactersData.map(({ anvil }) => anvil);

  const bankMoney = parseFloat(idleonData?.MoneyBANK);
  const playersMoney = charactersData?.reduce((res, char) => {
    return res + parseFloat(char?.money ? char?.money : 0)
  }, 0);
  const money = bankMoney + playersMoney;
  accountData.talentPoints = idleonData?.CYTalentPoints;
  accountData.currencies.rawMoney = money;
  accountData.currencies.money = getCoinsArray(money);
  accountData.currencies.gems = idleonData?.GemsOwned;
  accountData.currencies.KeysAll = enhanceKeysObject(accountData?.currencies?.KeysAll, charactersData, accountData);
  accountData.currencies.ColosseumTickets = enhanceColoTickets(accountData?.currencies?.ColosseumTickets, charactersData, accountData);
  accountData.currencies.penPals = accountData.accountOptions?.[99] ?? 0
  // kitchens
  accountData.cooking.kitchens = getKitchens(idleonData, charactersData, accountData);
  accountData.libraryTimes = getLibraryBookTimes(idleonData, charactersData, accountData);
  accountData.breeding = addBreedingChance(idleonData, accountData);
  if (accountData.divinity) {
    accountData.divinity.deities = applyGodCost(accountData);
  }
  charactersData = charactersData?.map((character) => {
    const { carryCapBags } = character;
    character.carryCapBags = carryCapBags?.map((carryBag: any) => {
      const typeGen = getTypeGen(carryBag?.Class);
      const capacity: ValueAndBreakdown = getItemCapacity(typeGen, character, accountData);
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
  // update lab bonuses
  const greenMushroomKilled = Math.floor(accountData?.deathNote?.[0]?.mobs?.[0].kills / 1e6);
  const fungyFingerBonusFromJewel = accountData.lab.labBonuses?.[13]?.active ? greenMushroomKilled * 1.5 : 0;
  const fungyFingerBonus = greenMushroomKilled * accountData.lab.labBonuses?.[9]?.bonusOn;
  accountData.lab.labBonuses = applyBonusDesc(accountData.lab.labBonuses, fungyFingerBonus + fungyFingerBonusFromJewel, 9);
  accountData.totems = getTotems(idleonData);
  accountData.tome = getTome(idleonData, accountData, charactersData, serverVars);
  accountData.owl = getOwl(idleonData, accountData);
  accountData.kangaroo = getKangaroo(idleonData, accountData);
  accountData.voteBallot = getVoteBallot(idleonData, accountData);
  return { accountData, charactersData };
};
