import { tryToParse } from '@utility/helpers';
import { bribes } from '@website-data';
import { OPT } from '@parsers/accountOptions';
import type { IdleonData } from '../types';

// game: BribeStatus -1 = its set isn't unlocked yet, 0 = can be bought, 1 = bought
export type BribeState = 'locked' | 'available' | 'bought';

export interface Bribe {
  name: string;
  value: number;
  done: boolean;
  state: BribeState;
  [key: string]: unknown;
}

const EXPANSION = 'BribeExpansion';
// game: a price of 99999999 marks a bribe coins alone never buy; the shop lets two of them through on another unlock
const NOT_FOR_COINS = 99999999;
const ART_OF_THE_BAIL = 26;
const ART_OF_THE_GRAIL = 33;

export const getBribes = (idleonData: IdleonData): Bribe[] | undefined => {
  const bribesRaw = idleonData?.BribeStatus || tryToParse(idleonData?.BribeStatus);
  return parseBribes(bribesRaw);
}

const toState = (status: unknown): BribeState => status === 1 ? 'bought' : status === 0 ? 'available' : 'locked';

const parseBribes = (bribesRaw: any): Bribe[] | undefined => {
  return bribes?.map((bribe, index) => {
    const bribeStatus = bribesRaw?.[index];
    return {
      ...bribe,
      done: bribeStatus === 1,
      state: toState(bribeStatus)
    };
  });
}

export const getBribeBonus = (bribes: Bribe[] | undefined, bribeName: string): number => {
  return bribes?.find(({ name, done }) => name === bribeName && done)?.value ?? 0;
}

export interface BribeSet {
  // needs: what the game asks for besides coins; notForSale: no unlock sells it, so its price means nothing
  bribes: (Bribe & { index: number, needs?: string, notForSale?: boolean })[];
  // The bribe that unlocked this set; none for the first
  unlockedBy?: string;
  // Coins still to spend on this set's bribes that are for sale now
  costLeft: number;
}

// What a bribe needs besides coins, when its shop slot is open but the game won't sell it yet
const getBribeNeeds = (account: any, index: number, price: number): string | undefined => {
  if (price !== NOT_FOR_COINS) return undefined;
  if (index === ART_OF_THE_BAIL) {
    return account?.accountOptions?.[OPT.trashIslandBribeUnlock] === 1 ? undefined : 'A Garbage Tuna reward on Trash Island (World 2)';
  }
  if (index === ART_OF_THE_GRAIL) {
    // sneaking's isJadeBonusUnlocked, read here: sneaking imports islands, which imports this file
    const newBribes = account?.sneaking?.jadeEmporium?.find(({ name }: any) => name === 'New_Bribes')?.unlocked;
    return newBribes ? undefined : 'The New Bribes upgrade from the Jade Emporium (World 6)';
  }
  return undefined;
}

// A set runs up to and including its expansion bribe, which opens the next set
export const getBribeSets = (account: any, list: Bribe[] = account?.bribes ?? []): BribeSet[] => {
  const sets: BribeSet[] = [];
  let current: BribeSet = { bribes: [], costLeft: 0 };
  list.forEach((bribe, index) => {
    const price = Number(bribe?.price) || 0;
    const notForSale = price === NOT_FOR_COINS && index !== ART_OF_THE_BAIL && index !== ART_OF_THE_GRAIL;
    const needs = bribe.state === 'bought' ? undefined : getBribeNeeds(account, index, price);
    current.bribes.push({ ...bribe, index, ...(needs ? { needs } : {}), ...(notForSale ? { notForSale } : {}) });
    if (bribe.state === 'available' && !needs && !notForSale) current.costLeft += price;
    if (bribe?.effectName === EXPANSION) {
      sets.push(current);
      current = { bribes: [], costLeft: 0, unlockedBy: bribe.name };
    }
  });
  if (current.bribes.length) sets.push(current);
  return sets;
}
