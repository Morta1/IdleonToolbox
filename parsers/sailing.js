import { kFormatter, lavaLog, notateNumber, tryToParse } from '@utility/helpers';
import { artifacts, captainsBonuses, classFamilyBonuses, islands } from '../data/website-data';
import {
  getHighestCharacterSkill,
  getHighestLevelCharacter,
  getHighestLevelOfClass,
  isMasteryBonusUnlocked
} from './misc';
import { CLASSES, getHighestTalentByClass, mainStatMap } from './talents';
import { getBubbleBonus, getSigilBonus, getVialsBonusByStat } from './alchemy';
import { getCardBonusByEffect } from './cards';
import { getStampsBonusByEffect } from './stamps';
import { getMealsBonusByEffectOrStat } from './cooking';
import { getGodBlessingBonus, getMinorDivinityBonus } from './divinity';
import { getStatueBonus } from './statues';
import { getLabBonus } from './lab';
import { getShinyBonus } from './breeding';
import { getFamilyBonusBonus } from './family';
import LavaRand from '../utility/lavaRand';
import { getAchievementStatus } from './achievements';
import { getVoteBonus } from '@parsers/world-2/voteBallot';
import { isPast } from 'date-fns';

export const getSailing = (idleonData, artifactsList, charactersData, account, serverVars, charactersLevels) => {
  const sailingRaw = tryToParse(idleonData?.Sailing) || idleonData?.Sailing;
  const captainsRaw = tryToParse(idleonData?.Captains) || idleonData?.Captains;
  const boatsRaw = tryToParse(idleonData?.Boats) || idleonData?.Boats;
  const chestsRaw = tryToParse(idleonData?.SailChests) || idleonData?.SailChests;
  if (!sailingRaw || !captainsRaw || !boatsRaw || !chestsRaw) return null;
  return parseSailing(artifactsList, sailingRaw, captainsRaw, boatsRaw, chestsRaw, charactersData, account, serverVars, charactersLevels);
}

const parseSailing = (artifactsList, sailingRaw, captainsRaw, boatsRaw, chestsRaw, charactersData, account, serverVars, charactersLevels) => {
  const lootPile = sailingRaw?.[1];
  const dreamCatcherBonus = isArtifactAcquired(artifactsList, 'Dreamcatcher')?.bonus ?? 0;
  const chestsFromGems = account?.gemShopPurchases?.find((value, index) => index === 129);
  const chestsFromAchievements = getAchievementStatus(account?.achievements, 287) + getAchievementStatus(account?.achievements, 290);
  const maxChests = Math.min(Math.round(5 + chestsFromGems
    + (Math.min(4, dreamCatcherBonus)
      + (account?.tasks?.[2]?.[4]?.[2])
      + (chestsFromAchievements))), 30);
  const chests = getChests(chestsRaw, artifactsList, serverVars);
  const rareTreasureChance = getRareTreasureChance();
  const lootPileList = getLootPile(lootPile);
  const captainsAndBoats = getCaptainsAndBoats(sailingRaw, captainsRaw, boatsRaw, account, charactersData, charactersLevels, artifactsList, lootPileList);
  const boatsRoundtrips = captainsAndBoats?.boats?.map(({ maxTime }) => maxTime);
  const timeToFullChests = calculateMaxCapacityTime(boatsRoundtrips, maxChests - (chests?.length || 0));
  const trades = getFutureTrades(captainsAndBoats, sailingRaw?.[0], lootPileList, artifactsList, account);

  return {
    maxChests,
    artifacts: artifactsList,
    lootPile: lootPileList,
    chests,
    rareTreasureChance,
    trades,
    timeToFullChests,
    ...captainsAndBoats
  };
}

const calculateMaxCapacityTime = (roundtripTimes, maxCapacity) => {
  const minTime = Math.min(...roundtripTimes);
  const acquisitionRate = maxCapacity / minTime;
  let accumulatedTime = 0;
  let chestCount = 0;

  for (const boatTime of roundtripTimes) {
    accumulatedTime += boatTime;
    chestCount += acquisitionRate * (accumulatedTime - boatTime);
    if (chestCount >= maxCapacity) {
      break;
    }
  }

  return accumulatedTime;
}

