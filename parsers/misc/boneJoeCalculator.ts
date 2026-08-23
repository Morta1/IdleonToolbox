import { monsters } from '@website-data';
import { getMonsterHpTotal } from '@parsers/damage';
import type { Account, Character } from '../types';

const BONE_JOE_PICKLE = 'BoneJoePickle';

// The game floors `pickleQuantity + 0.81` before raising 1.1 to it, so a whole number of pickles
// lands on itself and an empty inventory lands on 0.
const PICKLE_OFFSET = 0.81;
const PICKLE_HP_MULTI = 1.1;

export interface Miniboss {
  rawName: string;
  name: string;
  baseHp: number;
  respawnTime: number;
}

// CustomLists.NinjaInfo[30] - the only monster types the pickle multiplier applies to, in the
// order the hidden Deathnote page lists them (also the index into the Ninja[105] kill counts).
const MINIBOSS_TYPES = ['slimeB', 'poopBig', 'babayaga', 'babaHour', 'babaMummy', 'mini3a', 'mini4a', 'mini5a',
  'mini6a'];

// Built once: the catalog is static, and components lean on the identity staying stable so that a
// keystroke in the manual inputs cannot re-render the per character table.
const MINIBOSSES: Miniboss[] = MINIBOSS_TYPES.map((rawName) => {
  const monster: any = (monsters as Record<string, any>)?.[rawName];
  return {
    rawName,
    name: monster?.Name ?? rawName,
    baseHp: monster?.MonsterHPTotal ?? 0,
    respawnTime: monster?.RespawnTime ?? 0
  };
});

export const getMinibosses = (): Miniboss[] => MINIBOSSES;

// Big Brain Time, Midas Minded and Jawbreaker all curse "+{% Max HP for all monsters", and the game
// applies their sum to every monster definition on map load. Reusing getMonsterHpTotal against a
// base of 1 gives back that multiplier on its own.
export const getPrayerHpMulti = (character: Character, account: Account): number =>
  getMonsterHpTotal(1, character, account);

export const getMinibossHp = (baseHp: number, prayerHpMulti: number, pickles: number): number =>
  baseHp * prayerHpMulti * Math.pow(PICKLE_HP_MULTI, Math.floor(pickles + PICKLE_OFFSET));

export const getPickleCount = (character: Character): number =>
  (character as any)?.inventory?.reduce((sum: number, { rawName, amount }: any) =>
    rawName === BONE_JOE_PICKLE ? sum + amount : sum, 0) ?? 0;

// Each kill credits `pickles + 1` towards the miniboss' Deathnote count, which is the whole reason
// to carry them.
export const getKillCredit = (pickles: number): number => Math.floor(pickles + PICKLE_OFFSET + 1);

export const getHitsToKill = (hp: number, damage: number): number =>
  damage > 0 ? Math.ceil(hp / damage) : Infinity;

// Largest pickle count that still leaves the miniboss inside a single max hit. Below one shot the
// respawn timer stops being the limit and every extra pickle costs real fighting time, so this is
// the line worth knowing rather than a rule the game enforces. Returns -1 when even an empty
// inventory is out of reach.
export const getOneShotPickleCap = (maxDamage: number, baseHp: number, prayerHpMulti: number): number => {
  const hpAtZero = baseHp * prayerHpMulti;
  if (!(maxDamage > 0) || !(hpAtZero > 0)) return -1;
  if (maxDamage < hpAtZero) return -1;
  return Math.floor(Math.log(maxDamage / hpAtZero) / Math.log(PICKLE_HP_MULTI));
};
