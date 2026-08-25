import { monsters } from '@website-data';
import { getMonsterHpTotal } from '@parsers/damage';
import { getTalentBonus } from '@parsers/talents';
import { growth } from '@utility/helpers';
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

// The game walks the whole inventory but assigns rather than adds, so the last slot holding pickles
// is the one that counts. Quest items share a single unlimited stack, so this only ever differs from
// a sum in a save that somehow split them.
export const getPickleCount = (character: Character): number =>
  (character as any)?.inventory?.reduce((last: number, { rawName, amount }: any) =>
    rawName === BONE_JOE_PICKLE ? amount : last, 0) ?? 0;

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

// Mega Crit is all that crit chance past 100% buys. The game rolls once against crit chance, and
// on a hit rolls again against the surplus: clearing both swaps the multiplier for
// `critDamage + clamp(megaCritBonus, 2, 6)`. Both rolls are uniform over 0 to 100, so anything at or
// over 200% crit chance mega crits every swing. Unlearned, the surplus is dead weight.
// The floor is the game's, kept for fidelity though the curve opens at 2x and only climbs.
const MEGA_CRIT_MIN = 2;
const MEGA_CRIT_MAX = 6;

// getTalentBonus still prices the growth curve at level 0, where this one already reads 200, so the
// talent has to be checked for a level rather than for a bonus. The game gates on the same thing.
const getMegaCritBonus = (character?: Character): number => {
  const talent = ((character as any)?.flatStarTalents as any[])?.find(({ name }: any) => name === 'MEGA_CRIT');
  if (!(talent?.level > 0)) return 0;
  const bonus = getTalentBonus((character as any)?.flatStarTalents, 'MEGA_CRIT', true) / 100;
  return Math.max(MEGA_CRIT_MIN, Math.min(MEGA_CRIT_MAX, bonus));
};

// What actually chews through a miniboss' HP bar: the min-max average lifted by the crit multiplier
// the swing expects to roll. Deliberately not the shape getKillsPerHour uses, which mirrors the
// game's own AFK approximation and multiplies straight by an unclamped crit chance, badly
// overpricing a live fight. Skill multipliers still sit on top of this, so the hit count it feeds is
// the basic attack worst case rather than a real fight.
export const getEffectiveDamage = (playerInfo: any, character?: Character): number => {
  const maxDamage = playerInfo?.maxDamage ?? 0;
  const minDamage = playerInfo?.minDamage ?? 0;
  const critChance = playerInfo?.critChance ?? 0;
  const critDamage = playerInfo?.critDamage ?? 1;
  const critRate = Math.min(critChance, 100) / 100;
  const megaCritBonus = getMegaCritBonus(character);
  const megaCritRate = megaCritBonus > 0 ? Math.min(Math.max(critChance - 100, 0), 100) / 100 : 0;
  return ((minDamage + maxDamage) / 2)
    * (1 + critRate * (critDamage - 1) + critRate * megaCritRate * megaCritBonus);
};

// An attack's damage multiplier is simply its own talent value: the game pushes
// `GetTalentNumber(1, attackId) / 100` into the damage pixel the swing creates. Nothing in the data
// marks a talent as an attack, so they are spotted by the damage phrasing every one of them shares.
// Blocking and buff talents word it differently ("Block {% of all damage", "boosts base STR by {")
// and stay out.
const ATTACK_DESCRIPTION = /\{%[_|](damage|dmg)/i;

export interface StrongestAttack {
  name: string;
  multi: number;
  count: number;
}

// The upper bound on a hit: the hardest attack in the loadout, priced as if every swing were that
// one. A real rotation cycles weaker attacks and fills cooldown gaps with basic swings, so it can
// only land between this and the basic attack count, which is exactly why both are shown. Weighting
// the attacks into a single average was tried and dropped: the mix depends on cast time, mana and
// targeting, none of which is in the data, so the average claimed a precision nothing backs.
export const getStrongestAttack = (character?: Character): StrongestAttack | null => {
  const attacks = (((character as any)?.talentsLoadout as any[]) ?? []).reduce((res: any[], talent: any) => {
    if (!talent?.name || !ATTACK_DESCRIPTION.test(talent?.description ?? '')) return res;
    const multi = (growth(talent?.funcX, talent?.level, talent?.x1, talent?.x2, false) ?? 0) / 100;
    return multi > 0 ? [...res, { name: talent?.name, multi }] : res;
  }, []);
  if (!attacks.length) return null;

  const best = attacks.reduce((res: any, attack: any) => attack.multi > res.multi ? attack : res);
  return { name: best.name, multi: best.multi, count: attacks.length };
};

// The best case hit, against getEffectiveDamage's worst case. The pair brackets a real fight.
export const getSkillDamage = (playerInfo: any, character?: Character): number =>
  getEffectiveDamage(playerInfo, character) * Math.max(getStrongestAttack(character)?.multi ?? 1, 1);