const getFutureTrades = ({ boats } = {}, islands, lootPileList, artifactsList, account) => {
  const firstBoatLootValue = boats?.[0]?.loot?.value ?? 0;
  const emeraldRelic = isArtifactAcquired(artifactsList, 'Emerald_Relic');
  const unlockedIslands = islands?.reduce((sum, island) => island === -1 ? sum + 1 : sum, 0);
  const seed = Math.floor(account?.timeAway?.GlobalTime / 21600);
  const trades = [];
  for (let i = 0; i < 40; i++) {
    const rng = new LavaRand(seed + i);
    const random = rng.rand();
    const lootIndex = Math.min(30, Math.ceil(2 * random * unlockedIslands));
    const lootItemCost = getLootItemCost(lootPileList?.[lootIndex], firstBoatLootValue);
    const closest = new Date(Math.floor((seed + i) * 21600 * 1000));
    if (!isPast(closest)) {
      trades.push({
        ...lootPileList?.[lootIndex],
        date: closest,
        moneyValue: getMoneyValue(lootItemCost, lootIndex, emeraldRelic),
        lootItemCost
      });
    }
  }
  return trades;
}

const getLootItemCost = (loot, firstBoatLootValue) => {
  return Math.max(.2 * loot?.amount, firstBoatLootValue)
}
const getMoneyValue = (lootItemCost, lootIndex, emeraldRelic) => {
  const multi = (emeraldRelic?.acquired) ?? 0;
  return lootItemCost * (1.5 * Math.pow(1.6, Math.floor(lootIndex / 2))
    * (1 + (((lootIndex + 1) % 2) * 150 + (30 * Math.floor(multi / 2) + 30
      * Math.floor(multi / 3))) / 100))
}

export const getArtifacts = (idleonData, charactersData, account) => {
  const sailingRaw = tryToParse(idleonData?.Sailing) || idleonData?.Sailing;
  const acquiredArtifacts = sailingRaw?.[3];
  const lootPile = sailingRaw?.[1];
  return artifacts?.map((artifact, index) => getArtifact(artifact,
    acquiredArtifacts?.[index], lootPile, index, charactersData, account));
}

const getChests = (chestsRaw, artifactsList, serverVars) => {
  return chestsRaw?.map((chest) => ({
    ...getArtifactChance(chest, artifactsList, serverVars),
    rawName: `SailChest${chest?.[3]}`
  }))
}

const getArtifactChance = (chest, artifactsList, serverVars) => {
  const [treasure, islandIndex, chance] = chest;
  const island = islands?.[islandIndex];
  let artifactsStartIndex = 0;
  for (let i = 0; i < islandIndex; i++) {
    const island = islands?.[i];
    artifactsStartIndex += island?.numberOfArtifacts;
  }
  let startingIndex = 1, baseMath = 0;
  for (let i = 0; i < island?.numberOfArtifacts; i++) {
    const artifact = artifactsList[artifactsStartIndex + i];
    if (!artifact) {
      baseMath = startingIndex * (1 - chance / artifact?.baseFindChance);
    }
    else {
      if (artifact?.acquired === 1) {
        baseMath = startingIndex * (1 - chance / getAncientChances(islandIndex, serverVars));
        startingIndex = baseMath;
      }
      if (artifact?.acquired === 2) {
        baseMath = startingIndex * (1 - chance / getEldritchChances(islandIndex, serverVars));
        startingIndex = baseMath;
      }
    }
  }
  if (baseMath === 0) {
    return { done: true, island, islandIndex, treasure };
  }
  const artifactChance = 100 * Math.min(1, 1 - (baseMath));
  const possibleArtifacts = artifactsList?.slice(artifactsStartIndex, artifactsStartIndex + island?.numberOfArtifacts)
    .filter(({ acquired }) => acquired < 3);

  return {
    artifactChance: artifactChance > 0.01 ? Math.round(100 * artifactChance) / 100 : 0.01,
    ancientChance: (chance / getAncientChances(islandIndex, serverVars)).toFixed(5),
    eldritchChance: (chance / getEldritchChances(islandIndex, serverVars)).toFixed(5),
    sovereignChance: (chance / getSovereignChances(islandIndex, serverVars)).toFixed(5),
    island,
    islandIndex,
    treasure,
    possibleArtifacts
  };
}

