import type { IdleonData } from '../types';

import { riftInfo } from '@website-data';
import { saveField } from '@parsers/saveField';

export const getRift = (idleonData: IdleonData) => {
  const rawRift = saveField(idleonData, 'Rift') || (idleonData as any)?.Rift;
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
