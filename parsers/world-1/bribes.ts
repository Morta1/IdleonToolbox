import { tryToParse } from '@utility/helpers';
import { bribes } from '@website-data';
import type { IdleonData } from '../types';

export interface Bribe {
  name: string;
  value: number;
  done: boolean;
  [key: string]: unknown;
}

export const getBribes = (idleonData: IdleonData): Bribe[] | undefined => {
  const bribesRaw = idleonData?.BribeStatus || tryToParse(idleonData?.BribeStatus);
  return parseBribes(bribesRaw);
}

const parseBribes = (bribesRaw: any): Bribe[] | undefined => {
  return bribes?.map((bribe, index) => {
    const bribeStatus = bribesRaw?.[index];
    return {
      ...bribe,
      done: bribeStatus === 1
    };
  });
}

export const getBribeBonus = (bribes: Bribe[] | undefined, bribeName: string): number => {
  return bribes?.find(({ name, done }) => name === bribeName && done)?.value ?? 0;
}