const getAncientChances = (islandsUnlocked, serverVars) => {
  return 3 > islandsUnlocked
    ? 850
    : (1e3 + (islandsUnlocked - 3) * serverVars?.AncientOddPerIsland) / (1 + serverVars?.AncientArtiPCT / 100);
}

const getEldritchChances = (islandsUnlocked, serverVars) => {
  return 3 > islandsUnlocked
    ? 900 + 250 * islandsUnlocked
    : ((1e3 + (islandsUnlocked - 3) * serverVars?.AncientOddPerIsland) / (1 + serverVars?.AncientArtiPCT / 100)) * 4;
}

const getSovereignChances = (islandsUnlocked, serverVars) => {
  return 5 > islandsUnlocked
    ? 9e3 + 2e3 * islandsUnlocked
    : ((1e3 + 1.25 * (islandsUnlocked - 3) * serverVars?.AncientOddPerIsland) / (1 + serverVars?.AncientArtiPCT / 100)) * 180;
}

export const isArtifactAcquired = (artifacts = [], artifactName) => {
  return artifacts?.find(({ name, acquired }) => name === artifactName && acquired);
}

const getRareTreasureChance = () => {
  return Math.min(0.05, 0.1);
}

const getCaptainsAndBoats = (sailingRaw, captainsRaw, boatsRaw, account, characters, charactersLevels, artifactsList, lootPileList) => {
  const captainsUnlocked = sailingRaw?.[2]?.[0] || 0;
  const boatsUnlocked = sailingRaw?.[2]?.[1] || 0;
  const highestLevelSiegeBreaker = getHighestLevelOfClass(charactersLevels, CLASSES.Siege_Breaker) ?? 0;
  const theFamilyGuy = getHighestTalentByClass(characters, CLASSES.Siege_Breaker, 'THE_FAMILY_GUY') ?? 0;
  const familyBonus = getFamilyBonusBonus(classFamilyBonuses, 'FASTER_MINIMUM_BOAT_TRAVEL_TIME', highestLevelSiegeBreaker);
  const shinyBonus = getShinyBonus(account?.breeding?.pets, 'Lower_Minimum_Travel_Time_for_Sailing');
  const amplifiedFamilyBonus = familyBonus * (1 + theFamilyGuy / 100);
  const minimumTravelTime = Math.round(120 / (1 + (amplifiedFamilyBonus + shinyBonus) / 100));
  const baseSpeed = getBaseSpeed(account, characters, artifactsList);
  let shopCaptains = captainsRaw?.slice(30, 34);
  shopCaptains = shopCaptains.map((captain, index) => getCaptain(captain, index, true))
  const allCaptains = captainsRaw?.slice(0, captainsUnlocked + 1);
  const captains = allCaptains?.map((captain, index) => getCaptain(captain, index))
  const allBoats = boatsRaw?.slice(0, boatsUnlocked + 1);
  const boats = allBoats?.map((boat, index) => getBoat(boat, index, lootPileList, captains, artifactsList, characters, account, baseSpeed, minimumTravelTime));
  const captainsOnBoats = boats?.reduce((res, { captainMappedIndex }, index) => ({
    ...res,
    [captainMappedIndex]: index
  }), {});
  return {
    captains,
    boats,
    shopCaptains,
    captainsOnBoats,
    minimumTravelTime,
    minimumTravelTimeBreakdown: [
      { name: 'Base', value: 120 },
      { name: 'Family Bonus', value: familyBonus },
      { name: 'The Family Guy', value: theFamilyGuy },
      { name: 'Shiny Bonus', value: shinyBonus }
    ]
  }
}

