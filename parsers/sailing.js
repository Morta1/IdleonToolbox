import { kFormatter, lavaLog, notateNumber, tryToParse } from "../utility/helpers";
import { artifacts, captainsBonuses, classFamilyBonuses, islands } from "../data/website-data";
import {
  getHighestCharacterSkill,
  getHighestLevelCharacter,
  getHighestLevelOfClass,
  isMasteryBonusUnlocked
} from "./misc";
import { mainStatMap } from "./talents";
import { getBubbleBonus, getSigilBonus, getVialsBonusByStat } from "./alchemy";
import { getCardBonusByEffect } from "./cards";
import { getStampsBonusByEffect } from "./stamps";
import { getMealsBonusByEffectOrStat } from "./cooking";
import { getGodBlessingBonus } from "./divinity";
import { getStatueBonus } from "./statues";
import { isSuperbitUnlocked } from "./gaming";
import { getJewelBonus, getLabBonus } from "./lab";
import { getShinyBonus } from "./breeding";
import { getFamilyBonusBonus } from "./family";

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
  const dreamCatcher = isArtifactAcquired(artifactsList, 'Dreamcatcher');
  const maxChests = Math.min(Math.round(5 + (dreamCatcher?.bonus ?? 0) + (account?.gemShopPurchases?.find((value, index) => index === 129) ?? 0)), 19);
  const chests = getChests(chestsRaw, artifactsList, serverVars);
  const rareTreasureChance = getRareTreasureChance();
  const lootPileList = getLootPile(lootPile);

  return {
    maxChests,
    artifacts: artifactsList,
    lootPile: lootPileList,
    chests,
    rareTreasureChance,
    ...getCaptainsAndBoats(sailingRaw, captainsRaw, boatsRaw, account, charactersData, charactersLevels, artifactsList, lootPileList)
  };
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
    rawName: `SailChest${chest?.[3]}`,
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
    } else {
      if (artifact?.acquired === 1) {
        baseMath = startingIndex * (1 - chance / getAncientChances(islandIndex, serverVars));
        startingIndex = baseMath;
      }
    }
  }
  if (baseMath === 0) {
    return { done: true, island, islandIndex, treasure };
  }
  const artifactChance = 100 * Math.min(1, 1 - (baseMath));
  const possibleArtifacts = artifactsList?.slice(artifactsStartIndex, artifactsStartIndex + island?.numberOfArtifacts)
    .filter(({ acquired }) => acquired < 2);

  return {
    artifactChance: artifactChance > 0.01 ? Math.round(100 * artifactChance) / 100 : 0.01,
    ancientChance: (chance / getAncientChances(islandIndex, serverVars)).toFixed(5),
    eldritchChance: (chance / getEldritchChances(islandIndex, serverVars)).toFixed(5),
    island,
    islandIndex,
    treasure,
    possibleArtifacts,
  };
}

const getAncientChances = (islandsUnlocked, serverVars) => {
  return 3 > islandsUnlocked ? 850 : (1e3 + (islandsUnlocked - 3) * serverVars?.AncientOddPerIsland) / (1 + serverVars?.AncientArtiPCT / 100);
}

