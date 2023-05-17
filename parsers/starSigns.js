import { tryToParse } from "../utility/helpers";
import { constellations, mapNames, starSigns } from "../data/website-data";
import { starSignsIndicesMap } from "./parseMaps";
import { isRiftBonusUnlocked } from "./world-4/rift";
import { getShinyBonus } from "./breeding";

export const getStarSigns = (idleonData) => {
  const starSignsRaw = tryToParse(idleonData?.StarSg) || idleonData?.StarSignsUnlocked;
  return parseStarSigns(starSignsRaw);
}

export const getConstellations = (idleonData) => {
  const constellationsRaw = tryToParse(idleonData?.SSprog) || idleonData?.StarSignProg;
  return parseConstellations(constellationsRaw);
}

export const parseStarSigns = (starSignsRaw) => {
  const starSignsMapping = starSigns?.map((starSign) => {
    const { starName } = starSign;
    return {
      ...starSign,
      indexedStarName: `${starSignsIndicesMap?.[starName]} - ${starName}`,
      starName,
      unlocked: !!starSignsRaw?.[starName]
    }
  }, []);
  const sortAlphaNum = (a, b) => a.indexedStarName.localeCompare(b.indexedStarName, 'en', { numeric: true });
  const sortedSigns = starSignsMapping.sort(sortAlphaNum);
  const lastItem = sortedSigns.pop();
  sortedSigns.splice(21, 0, lastItem);
  return sortedSigns;
}

export const parseConstellations = (constellationsRaw) => {
  return constellationsRaw?.reduce((res, constellation, index) => {
    const constellationInfo = constellations[index];
    const [completedChars, done] = constellation;
    const mapIndex = constellationInfo?.mapIndex;
    return mapIndex !== null ? [...res, {
      ...constellationInfo,
      location: mapNames[mapIndex],
      completedChars,
      done: !!done
    }] : res;
  }, []);
}

export const getStarSignBonus = (equippedStarSigns, starSignName, starEffect, account, playerId) => {
  const infiniteStarsUnlocked = isRiftBonusUnlocked(account?.rift, 'Infinite_Stars');
  const infiniteStars = infiniteStarsUnlocked ? 5 + getShinyBonus(account?.breeding?.pets, 'Infinite_Star_Signs') : 0;
  let starSignIndex, bonuses = [], chipMulti = 1;

  starSignIndex = equippedStarSigns?.findIndex(({ starName }) => starName === starSignName);
  if (starSignIndex !== -1) {
    bonuses = equippedStarSigns?.[starSignIndex];
    const silkroadNanochip = account?.lab?.playersChips?.[playerId]?.find((chip) => chip.index === 15) ?? 0;
    chipMulti = silkroadNanochip ? 2 : 1
  }

  if (infiniteStars) {
    starSignIndex = account?.starSigns?.findIndex(({ starName }, index) => starName === starSignName && index < infiniteStars);
    bonuses = account?.starSigns?.[starSignIndex]?.bonuses;
  }
  if (!bonuses || !bonuses?.length) return 0;
  return (bonuses?.find(({ effect }) => effect === starEffect)?.bonus ?? 0) * chipMulti;
}

export const getStarSignByEffect = (equippedStarSigns, starEffect) => {
  if (equippedStarSigns.length === 0) return 0;
  const allBonuses = equippedStarSigns.flatMap(({ bonuses }) => bonuses);
  return allBonuses?.reduce((sum, { effect, bonus }) => effect === starEffect ? sum + bonus : sum, 0);
}