const getBoat = (boat, boatIndex, lootPile, captains, artifactsList, characters, account, baseSpeed, minimumTravelTime = 120) => {
  const [captainIndex, islandIndex, , lootLevel, distanceTraveled, speedLevel] = boat;
  const captain = captains?.[captainIndex];
  const island = islands?.[islandIndex];
  const boatObj = {
    rawName: `Boat_Frame_${getBoatFrame(lootLevel + speedLevel)}`,
    level: lootLevel + speedLevel,
    artifactChance: getBoatArtifactChance(artifactsList, captains[captainIndex], account),
    captainIndex,
    captainMappedIndex: captain?.captainIndex,
    lootLevel, speedLevel,
    boatIndex,
    island,
    islandIndex,
    distanceTraveled
  }

  boatObj.resources = getBoatResources(boatObj, lootPile);
  boatObj.breakpointResources = getBoatBreakdownResources(boatObj, lootPile);
  boatObj.loot = getBoatLootValue(characters, account, artifactsList, boatObj, captain);
  boatObj.speed = getBoatSpeedValue(captain, island, speedLevel, baseSpeed, minimumTravelTime)
  boatObj.maxTime = ((island?.distance) / boatObj.speed?.value) * 3600 * 1000;
  boatObj.timeLeft = ((island?.distance - distanceTraveled) / boatObj.speed?.value) * 3600 * 1000;
  return boatObj
}

const getBaseSpeed = (account, characters, artifactsList) => {
  const purrmepPlayer = characters?.find(({ linkedDeity }) => linkedDeity === 6); // purrmep is limited to only 1 player linked.
  const divinityMinorBonus = getMinorDivinityBonus(purrmepPlayer, account, 6, characters);
  const cardBonus = getCardBonusByEffect(account?.cards, 'Sailing_Speed_(Passive)');
  const stampBonus = getStampsBonusByEffect(account, 'Sailing_Speed')
  const mealBonus = getMealsBonusByEffectOrStat(account, null, 'Sailing');
  const bubbleBonus = getBubbleBonus(account, 'BOATY_BUBBLE', false)
  const goharutGodBonus = getGodBlessingBonus(account?.divinity?.deities, 'Goharut');
  const bagurGodBonus = getGodBlessingBonus(account?.divinity?.deities, 'Bagur');
  const purrmepGodBonus = getGodBlessingBonus(account?.divinity?.deities, 'Purrmep');
  const artifactBonus = isArtifactAcquired(artifactsList, '10_AD_Tablet')?.bonus ?? 0;
  const vialBonus = getVialsBonusByStat(account?.alchemy?.vials, 'SailSpd');
  const skillMasteryBonus = isMasteryBonusUnlocked(account?.rift, account?.totalSkillsLevels?.sailing?.rank, 1);
  const statueBonus = getStatueBonus(account, 24)
  const voteBonus = getVoteBonus(account, 24);
  const msaBonus = account?.msaTotalizer?.sailing?.value ?? 0;

  return (1 + (divinityMinorBonus
      + (cardBonus
        + bubbleBonus)) / 125)
    * (1 + goharutGodBonus / 100)
    * (1 + purrmepGodBonus / 100)
    * (1 + voteBonus / 100)
    * (1 + (bagurGodBonus
      + (artifactBonus
        + (stampBonus
          + (statueBonus
            + (mealBonus
              + (vialBonus
                + (17 * skillMasteryBonus
                  + (msaBonus)))))))) / 125);
}

