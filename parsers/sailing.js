import { lavaLog, tryToParse } from "../utility/helpers";
import { artifacts, captainsBonuses } from "../data/website-data";
import { getHighestLevelCharacter } from "./misc";

export const getSailing = (idleonData, charactersData, account) => {
  const sailingRaw = tryToParse(idleonData?.Sailing) || idleonData?.Sailing;
  const captainsRaw = tryToParse(idleonData?.Captains) || idleonData?.Captains
  const boatsRaw = tryToParse(idleonData?.Boats) || idleonData?.Boats
  return parseSailing(sailingRaw, captainsRaw, boatsRaw, charactersData, account);
}

const parseSailing = (sailingRaw, captainsRaw, boatsRaw, charactersData, account) => {
  const acquiredArtifacts = sailingRaw?.[3];
  const lootPile = sailingRaw?.[1];
  const artifactsList = artifacts?.map((artifact, index) => getArtifact(artifact, acquiredArtifacts?.[index], lootPile, index, charactersData, account))
  const maxChests = Math.min(Math.round(5 + (account?.gemShopPurchases?.find((value, index) => index === 129) ?? 0)), 19);
  return {
    maxChests,
    artifacts: artifactsList,
    lootPile: getLootPile(lootPile),
    ...getCaptainsAndBoats(sailingRaw, captainsRaw, boatsRaw)
  };
}

const getCaptainsAndBoats = (sailingRaw, captainsRaw, boatsRaw) => {
  const captainsUnlocked = sailingRaw?.[2]?.[0] || 0;
  const boatsUnlocked = sailingRaw?.[2]?.[1] || 0;
  const captains = captainsRaw?.slice(0, captainsUnlocked + 1).map(([_, bonusIndex]) => ({
    bonus: captainsBonuses?.[bonusIndex],
  }));
  const boats = boatsRaw?.slice(0, boatsUnlocked + 1);
  return {
    captains,
    boats
  }
}

const getLootPile = (lootPile) => {
  return lootPile?.map((item, index) => ({
    amount: item > 0 ? item : 0,
    rawName: `SailT${index}`
  }))
}

const getArtifact = (artifact, acquired, lootPile, index, charactersData, account) => {
  let additionalData;
  let fixedDescription = artifact?.description?.replace(/{/, artifact?.baseBonus).replace(/@/, '');
  if (artifact?.name === 'Maneki_Kat' || artifact?.name === 'Ashen_Urn') {
    const highestLevel = getHighestLevelCharacter(charactersData)
    additionalData = `Highest level: ${highestLevel}`;
    fixedDescription = fixedDescription.replace(/}/, highestLevel * artifact?.baseBonus);
  } else if (artifact?.name === 'Ruble_Cuble' || artifact?.name === '10_AD_Tablet' || artifact?.name === 'Jade_Rock' || artifact?.name === 'Gummy_Orb') {
    const lootedItems = account?.looty?.rawLootedItems;
    const isAdTablet = artifact?.name === '10_AD_Tablet';
    additionalData = `Looted items: ${lootedItems}`;
    const math = (lootedItems - 500) / 10;
    fixedDescription = fixedDescription.replace(/}/, isAdTablet ? artifact?.baseBonus * math : math);
  } else if (artifact?.name === 'Fauxory_Tusk' || artifact?.name === 'Genie_Lamp') {
    const sailingLevel = charactersData?.[1]?.skillsInfo?.sailing?.level || 0;
    const isGenie = artifact?.name === 'Genie_Lamp';
    additionalData = `Sailing level: ${sailingLevel}`;
    fixedDescription = fixedDescription.replace(/}/, isGenie ? sailingLevel * artifact?.baseBonus : sailingLevel);
  } else if (artifact?.name === 'Weatherbook') {
    const gamingLevel = charactersData?.[1]?.skillsInfo?.gaming?.level || 0;
    additionalData = `Gaming level: ${gamingLevel}`;
    fixedDescription = fixedDescription.replace(/}/, gamingLevel * artifact?.baseBonus);
  } else if (artifact?.name === 'Triagulon') {
    const ownedTurkey = account?.cooking?.meals?.[0]?.amount;
    fixedDescription = fixedDescription.replace(/}/, (artifact?.baseBonus * lavaLog(ownedTurkey)).toFixed(2));
  } else if (artifact?.name === 'Opera_Mask') {
    const sailingGold = lootPile?.[0];
    fixedDescription = fixedDescription.replace(/}/, (artifact?.baseBonus * lavaLog(sailingGold)).toFixed(2));
  }

  return {
    ...artifact,
    description: fixedDescription,
    additionalData,
    acquired,
    rawName: `Arti${index}`
  }
}