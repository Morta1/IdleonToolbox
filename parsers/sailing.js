import { kFormatter, lavaLog, notateNumber, tryToParse } from "../utility/helpers";
import { artifacts, captainsBonuses, islands } from "../data/website-data";
import { getHighestLevelCharacter } from "./misc";
import { mainStatMap } from "./talents";
import { getSigilBonus } from "./alchemy";

export const getSailing = (idleonData, artifactsList, charactersData, account, serverVars) => {
  const sailingRaw = tryToParse(idleonData?.Sailing) || idleonData?.Sailing;
  const captainsRaw = tryToParse(idleonData?.Captains) || idleonData?.Captains;
  const boatsRaw = tryToParse(idleonData?.Boats) || idleonData?.Boats;
  const chestsRaw = tryToParse(idleonData?.SailChests) || idleonData?.SailChests;
  if (!sailingRaw || !captainsRaw || !boatsRaw || !chestsRaw) return null;
  return parseSailing(artifactsList, sailingRaw, captainsRaw, boatsRaw, chestsRaw, charactersData, account, serverVars);
}

const parseSailing = (artifactsList, sailingRaw, captainsRaw, boatsRaw, chestsRaw, charactersData, account, serverVars) => {
  const lootPile = sailingRaw?.[1];
  const maxChests = Math.min(Math.round(5 + (account?.gemShopPurchases?.find((value, index) => index === 129) ?? 0)), 19);
  const chests = getChests(chestsRaw, artifactsList, serverVars);
  const rareTreasureChance = getRareTreasureChance();
  const lootPileList = getLootPile(lootPile);

  return {
    maxChests,
    artifacts: artifactsList,
    lootPile: lootPileList,
    chests,
    rareTreasureChance,
    ...getCaptainsAndBoats(sailingRaw, captainsRaw, boatsRaw, account, artifactsList, lootPileList)
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
    island,
    islandIndex,
    treasure,
    possibleArtifacts,
  };
}

const getAncientChances = (islandsUnlocked, serverVars) => {
  // AncientOddPerIsland = 450
  // AncientArtiPCT = 0
  return 3 > islandsUnlocked ? 850 : (1e3 + (islandsUnlocked - 3) * serverVars?.AncientOddPerIsland) / (1 + serverVars?.AncientArtiPCT / 100);
}

export const isArtifactAcquired = (artifacts, artifactName) => {
  return artifacts?.find(({ name, acquired }) => name === artifactName && acquired);
}

const getRareTreasureChance = () => {
  return Math.min(0.05, 0.1);
}

const getCaptainsAndBoats = (sailingRaw, captainsRaw, boatsRaw, account, artifactsList, lootPileList) => {
  const captainsUnlocked = sailingRaw?.[2]?.[0] || 0;
  const boatsUnlocked = sailingRaw?.[2]?.[1] || 0;
  const allCaptains = captainsRaw?.slice(0, captainsUnlocked + 1);
  const captains = allCaptains?.map((captain, index) => getCaptain(captain, index))
  const allBoats = boatsRaw?.slice(0, boatsUnlocked + 1);
  const boats = allBoats?.map((boat, index) => getBoat(boat, index, lootPileList, captains, artifactsList, account));
  const captainsOnBoats = boats?.reduce((res, { captainMappedIndex }, index) => ({
    ...res,
    [captainMappedIndex]: index
  }), {});
  return {
    captains,
    boats,
    captainsOnBoats
  }
}

const getBoat = (boat, boatIndex, lootPile, captains, artifactsList, account) => {
  const [captainIndex, islandIndex, , lootLevel, distanceTraveled, speedLevel] = boat;
  const captain = captains?.[captainIndex];
  const boatObj = {
    rawName: `Boat_Frame_${getBoatFrame(lootLevel + speedLevel)}`,
    level: lootLevel + speedLevel,
    artifactChance: getBoatArtifactChance(artifactsList, captains[captainIndex]),
    captainIndex,
    captainMappedIndex: captain?.captainIndex,
    lootLevel, speedLevel,
    boatIndex,
    island: islands?.[islandIndex],
    distanceTraveled,
  }

  boatObj.resources = getBoatResources(boatObj, lootPile);
  boatObj.loot = getBoatLootValue(account, artifactsList, boatObj, captain);
  return boatObj
}

const getCaptain = (captain, index) => {
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
  const math = Math.pow(captain?.level, 3);
  const moreMath = Math.pow(1.5, captain?.level);
  return math * moreMath * Math.pow(1.5, Math.max(captain?.level - 10, 0));
}

const getCaptainDisplayBonus = (captain, value) => {
  return Math.round(captain?.level * value * 10) / 10;
}