const getCaptain = (captain, index, isShop) => {
  const captainIndex = String.fromCharCode(65 + index);
  const [captainType, firstBonusIndex, secondBonusIndex, level, exp, firstBonusValue, secondBonusValue] = captain;
  const captainObj = {
    captainIndex,
    captainType,
    level: level,
    firstBonusIndex,
    secondBonusIndex,
    firstBonusDescription: captainsBonuses?.[firstBonusIndex]?.bonus,
    secondBonusDescription: captainsBonuses?.[secondBonusIndex]?.bonus,
    firstBonusValue,
    secondBonusValue,
    exp: notateNumber(Math.floor(exp), 'Big')
  }
  const firstBonus = getCaptainDisplayBonus(captainObj, firstBonusValue);
  const secondBonus = getCaptainDisplayBonus(captainObj, secondBonusValue);
  captainObj.firstBonus = firstBonus;
  captainObj.secondBonus = secondBonus;
  captainObj.firstBonusDescription = captainObj?.firstBonusDescription?.replace('{', firstBonus);
  captainObj.secondBonusDescription = captainObj?.secondBonusDescription?.replace('{', secondBonus);
  captainObj.expReq = notateNumber(getCaptainExpReq(captainObj), 'Big');
  if (isShop) {
    const baseCost = 2 * firstBonusIndex + (2 * secondBonusIndex) + firstBonusValue + secondBonusValue;
    captainObj.cost = Math.pow(8, 1 + captainType) * (1 + Math.pow(baseCost, 2) / 100);
  }
  return captainObj;
}


const getBoatBreakdownResources = (boat, lootPile) => {
  let sum = [{ required: 0 }, { required: 0 }];
  const lootBreakpoint = boat?.lootLevel + (8 - (boat?.lootLevel % 8));
  const speedBreakpoint = boat?.speedLevel + (7 - (boat?.speedLevel % 7));
  for (let level = boat?.lootLevel; level < lootBreakpoint; level++) {
    const [resource] = getBoatResources({ ...boat, lootLevel: level }, lootPile);
    sum[0] = { ...resource, required: sum[0].required + resource?.required };
  }
  for (let level = boat?.speedLevel; level < speedBreakpoint; level++) {
    const [, resource] = getBoatResources({ ...boat, speedLevel: level }, lootPile);
    sum[1] = { ...resource, required: sum[1].required + resource?.required };
  }
  return sum;
}
const getBoatResources = (boat, lootPile) => {
  return [0, 1].map((index) => {
    const boatType = getBoatUpgradeCostType(boat?.boatIndex, index);
    return {
      required: getBoatUpgradeCost(boat, index),
      ...(lootPile?.[boatType] || {})
    }
  });
}
const getBoatUpgradeCostType = (boatIndex, itemIndex) => {
  return 0 === itemIndex ? (4 > boatIndex ? 0 : Math.min(30, 1 + 2 * (boatIndex - 4))) :
    2 > boatIndex ? boatIndex : 5 > boatIndex ? 1 + 2 * (boatIndex - 2) : Math.min(30, 2 * (boatIndex - 4));
}

const getBoatUpgradeCost = (boat, itemIndex) => {
  const boatType = getBoatUpgradeCostType(boat?.boatIndex, itemIndex);
  const value = itemIndex === 0 ? boat?.lootLevel : boat?.speedLevel;
  if (boatType === 0) {
    return Math.round((5 + 4 * value) * Math.pow(1.17 - .12 * value / (value + 200), value))
  }
  else if (boatType % 2 === 1) {
    return Math.round((5 + 2 * value) * Math.pow(1.15 - (0.1 * value) / (value + 200), value));
  }
  else {
    return Math.round((2 + value) * Math.pow(1.12 - (0.07 * value) / (value + 200), value));
  }
}

const getFinalBoatSpeed = ({ speedLevel, captainSpeedBonus, baseSpeed }) => {
  return (10 + (5 + Math.pow(Math.floor(speedLevel / 7), 2)) * speedLevel) * (1 + captainSpeedBonus / 100) * baseSpeed;
}