const getEldritchChances = (islandsUnlocked, serverVars) => {
  return 3 > islandsUnlocked ? 900 + 250 * islandsUnlocked : ((1e3 + (islandsUnlocked - 3) * serverVars?.AncientOddPerIsland) / (1 + serverVars?.AncientArtiPCT / 100)) * 4;
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
  const highestLevelSiegeBreaker = getHighestLevelOfClass(charactersLevels, 'Siege_Breaker') ?? 0;
  const familyBonus = getFamilyBonusBonus(classFamilyBonuses, 'FASTER_MINIMUM_BOAT_TRAVEL_TIME', highestLevelSiegeBreaker);
  const shinyBonus = getShinyBonus(account?.breeding?.pets, 'Lower_Minimum_Travel_Time_for_Sailing');
  const minimumTravelTime = Math.round(120 / (1 + (familyBonus + shinyBonus) / 100))
  const baseSpeed = getBaseSpeed(account, characters, artifactsList);
  let shopCaptains = captainsRaw?.slice(30, 34);
  shopCaptains = shopCaptains.map((captain, index) => getCaptain(captain, index, true))
  const allCaptains = captainsRaw?.slice(0, captainsUnlocked + 1);
  const captains = allCaptains?.map((captain, index) => getCaptain(captain, index))
  const allBoats = boatsRaw?.slice(0, boatsUnlocked + 1);
  const boats = allBoats?.map((boat, index) => getBoat(boat, index, lootPileList, captains, artifactsList, account, baseSpeed, minimumTravelTime));
  const captainsOnBoats = boats?.reduce((res, { captainMappedIndex }, index) => ({
    ...res,
    [captainMappedIndex]: index
  }), {});
  return {
    captains,
    boats,
    shopCaptains,
    captainsOnBoats
  }
}

const getBoat = (boat, boatIndex, lootPile, captains, artifactsList, account, baseSpeed, minimumTravelTime = 120) => {
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
    distanceTraveled,
  }


  boatObj.resources = getBoatResources(boatObj, lootPile);
  boatObj.loot = getBoatLootValue(account, artifactsList, boatObj, captain);
  boatObj.speed = getBoatSpeedValue(captain, island, speedLevel, baseSpeed, minimumTravelTime)
  boatObj.timeLeft = ((island?.distance - distanceTraveled) / boatObj.speed?.value) * 3600 * 1000;
  return boatObj
}

const getBaseSpeed = (account, characters, artifactsList) => {
  const purrmepPlayer = characters?.find(({ linkedDeity }) => linkedDeity === 6); // purrmep is limited to only 1 player linked.
  const divinityMinorBonus = purrmepPlayer?.deityMinorBonus ?? 0;
  const cardBonus = getCardBonusByEffect(account?.cards, 'Sailing_Speed_(Passive)');
  const stampBonus = getStampsBonusByEffect(account?.stamps, 'Sailing_Speed')
  const spelunkerObolMulti = getLabBonus(account?.lab.labBonuses, 8); // gem multi
  const blackDiamondRhinestone = getJewelBonus(account?.lab?.jewels, 16, spelunkerObolMulti);
  const mealBonus = getMealsBonusByEffectOrStat(account, null, 'Sailing', blackDiamondRhinestone);
  const bubbleBonus = getBubbleBonus(account?.alchemy?.bubbles, 'kazam', 'BOATY_BUBBLE', false)
  const goharutGodBonus = getGodBlessingBonus(account?.divinity?.deities, 'Goharut');
  const bagurGodBonus = getGodBlessingBonus(account?.divinity?.deities, 'Bagur');
  const purrmepGodBonus = getGodBlessingBonus(account?.divinity?.deities, 'Purrmep');
  const artifactBonus = isArtifactAcquired(artifactsList, '10_AD_Tablet')?.bonus ?? 0;
  const vialBonus = getVialsBonusByStat(account?.alchemy?.vials, 'SailSpd');
  const superbitBonus = isSuperbitUnlocked(account, 'MSA_Sailing')?.bonus ?? 0;
  const skillMasteryBonus = isMasteryBonusUnlocked(account?.rift, account?.totalSkillsLevels?.sailing?.rank, 1);

  const statueBonus = getStatueBonus(account?.statues, 'StatueG25')
  const firstMath = (1 + (divinityMinorBonus + cardBonus + bubbleBonus) / 125) * (1 + goharutGodBonus / 100);
  return firstMath * (1 + purrmepGodBonus / 100)
    * (1 + (bagurGodBonus +
      artifactBonus + stampBonus + statueBonus + mealBonus + vialBonus + (17 * skillMasteryBonus + superbitBonus)) / 125);
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
    exp: notateNumber(Math.floor(exp), 'Big'),
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
  } else if (boatType % 2 === 1) {
    return Math.round((5 + 2 * value) * Math.pow(1.15 - (0.1 * value) / (value + 200), value));
  } else {
    return Math.round((2 + value) * Math.pow(1.12 - (0.07 * value) / (value + 200), value));
  }
}

