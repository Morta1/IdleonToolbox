import { tryToParse } from '../utility/helpers';
import { constellations, mapNames, starSigns } from '../data/website-data';
import { starSignsIndicesMap } from './parseMaps';
import { isRiftBonusUnlocked } from './world-4/rift';
import { getShinyBonus } from './breeding';

export const getStarSigns = (idleonData) => {
  const starSignsRaw = tryToParse(idleonData?.StarSg) || idleonData?.StarSignsUnlocked;
  return parseStarSigns(starSignsRaw);
}

export const getConstellations = (idleonData) => {
  const constellationsRaw = tryToParse(idleonData?.SSprog) || idleonData?.StarSignProg;
  return parseConstellations(constellationsRaw);
}

export const parseStarSigns = (starSignsRaw) => {
  return starSigns?.map((starSign) => {
    const { starName } = starSign;
    return {
      ...starSign,
      indexedStarName: `${starSignsIndicesMap?.[starName]} - ${starName}`,
      starName,
      unlocked: !!starSignsRaw?.[starName]
    }
  }, []);
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

export const getStarSignByEffect = (equippedStarSigns, starEffect) => {
  if (equippedStarSigns.length === 0) return 0;
  const allBonuses = equippedStarSigns.flatMap(({ bonuses }) => bonuses).filter((defined) => defined);
  return allBonuses?.reduce((sum, { effect, bonus }) => effect === starEffect ? sum + bonus : sum, 0);
}

export const getStarSignBonus = (character, account, effectName) => {
  const infiniteStarsUnlocked = isRiftBonusUnlocked(account?.rift, 'Infinite_Stars');
  const infiniteStars = infiniteStarsUnlocked ? 5 + getShinyBonus(account?.breeding?.pets, 'Infinite_Star_Signs') : 0;
  const starSigns = account?.starSigns?.map((starSign, index) => {
    let activeStar = character?.starSigns?.find(({ starName: sName }) => sName === starSign?.starName);
    const isInfiniteStar = index < infiniteStars;
    if (activeStar) {
      const silkroadNanochip = account?.lab?.playersChips?.[character?.playerId]?.find((chip) => chip.index === 15) ?? 0;
      const chipMulti = silkroadNanochip ? 2 : 1;
      activeStar = {
        ...activeStar,
        bonuses: activeStar?.bonuses?.map((bonusObj) => ({
          ...bonusObj,
          bonus: bonusObj?.bonus > 0 ? bonusObj?.bonus * chipMulti : bonusObj?.bonus,
          active: true,
          isInfiniteStar
        }))
      }
    }
    if (infiniteStars && !activeStar) {
      starSign = { ...starSign, bonuses: starSign?.bonuses?.map((bonus) => ({ ...bonus, isInfiniteStar })) }
    }
    return activeStar ? activeStar : starSign;
  });

  const starSignsBonuses = getStarSignsBonuses(starSigns);
  return starSignsBonuses?.reduce((sum, {
    effect,
    bonus,
    active,
    isInfiniteStar
  }) => effect.includes(effectName) && (active || isInfiniteStar)
    ? sum + (isInfiniteStar && bonus < 0 ? 0 : bonus)
    : sum, 0);
}

export const getStarSignsBonuses = (starSigns) => {
  return starSigns?.map(({ bonuses }) => bonuses)
    .flatMap((arr) => arr)
    .filter((arr) => arr)
}