const getBoatSpeedValue = (captain, island, speedLevel, baseSpeed, minimumTravelTime) => {
  let captainSpeedBonus = 0;
  if (captain?.firstBonusDescription?.includes('Boat_Speed')) {
    captainSpeedBonus += captain?.firstBonus;
  }
  if (captain?.secondBonusDescription?.includes('Boat_Speed')) {
    captainSpeedBonus += captain?.secondBonus;
  }
  const nextBreakpoint = speedLevel + (7 - (speedLevel % 7));
  const boatSpeed = getFinalBoatSpeed({ speedLevel, captainSpeedBonus, baseSpeed });
  const nextLevelBoatSpeed = getFinalBoatSpeed({ speedLevel: speedLevel + 1, captainSpeedBonus, baseSpeed });
  let nextBreakpointValue;
  if (nextBreakpoint !== speedLevel + 1) {
    nextBreakpointValue = getFinalBoatSpeed({ speedLevel: nextBreakpoint, captainSpeedBonus, baseSpeed });
  }
  return {
    raw: boatSpeed,
    value: island ? Math.min(boatSpeed, (island?.distance * 60) / minimumTravelTime) : boatSpeed,
    nextLevelValue: nextLevelBoatSpeed,
    nextBreakpointValue
  };
}
const getFinalBoatLoot = ({
                            lootLevelMath,
                            lootLevel,
                            lootPileSigil,
                            artifactBonus,
                            firstCaptainBonus,
                            secondCaptainBonus,
                            talentBonus
                          }) => {
  return (5 + lootLevelMath * lootLevel) * (1 + (lootPileSigil + ((firstCaptainBonus + secondCaptainBonus) + artifactBonus)) / 100) * talentBonus;
}
const getBoatLootValue = (characters, account, artifactsList, boat, captain) => {
  const unendingLootSearch = getHighestTalentByClass(characters, CLASSES.Siege_Breaker, 'UNENDING_LOOT_SEARCH');
  const talentBonus = 1 + unendingLootSearch / 100;
  const nextBreakpoint = boat?.lootLevel + (8 - (boat?.lootLevel % 8));
  const nextLevelMath = 2 + Math.pow(Math.floor(((boat?.lootLevel) + 1) / 8), 2)
  const currentLevelMath = 2 + Math.pow(Math.floor((boat?.lootLevel) / 8), 2);
  const breakpointLevelMath = 2 + Math.pow(Math.floor((nextBreakpoint) / 8), 2);
  const lootPileSigil = getSigilBonus(account?.alchemy?.p2w?.sigils, 'LOOT_PILE');
  const firstCaptainBonus = getCaptainBonus(1, captain, captain?.firstBonusIndex);
  const secondCaptainBonus = getCaptainBonus(1, captain, captain?.secondBonusIndex);
  const artifactBonus = isArtifactAcquired(artifactsList, 'Genie_Lamp')?.bonus ?? 0;
  const value = getFinalBoatLoot({
    lootLevelMath: currentLevelMath,
    lootLevel: boat?.lootLevel,
    lootPileSigil,
    artifactBonus,
    firstCaptainBonus,
    secondCaptainBonus,
    talentBonus
  });
  const nextLevelValue = getFinalBoatLoot({
    lootLevelMath: nextLevelMath,
    lootLevel: boat?.lootLevel + 1,
    lootPileSigil,
    artifactBonus,
    firstCaptainBonus,
    secondCaptainBonus,
    talentBonus
  });
  let nextBreakpointValue;
  if (nextBreakpoint !== boat?.lootLevel + 1) {
    nextBreakpointValue = getFinalBoatLoot({
      lootLevelMath: breakpointLevelMath,
      lootLevel: nextBreakpoint,
      lootPileSigil,
      artifactBonus,
      firstCaptainBonus,
      secondCaptainBonus,
      talentBonus
    });
  }
  return {
    value: value,
    nextLevelValue: nextLevelValue,
    nextBreakpointValue
  }
}

const getCaptainExpReq = (captain) => {
  const math = 9 + Math.pow(captain?.level, 3);
  const moreMath = Math.pow(1.5, captain?.level);
  return math * moreMath * Math.pow(1.5, Math.max(captain?.level - 10, 0));
}

const getCaptainDisplayBonus = (captain, value) => {
  return Math.round(captain?.level * value * 10) / 10;
}

