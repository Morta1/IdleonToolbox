import type { IdleonData } from '../types';
import { tryToParse } from '@utility/helpers';
import { riftInfo } from '@website-data';

export const getRift = (idleonData: IdleonData) => {
  const rawRift = tryToParse(idleonData?.Rift) || (idleonData as any)?.Rift;
  return parseRift(rawRift);
}

const parseRift = (rawRift: any) => {
  const [currentRift, currentProgress, chars] = rawRift || [];
  return {
    list: riftInfo,
    currentRift: parseInt(currentRift) || 0,
    currentProgress: currentProgress ?? 0,
    chars
  }
}

export const isRiftBonusUnlocked = (rift: any, bonusName: string) => {
  return rift?.list?.find(({ riftBonus }: any, index: number) => {
    return riftBonus === bonusName && index <= rift?.currentRift
  });
}
