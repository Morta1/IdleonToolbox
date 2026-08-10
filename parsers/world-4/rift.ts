import type { IdleonData } from '../types';
import { tryToParse } from '@utility/helpers';
import { riftInfo } from '@website-data';
import { constructionMasteryThresholds } from '@parsers/world-3/construction';

export const getRift = (idleonData: IdleonData) => {
  const rawRift = tryToParse(idleonData?.Rift) || (idleonData as any)?.Rift;
  return parseRift(rawRift);
}

const parseRift = (rawRift: any) => {
  const [currentRift, currentProgress, chars] = rawRift || [];
  return {
    list: riftInfo,
    // parseInt(undefined) is NaN with no save; 0 rifts entered is the correct neutral default (the
    // breeding.ts cross-section guard already assumed this exact fallback for the same field).
    currentRift: parseInt(currentRift) || 0,
    currentProgress,
    chars
  }
}

export const isRiftBonusUnlocked = (rift: any, bonusName: string) => {
  return rift?.list?.find(({ riftBonus }: any, index: number) => {
    return riftBonus === bonusName && index <= rift?.currentRift
  });
}

export const getConstructMastery = (totalLevels: number, type: string) => {
  if (type === 'Ref Spd') {
    return totalLevels >= constructionMasteryThresholds?.[0] ? Math.floor(totalLevels / 10) : 0;
  } else if (type === 'Dmg') {
    return totalLevels >= constructionMasteryThresholds?.[2]
      ? 2 * Math.floor((totalLevels - constructionMasteryThresholds?.[2]) / 10)
      : 0;
  } else if (type === 'Build Spd') {
    return totalLevels >= constructionMasteryThresholds?.[4]
      ? 5 * Math.floor((totalLevels - constructionMasteryThresholds?.[4]) / 10)
      : 0;
  }
  return 0;
}
