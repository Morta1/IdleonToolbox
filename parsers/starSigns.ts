import { tryToParse } from '@utility/helpers';
import { constellations, mapNames, starSigns } from '@website-data';
import { starSignsIndicesMap } from './parseMaps';
import { isRiftBonusUnlocked } from './world-4/rift';
import { getShinyBonus } from './world-4/breeding';
import { getPlayerLabChipBonus } from '@parsers/world-4/lab';
import { getTesseractBonus } from '@parsers/class-specific/tesseract';
import { getMeritocracyBonus } from '@parsers/world-2/voteBallot';
import type { IdleonData, Account, Character } from './types';

export const getStarSigns = (idleonData: IdleonData, account: Account): any[] | undefined => {
  const starSignsRaw = tryToParse(idleonData?.StarSg) || idleonData?.StarSignsUnlocked;
  return parseStarSigns(starSignsRaw, account);
}

export const getConstellations = (idleonData: IdleonData): { constellations: any[]; rawConstellationsDone: number } => {
  const constellationsRaw = tryToParse(idleonData?.SSprog) || idleonData?.StarSignProg;
  const constellationsParsed = parseConstellations(constellationsRaw);
  return { constellations: constellationsParsed, rawConstellationsDone: constellationsRaw?.reduce((sum: number, [, done]: [any, number]) => sum + done, 0) }
}

export const parseStarSigns = (starSignsRaw: any, account: Account): any[] | undefined => {
  const infiniteStarsUnlocked = isRiftBonusUnlocked((account as any)?.rift, 'Infinite_Stars');
  const infiniteStars = infiniteStarsUnlocked ? 5 + getShinyBonus((account as any)?.breeding?.pets, 'Infinite_Star_Signs') : 0;
  return starSigns?.map((starSign: any, index: number) => {
    const { starName } = starSign;
    const isInfiniteStar = index < infiniteStars && !!starSignsRaw?.[starName];
    return {
      ...starSign,
      indexedStarName: `${(starSignsIndicesMap as any)?.[starName]} - ${starName}`,
      starName,
      unlocked: !!starSignsRaw?.[starName],
      isInfiniteStar
    }
  }, []);
}

export const parseConstellations = (constellationsRaw: any[]): any[] => {
  // Static constellations have rawIndex matching their position in the game's StarQuests array.
  // Raw save data has one entry per StarQuest slot (including unused placeholders).
  const constellationsByRawIndex = new Map(
    constellations?.map((c: any) => [c.rawIndex ?? c.mapIndex, c])
  );
  return constellationsRaw?.reduce((res: any[], constellation: any, index: number) => {
    const constellationInfo = constellationsByRawIndex.get(index);
    if (!constellationInfo) return res;
    const [completedChars, done] = constellation;
    const mapIndex = constellationInfo?.mapIndex;
    return mapIndex != null ? [...res, {
      ...constellationInfo,
      location: mapNames[mapIndex],
      completedChars,
      done: !!done
    }] : res;
  }, []);
}

export const getStarSignByEffect = (equippedStarSigns: any[], starEffect: string, _unused2?: any): number => {
  if (equippedStarSigns?.length === 0) return 0;
  const allBonuses = equippedStarSigns?.flatMap(({ bonuses }: any) => bonuses).filter((defined: any) => defined);
  return allBonuses?.reduce((sum: number, { effect, bonus }: { effect: string; bonus: number }) => effect === starEffect ? sum + bonus : sum, 0);
}

export const getStarSignBonus = (character: Character, account: Account, effectName: string, forceNanoChip: boolean = false, forceAllWithEffect: boolean = false): number => {
  const infiniteStarsUnlocked = isRiftBonusUnlocked((account as any)?.rift, 'Infinite_Stars');
  const infiniteStars = infiniteStarsUnlocked ? 5 + getShinyBonus((account as any)?.breeding?.pets, 'Infinite_Star_Signs') : 0;

  const starSignsList = (account as any)?.starSigns?.map((starSign: any, index: number) => {
    let activeStar = (character as any)?.starSigns?.find(({ starName: sName }: any) => sName === starSign?.starName);
    const isInfiniteStar = index < infiniteStars;

    // Check if this star sign has the effect we're looking for (for forcing)
    const hasRequestedEffect = forceAllWithEffect &&
      starSign?.bonuses?.some((bonus: any) =>
        bonus?.effect?.toLowerCase().includes(effectName.toLowerCase())
      );

    if (activeStar) {
      const silkroadNanochip = getPlayerLabChipBonus(character, account, 15);
      const chipMulti = silkroadNanochip || forceNanoChip ? 2 : 1;
      activeStar = {
        ...activeStar,
        bonuses: activeStar?.bonuses?.map((bonusObj: any) => ({
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
        bonuses: starSign?.bonuses?.map((bonusObj: any) => ({
          ...bonusObj,
          bonus: bonusObj?.bonus > 0 ? bonusObj?.bonus * chipMulti : bonusObj?.bonus,
          active: true,
          forcedByEffect: true
        }))
      };
    }

    if (infiniteStars && !activeStar && starSign?.unlocked) {
      const silkroadNanochip = getPlayerLabChipBonus(character, account, 15);
      const chipMulti = silkroadNanochip || forceNanoChip ? 2 : 1;
      starSign = {
        ...starSign,
        bonuses: starSign?.bonuses?.map((bonus: any) => ({
          ...bonus,
          isInfiniteStar,
          bonus: bonus?.bonus > 0 ? bonus?.bonus * chipMulti : bonus?.bonus
        }))
      }
    }

    return activeStar ? activeStar : starSign;
  });

  const summoningLevel = (character as any)?.skillsInfo?.summoning?.level;
  const hasSeraphCosmos = starSignsList.find(({ starName, unlocked }: any) => starName === 'Seraph_Cosmos' && unlocked);
  const starSignsBonuses = getStarSignsBonuses(starSignsList);

  return starSignsBonuses?.reduce((sum: number, {
    effect,
    bonus,
    active,
    isInfiniteStar,
    forcedByEffect
  }: { effect: string; bonus: number; active?: boolean; isInfiniteStar?: boolean; forcedByEffect?: boolean }) => {
    if (effect.toLowerCase().includes(effectName.toLowerCase()) &&
      (active || isInfiniteStar || forcedByEffect)) {
      const tesseractBonus = getTesseractBonus(account, 40);
      const meritocracyBonus = getMeritocracyBonus(account, 22);
      const calculatedBonus = hasSeraphCosmos
        ? bonus * (1 + meritocracyBonus / 100) * Math.min(5, Math.pow(1.1 + Math.min(tesseractBonus, 10) / 100, Math.ceil((summoningLevel + 1) / 20)))
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

export const getStarSignsBonuses = (starSigns: any[]): any[] => {
  return starSigns?.map(({ bonuses }: any) => bonuses)
    .flatMap((arr: any) => arr)
    .filter((arr: any) => arr)
}

export const calcTotalConstellations = (constellations: any[]): number => {
  return constellations?.reduce((sum: number, { done }: { done: boolean }) => done ? sum + 1 : sum, 0);
}