const getBoatSpeedValue = (captain, island, speedLevel, baseSpeed, minimumTravelTime) => {
  let captainSpeedBonus = 0;
  if (captain?.firstBonusDescription?.includes('Boat_Speed')) {
    captainSpeedBonus += captain?.firstBonus;
  }
  if (captain?.secondBonusDescription?.includes('Boat_Speed')) {
    captainSpeedBonus += captain?.secondBonus;
  }
  const boatSpeed = (10 + (5 + Math.pow(Math.floor(speedLevel / 7), 2)) * speedLevel) * (1 + captainSpeedBonus / 100) * baseSpeed;
  const nextLevelBoatSpeed = (10 + (5 + Math.pow(Math.floor((speedLevel + 1) / 7), 2)) * (speedLevel + 1)) * (1 + captainSpeedBonus / 100) * baseSpeed;
  return {
    value: island ? Math.min(boatSpeed, (island?.distance * 60) / minimumTravelTime) : boatSpeed,
    nextLevelValue: island ? Math.min(nextLevelBoatSpeed, (island?.distance * 60) / minimumTravelTime) : nextLevelBoatSpeed
  };
}
const getBoatLootValue = (account, artifactsList, boat, captain) => {
  const nextLevelMath = 2 + Math.pow(Math.floor(((boat?.lootLevel) + 1) / 8), 2)
  const currentLevelMath = 2 + Math.pow(Math.floor((boat?.lootLevel) / 8), 2)
  const lootPileSigil = getSigilBonus(account?.alchemy?.p2w?.sigils, 'LOOT_PILE');
  const firstCaptainBonus = getCaptainBonus(1, captain, captain?.firstBonusIndex);
  const secondCaptainBonus = getCaptainBonus(1, captain, captain?.secondBonusIndex);
  const artifact = isArtifactAcquired(artifactsList, 'Genie_Lamp');
  const nextLevelValue = (5 + nextLevelMath * (boat?.lootLevel + 1)) * (1 + (lootPileSigil + ((firstCaptainBonus + secondCaptainBonus) + artifact?.bonus)) / 100);
  const value = (5 + currentLevelMath * boat?.lootLevel) * (1 + (lootPileSigil + ((firstCaptainBonus + secondCaptainBonus) + artifact?.bonus)) / 100);
  return {
    value: notateNumber(value, 'Big'),
    nextLevelValue: notateNumber(nextLevelValue, 'Big')
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
  const fauxoryTusk = isArtifactAcquired(artifacts, "Fauxory_Tusk");
  const shinyBonus = getShinyBonus(account?.breeding?.pets, 'Higher_Artifact_Find_Chance');
  const firstCaptainBonus = getCaptainBonus(3, captain, captain?.firstBonusIndex);
  const secondCaptainBonus = getCaptainBonus(3, captain, captain?.secondBonusIndex);
  return notateNumber(Math.max(1, 1 + (fauxoryTusk?.bonus + (firstCaptainBonus + secondCaptainBonus) + shinyBonus) / 100), 'MultiplierInfo')
    .replace('#', '');
}

const getCaptainBonus = (bonusIndex, captain, captainBonusIndex) => {
  if (captainBonusIndex > 0) return 0;
  if (captainBonusIndex === bonusIndex) {
    return captain?.level * captain?.firstBonusValue;
  } else if (captainBonusIndex === bonusIndex) {
    return captain?.level * captain?.secondBonusValue;
  }
  return 0;
}


const getBoatFrame = (totalLevels) => {
  if (totalLevels < 25) {
    return 0;
  } else if (totalLevels < 50) {
    return 1;
  } else if (totalLevels < 100) {
    return 2;
  } else if (totalLevels < 200) {
    return 3;
  } else {
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
    upgradedForm = acquired === 2 || acquired === 3, formMultiplier = acquired,
    multiplierType = acquired === 2 ? 'ancientMultiplier' : acquired === 3 ? 'eldritchMultiplier' : '';

  let fixedDescription = artifact?.description;
  if (artifact?.name === 'Maneki_Kat' || artifact?.name === 'Ashen_Urn') {
    const highestLevel = getHighestLevelCharacter(charactersData)
    additionalData = `Highest level: ${highestLevel}`;
    bonus = highestLevel * artifact?.baseBonus;
    if (artifact?.name === 'Ashen_Urn') {
      bonus = highestLevel > artifact?.[multiplierType] ? artifact?.[multiplierType] * artifact?.baseBonus : highestLevel * artifact?.baseBonus;
      fixedDescription = `${fixedDescription} Total Bonus: ${upgradedForm ? bonus * formMultiplier : bonus}`;
    }
  } else if (artifact?.name === 'Ruble_Cuble' || artifact?.name === '10_AD_Tablet' || artifact?.name === 'Jade_Rock' || artifact?.name === 'Gummy_Orb') {
    const lootedItems = account?.looty?.rawLootedItems;
    const everyXMulti = artifact?.name === '10_AD_Tablet' || artifact?.name === 'Gummy_Orb';
    additionalData = `Looted items: ${lootedItems}`;
    const math = artifact?.[multiplierType] * Math.floor((lootedItems - 500) / 10);
    bonus = everyXMulti ? artifact?.baseBonus * math : math;
  } else if (artifact?.name === 'Fauxory_Tusk' || artifact?.name === 'Genie_Lamp') {
    const isGenie = artifact?.name === 'Genie_Lamp';
    const highestSailing = getHighestCharacterSkill(charactersData, 'sailing');
    bonus = isGenie ? highestSailing * artifact?.baseBonus : highestSailing;
    additionalData = `Sailing level: ${highestSailing}`;
  } else if (artifact?.name === 'Weatherbook') {
    const highestGaming = getHighestCharacterSkill(charactersData, 'gaming');
    additionalData = `Gaming level: ${highestGaming}`;
    bonus = highestGaming * artifact?.baseBonus;
  } else if (artifact?.name === 'Triagulon') {
    const ownedTurkey = account?.cooking?.meals?.[0]?.amount;
    bonus = (artifact?.baseBonus * lavaLog(ownedTurkey));
  } else if (artifact?.name === 'Opera_Mask') {
    const sailingGold = lootPile?.[0];
    bonus = (artifact?.baseBonus * lavaLog(sailingGold));
  } else if (artifact?.name === 'Gold_Relic') {
    const daysSinceLastSample = account?.accountOptions?.[125];
    const goldRelicBonus = upgradedForm ? artifact?.[multiplierType] : 0;
    const test = 1 + ((daysSinceLastSample) * (1 + goldRelicBonus)) / 100;
    additionalData = `Days passed: ${daysSinceLastSample}. Bonus: ${notateNumber(test, 'MultiplierInfo').replace('#', '')}x`;
  } else if (artifact?.name === 'Crystal_Steak') {
    const mainStats = charactersData?.map(({ name, class: className, stats }) => {
      const mainStat = mainStatMap?.[className];
      return { name, stat: stats?.[mainStat] };
    })
    fixedDescription = fixedDescription.replace('_Total_Bonus:_+}%_dmg', '')
    additionalData = mainStats.map(({ name, stat }) => ({
      name,
      bonus: (upgradedForm ? bonus * formMultiplier : bonus) * Math.floor(stat / 100)
    }));
  } else if (artifact?.name === 'Socrates') {
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
        luck: Math.floor(multiplier * luck),
      }
    });
  }

  if (acquired === 2 && artifact?.ancientFormDescription === "The_artifact's_main_bonus_is_doubled!") {
    bonus *= 2;
  } else if (acquired === 3 && artifact?.eldritchFormDescription === "The_artifact's_main_bonus_is_tripled!") {
    bonus *= 3;
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