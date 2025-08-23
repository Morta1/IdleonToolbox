import { tryToParse } from '../utility/helpers';
import { constellations, mapNames, starSigns } from '../data/website-data';
import { starSignsIndicesMap } from './parseMaps';
import { isRiftBonusUnlocked } from './world-4/rift';
import { getShinyBonus } from './breeding';
import { getPlayerLabChipBonus } from '@parsers/lab';
import { getTesseractBonus } from '@parsers/tesseract';

export const getStarSigns = (idleonData) => {
  const starSignsRaw = tryToParse(idleonData?.StarSg) || idleonData?.StarSignsUnlocked;
  return parseStarSigns(starSignsRaw);
}

export const getConstellations = (idleonData) => {
  const constellationsRaw = tryToParse(idleonData?.SSprog) || idleonData?.StarSignProg;
  const constellations = parseConstellations(constellationsRaw);
  return { constellations, rawConstellationsDone: constellationsRaw?.reduce((sum, [, done]) => sum + done, 0) }
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
  if (equippedStarSigns?.length === 0) return 0;
  const allBonuses = equippedStarSigns?.flatMap(({ bonuses }) => bonuses).filter((defined) => defined);
  return allBonuses?.reduce((sum, { effect, bonus }) => effect === starEffect ? sum + bonus : sum, 0);
}

export const getStarSignBonus = (character, account, effectName, forceNanoChip = false, forceAllWithEffect = false) => {
  const infiniteStarsUnlocked = isRiftBonusUnlocked(account?.rift, 'Infinite_Stars');
  const infiniteStars = infiniteStarsUnlocked ? 5 + getShinyBonus(account?.breeding?.pets, 'Infinite_Star_Signs') : 0;

  const starSigns = account?.starSigns?.map((starSign, index) => {
    let activeStar = character?.starSigns?.find(({ starName: sName }) => sName === starSign?.starName);
    const isInfiniteStar = index < infiniteStars;

    // Check if this star sign has the effect we're looking for (for forcing)
    const hasRequestedEffect = forceAllWithEffect &&
      starSign?.bonuses?.some(bonus =>
        bonus?.effect?.toLowerCase().includes(effectName.toLowerCase())
      );

    if (activeStar) {
      const silkroadNanochip = getPlayerLabChipBonus(character, account, 15);
      const chipMulti = silkroadNanochip || forceNanoChip ? 2 : 1;
      activeStar = {
        ...activeStar,
        bonuses: activeStar?.bonuses?.map((bonusObj) => ({
          ...bonusObj,
          bonus: bonusObj?.bonus > 0 ? bonusObj?.bonus * chipMulti : bonusObj?.bonus,
          active: true,
          isInfiniteStar
        }))
      }
    } else if (hasRequestedEffect && starSign?.unlocked) {
      // This star sign has the requested effect but isn't equipped - force it as active
      const silkroadNanochip = getPlayerLabChipBonus(character, account, 15);
      const chipMulti = silkroadNanochip || forceNanoChip ? 2 : 1;

      // Create a version of this star sign as if it was equipped
      activeStar = {
        ...starSign,
        bonuses: starSign?.bonuses?.map((bonusObj) => ({
          ...bonusObj,
          bonus: bonusObj?.bonus > 0 ? bonusObj?.bonus * chipMulti : bonusObj?.bonus,
          active: true,
          forcedByEffect: true
        }))
      };
    }

    if (infiniteStars && !activeStar && starSign?.unlocked) {
      starSign = {
        ...starSign,
        bonuses: starSign?.bonuses?.map((bonus) => ({
          ...bonus,
          isInfiniteStar,
          bonus: starSign?.starName === 'Gordonius_Major' && forceNanoChip ? bonus?.bonus * 2 : bonus?.bonus
        }))
      }
    }

    return activeStar ? activeStar : starSign;
  });

  const summoningLevel = character?.skillsInfo?.summoning?.level;
  const hasSeraphCosmos = starSigns.find(({ starName, unlocked }) => starName === 'Seraph_Cosmos' && unlocked);
  const starSignsBonuses = getStarSignsBonuses(starSigns);

  return starSignsBonuses?.reduce((sum, {
    effect,
    bonus,
    active,
    isInfiniteStar,
    forcedByEffect
  }) => {
    if (effect.toLowerCase().includes(effectName.toLowerCase()) &&
      (active || isInfiniteStar || forcedByEffect)) {
      const tesseractBonus = getTesseractBonus(account, 40)
      const calculatedBonus = hasSeraphCosmos
        ? bonus * Math.min(5, Math.pow(1.1 + Math.min(tesseractBonus, 10) / 100, Math.ceil((summoningLevel + 1) / 20)))
        : bonus;

      return sum + (isInfiniteStar && bonus < 0 ? 0 : calculatedBonus);
    }
    return sum;
  }, 0);
}

