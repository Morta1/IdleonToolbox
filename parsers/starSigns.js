import { tryToParse } from "../utility/helpers";
import { constellations, mapNames, starSigns } from "../data/website-data";
import { starSignsIndicesMap } from "./parseMaps";

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
      starName: `${starSignsIndicesMap?.[starName]} - ${starName}`,
      unlocked: !!starSignsRaw?.[starName]
    }
  }, []);
  const sortAlphaNum = (a, b) => a.starName.localeCompare(b.starName, 'en', { numeric: true });
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

export const getStarSignBonus = (equippedStarSigns, starSignName, starEffect) => {
  const starSign = equippedStarSigns?.find(({ name }) => name === starSignName);
  if (!starSign) return 0;
  return starSign?.find(({ effect }) => effect === starEffect)?.bonus ?? 0;
}

export const getStarSignByEffect = (equippedStarSigns, starEffect) => {
  if (equippedStarSigns.length === 0) return 0;
  const allBonuses = equippedStarSigns.flatMap(({ bonuses }) => bonuses);
  return allBonuses?.reduce((sum, { effect, bonus }) => effect === starEffect ? sum + bonus : sum, 0);
}