const getBoatArtifactChance = (artifacts, captain, account) => {
  const fauxoryTusk = isArtifactAcquired(artifacts, 'Fauxory_Tusk')?.bonus ?? 0;
  const shinyBonus = getShinyBonus(account?.breeding?.pets, 'Higher_Artifact_Find_Chance');
  const firstCaptainBonus = getCaptainBonus(3, captain, captain?.firstBonusIndex);
  const secondCaptainBonus = getCaptainBonus(3, captain, captain?.secondBonusIndex);
  return notateNumber(Math.max(1, 1 + (fauxoryTusk + (firstCaptainBonus + secondCaptainBonus) + shinyBonus) / 100), 'MultiplierInfo');
}

const getCaptainBonus = (bonusIndex, captain, captainBonusIndex) => {
  if (captainBonusIndex > 0) return 0;
  if (captainBonusIndex === bonusIndex) {
    return captain?.level * captain?.firstBonusValue;
  }
  else if (captainBonusIndex === bonusIndex) {
    return captain?.level * captain?.secondBonusValue;
  }
  return 0;
}


const getBoatFrame = (totalLevels) => {
  if (totalLevels < 25) {
    return 0;
  }
  else if (totalLevels < 50) {
    return 1;
  }
  else if (totalLevels < 100) {
    return 2;
  }
  else if (totalLevels < 200) {
    return 3;
  }
  else {
    return totalLevels < 300 ? 4 : 5
  }
}


const getLootPile = (lootPile) => {
  return lootPile?.map((item, index) => ({
    amount: item > 0 ? item : 0,
    rawName: `SailT${index}`
  }))
}