// export const getStarSignBonus = (character, account, effectName, forceNanoChip = false, forceStarSign) => {
//   const infiniteStarsUnlocked = isRiftBonusUnlocked(account?.rift, 'Infinite_Stars');
//   const infiniteStars = infiniteStarsUnlocked ? 5 + getShinyBonus(account?.breeding?.pets, 'Infinite_Star_Signs') : 0;
//   const starSigns = account?.starSigns?.map((starSign, index) => {
//     let activeStar = character?.starSigns?.find(({ starName: sName }) => sName === starSign?.starName);
//     const isInfiniteStar = index < infiniteStars;
//     if (activeStar) {
//       const silkroadNanochip = getPlayerLabChipBonus(character, account, 15);
//       const chipMulti = silkroadNanochip || forceNanoChip ? 2 : 1;
//       activeStar = {
//         ...activeStar,
//         bonuses: activeStar?.bonuses?.map((bonusObj) => ({
//           ...bonusObj,
//           bonus: bonusObj?.bonus > 0 ? bonusObj?.bonus * chipMulti : bonusObj?.bonus,
//           active: true,
//           isInfiniteStar
//         }))
//       }
//     }
//     if (infiniteStars && !activeStar && starSign?.unlocked) {
//       starSign = {
//         ...starSign,
//         bonuses: starSign?.bonuses?.map((bonus) => ({
//           ...bonus,
//           isInfiniteStar,
//           bonus: starSign?.starName === 'Gordonius_Major' && forceNanoChip ? bonus?.bonus * 2 : bonus?.bonus
//         }))
//       }
//     }
//     return activeStar ? activeStar : starSign;
//   });
//   const summoningLevel = character?.skillsInfo?.summoning?.level;
//   const hasSeraphCosmos = starSigns.find(({ starName, unlocked }) => starName === 'Seraph_Cosmos' && unlocked);
//   const starSignsBonuses = getStarSignsBonuses(starSigns);
//   return starSignsBonuses?.reduce((sum, {
//     effect,
//     bonus,
//     active,
//     isInfiniteStar
//   }) => {
//     if (effect.toLowerCase().includes(effectName.toLowerCase()) && (active || isInfiniteStar || forceStarSign)) {
//       const calculatedBonus = hasSeraphCosmos
//         ? bonus * Math.min(3, Math.pow(1.1, Math.ceil((summoningLevel + 1) / 20)))
//         : bonus;
//       return sum + (isInfiniteStar && bonus < 0 ? 0 : calculatedBonus);
//     }
//     return sum;
//   }, 0);
// }

export const getStarSignsBonuses = (starSigns) => {
  return starSigns?.map(({ bonuses }) => bonuses)
    .flatMap((arr) => arr)
    .filter((arr) => arr)
}

export const calcTotalConstellations = (constellations) => {
  return constellations?.reduce((sum, { done }) => done ? sum + 1 : sum, 0);
}