const getBoatArtifactChance = (artifacts, captain) => {
  const fauxoryTusk = isArtifactAcquired(artifacts, "Fauxory_Tusk");
  const firstCaptainBonus = getCaptainBonus(3, captain, captain?.firstBonusIndex);
  const secondCaptainBonus = getCaptainBonus(3, captain, captain?.secondBonusIndex);
  return notateNumber(Math.max(1, 1 + (fauxoryTusk?.bonus + (firstCaptainBonus + secondCaptainBonus)) / 100), 'MultiplierInfo')
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
  let additionalData, bonus = artifact?.baseBonus, baseBonus = artifact?.baseBonus, ancientForm = acquired === 2;
  let fixedDescription = artifact?.description;
  if (artifact?.name === 'Maneki_Kat' || artifact?.name === 'Ashen_Urn') {
    const highestLevel = getHighestLevelCharacter(charactersData)
    additionalData = `Highest level: ${highestLevel}`;
    bonus = highestLevel * artifact?.baseBonus;
    if (artifact?.name === 'Ashen_Urn') {
      bonus = highestLevel > artifact?.multiplier ? artifact?.multiplier * artifact?.baseBonus : highestLevel * artifact?.baseBonus;
      fixedDescription = `${fixedDescription} Total Bonus: ${ancientForm ? bonus * 2 : bonus}`;
    }
  } else if (artifact?.name === 'Ruble_Cuble' || artifact?.name === '10_AD_Tablet' || artifact?.name === 'Jade_Rock' || artifact?.name === 'Gummy_Orb') {
    const lootedItems = account?.looty?.rawLootedItems;
    const everyXMulti = artifact?.name === '10_AD_Tablet' || artifact?.name === 'Gummy_Orb';
    additionalData = `Looted items: ${lootedItems}`;
    const math = artifact?.multiplier * Math.floor((lootedItems - 500) / 10);
    bonus = everyXMulti ? artifact?.baseBonus * math : math;
  } else if (artifact?.name === 'Fauxory_Tusk' || artifact?.name === 'Genie_Lamp') {
    const sailingLevel = charactersData?.[1]?.skillsInfo?.sailing?.level || 0;
    const isGenie = artifact?.name === 'Genie_Lamp';
    bonus = isGenie ? sailingLevel * artifact?.baseBonus : sailingLevel;
    additionalData = `Sailing level: ${sailingLevel}`;
  } else if (artifact?.name === 'Weatherbook') {
    const gamingLevel = charactersData?.[1]?.skillsInfo?.gaming?.level || 0;
    additionalData = `Gaming level: ${gamingLevel}`;
    bonus = gamingLevel * artifact?.baseBonus;
  } else if (artifact?.name === 'Triagulon') {
    const ownedTurkey = account?.cooking?.meals?.[0]?.amount;
    bonus = (artifact?.baseBonus * lavaLog(ownedTurkey));
  } else if (artifact?.name === 'Opera_Mask') {
    const sailingGold = lootPile?.[0];
    bonus = (artifact?.baseBonus * lavaLog(sailingGold));
  } else if (artifact?.name === 'Gold_Relic') {
    const daysSinceLastSample = account?.accountOptions?.[125];
    const goldRelicBonus = ancientForm ? artifact?.multiplier : 0;
    const test = 1 + ((daysSinceLastSample) * (1 + goldRelicBonus)) / 100;
    additionalData = `Days passed: ${daysSinceLastSample}. Bonus: x${test}`;
  } else if (artifact?.name === 'Crystal_Steak') {
    const mainStats = charactersData?.map(({ name, class: className, stats }) => {
      const mainStat = mainStatMap?.[className];
      return { name, stat: stats?.[mainStat] };
    })
    fixedDescription = fixedDescription.replace('_Total_Bonus:_+}%_dmg', '')
    additionalData = mainStats.map(({ name, stat }) => ({
      name,
      bonus: (ancientForm ? bonus * 2 : bonus) * Math.floor(stat / 100)
    }));
  } else if (artifact?.name === 'Socrates') {
    const mainStats = charactersData?.map(({ name, stats }) => {
      return { name, strength: stats.strength, agility: stats.agility, wisdom: stats.wisdom, luck: stats.luck };
    })
    additionalData = mainStats.map(({ name, strength, agility, wisdom, luck }) => {
      const multiplier = 1 + (ancientForm ? artifact?.baseBonus * 2 : artifact?.baseBonus) / 100;
      return {
        name,
        strength: Math.floor(multiplier * strength),
        agility: Math.floor(multiplier * agility),
        wisdom: Math.floor(multiplier * wisdom),
        luck: Math.floor(multiplier * luck),
      }
    });
  }

  if (ancientForm && artifact?.ancientFormDescription === "The_artifact's_main_bonus_is_doubled!") {
    bonus *= 2;
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

const getNextTurkeyLevel = () => {

}