const getArtifact = (artifact, acquired, lootPile, index, charactersData, account) => {
  let additionalData, bonus = artifact?.baseBonus, baseBonus = artifact?.baseBonus,
    upgradedForm = acquired === 2 || acquired === 3 || acquired === 4 || acquired === 5, formMultiplier = acquired,
    multiplierType = acquired === 2 ? 'ancientMultiplier' : acquired === 3 ? 'eldritchMultiplier' : acquired === 4
      ? 'sovereignMultiplier' : acquired === 5 ? 'omnipotentMultiplier'
        : 'baseBonus';

  let fixedDescription = artifact?.description;
  if (artifact?.name === 'Maneki_Kat' || artifact?.name === 'Ashen_Urn') {
    const highestLevel = getHighestLevelCharacter(charactersData);
    additionalData = `Highest level: ${highestLevel}`;
    bonus = highestLevel * artifact?.baseBonus;
    if (artifact?.name === 'Ashen_Urn') {
      bonus = highestLevel > artifact?.[multiplierType]
        ? artifact?.[multiplierType] * artifact?.baseBonus
        : highestLevel * artifact?.baseBonus;
      fixedDescription = `${fixedDescription} Total Bonus: ${upgradedForm ? bonus * formMultiplier : bonus}`;
    }
  }
  else if (artifact?.name === 'Ruble_Cuble' || artifact?.name === '10_AD_Tablet' || artifact?.name === 'Jade_Rock' || artifact?.name === 'Gummy_Orb') {
    const lootedItems = account?.looty?.rawLootedItems;
    const everyXMulti = artifact?.name === '10_AD_Tablet' || artifact?.name === 'Gummy_Orb' || artifact?.name === 'Jade_Rock';
    additionalData = `Looted items: ${lootedItems}`;
    const slabSovereignty = getLabBonus(account?.lab.labBonuses, 15); // gem multi
    const math = artifact?.[multiplierType] * (1 + slabSovereignty / 100) * Math.floor(Math.max(0, lootedItems - 500) / 10);
    bonus = everyXMulti && multiplierType !== 'baseBonus' ? artifact?.baseBonus * math : math;
  }
  else if (artifact?.name === 'Fauxory_Tusk' || artifact?.name === 'Genie_Lamp') {
    const isGenie = artifact?.name === 'Genie_Lamp';
    const highestSailing = getHighestCharacterSkill(charactersData, 'sailing');
    bonus = isGenie ? highestSailing * artifact?.baseBonus : highestSailing;
    additionalData = `Sailing level: ${highestSailing}`;
  }
  else if (artifact?.name === 'Weatherbook') {
    const highestGaming = getHighestCharacterSkill(charactersData, 'gaming');
    additionalData = `Gaming level: ${highestGaming}`;
    bonus = highestGaming * artifact?.baseBonus;
  }
  else if (artifact?.name === 'Triagulon') {
    const ownedTurkey = account?.cooking?.meals?.[0]?.amount;
    bonus = (artifact?.baseBonus * lavaLog(ownedTurkey));
  }
  else if (artifact?.name === 'Opera_Mask') {
    const sailingGold = lootPile?.[0];
    bonus = (artifact?.baseBonus * lavaLog(sailingGold));
  }
  else if (artifact?.name === 'Fun_Hippoete') {
    bonus = artifact?.baseBonus * lavaLog(account?.construction?.playersBuildRate)
  }
  else if (artifact?.name === 'The_True_Lantern') {
    bonus = artifact?.baseBonus * (lavaLog(account?.atoms?.particles) ?? 0);
  }
  else if (artifact?.name === 'Gold_Relic') {
    const daysSinceLastSample = account?.accountOptions?.[125];
    const goldRelicBonus = upgradedForm ? artifact?.[multiplierType] : 0;
    const daysBonus = 1 + ((daysSinceLastSample) * (2 + goldRelicBonus)) / 100;
    additionalData = `Days passed: ${daysSinceLastSample}. Bonus: ${notateNumber(daysBonus, 'MultiplierInfo').replace('#', '')}x`;
  }
  else if (artifact?.name === 'Crystal_Steak') {
    const mainStats = charactersData?.map(({ name, class: className, stats }) => {
      const mainStat = mainStatMap?.[className];
      return { name, stat: stats?.[mainStat] };
    })
    fixedDescription = fixedDescription.replace('_Total_Bonus:_+}%_dmg', '')
    additionalData = mainStats.map(({ name, stat }) => ({
      name,
      bonus: (upgradedForm ? bonus * formMultiplier : bonus) * Math.floor(stat / 100)
    }));
  }
  else if (artifact?.name === 'Socrates') {
    const mainStats = charactersData?.map(({ name, stats }) => {
      return {
        name,
        strength: stats?.strength ?? 0,
        agility: stats?.agility ?? 0,
        wisdom: stats?.wisdom ?? 0,
        luck: stats?.luck ?? 0
      };
    })
    additionalData = mainStats.map(({ name, strength, agility, wisdom, luck }) => {
      const multiplier = 1 + (upgradedForm ? artifact?.baseBonus * formMultiplier : artifact?.baseBonus) / 100;
      return {
        name,
        strength: Math.floor(multiplier * strength),
        agility: Math.floor(multiplier * agility),
        wisdom: Math.floor(multiplier * wisdom),
        luck: Math.floor(multiplier * luck)
      }
    });
  }

  if (acquired === 2 && artifact?.ancientFormDescription === 'The_artifact\'s_main_bonus_is_doubled!') {
    bonus *= 2;
  }
  else if (acquired === 3 && artifact?.eldritchFormDescription === 'The_artifact\'s_main_bonus_is_tripled!') {
    bonus *= 3;
  }
  else if (acquired === 4 && artifact?.sovereignFormDescription === 'The_artifact\'s_main_bonus_is_quadrupled!') {
    bonus *= 4;
  }
  else if (acquired === 5 && artifact?.omnipotentFormDescription === 'The_artifact\'s_main_bonus_is_quintupled') {
    bonus *= 5;
  }

  fixedDescription = fixedDescription.replace(/{/, baseBonus).replace(/}/, kFormatter(bonus, 2)).replace(/@/, '');
  return {
    ...artifact,
    description: fixedDescription,
    additionalData,
    bonus,
    acquired,
    rawName: `Arti${index}`
  }
}

export const calcTotalBoatLevels = (boats) => {
  return boats?.reduce((res, { level }) => res + level, 0);
}
export const calcArtifactsAcquired = (boats) => {
  return boats?.reduce((res, { acquired }) => res + acquired, 0);
}