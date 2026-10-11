import { tryToParse } from '@utility/helpers';
import { constellations, mapNames, starSigns } from '@website-data';
import { liveEntries } from '@parsers/catalog';
import { starSignsIndicesMap } from './parseMaps';
import { isRiftBonusUnlocked } from './world-4/rift';
import { getShinyBonus } from './world-4/breeding';
import { getPlayerLabChipBonus } from '@parsers/world-4/lab';
import { getTesseractBonus } from '@parsers/class-specific/tesseract';
import { getMeritocracyBonus } from '@parsers/world-2/voteBallot';
import type { IdleonData, Account, Character } from './types';

const SILKRODE_NANOCHIP_INDEX = 15;
// Mr No Sleep's "-6% AFK Gain" lowers both the FightAFK and the SkillAFK game keys
const SHARED_EFFECTS: Record<string, string[]> = { AFK_Gain: ['Fight_AFK_Gain', 'Skill_AFK_Gain'] };

export const getStarSigns = (idleonData: IdleonData, account: Account): any[] | undefined => {
  const starSignsRaw = tryToParse(idleonData?.StarSg) || idleonData?.StarSignsUnlocked;
  return parseStarSigns(starSignsRaw, account);
}

export const getConstellations = (idleonData: IdleonData): { constellations: any[]; rawConstellationsDone: number } => {
  const constellationsRaw = tryToParse(idleonData?.SSprog) || idleonData?.StarSignProg;
  const constellationsParsed = parseConstellations(constellationsRaw);
  return {
    constellations: constellationsParsed ?? [],
    rawConstellationsDone: constellationsRaw?.reduce((sum: number, [, done]: [any, number]) => sum + done, 0) ?? 0
  }
}

// game RiftStuff("enabledStarSigns"): once Infinite Stars is unlocked, the first N catalog signs count as
// equipped on every character (0 before it)
export const getInfiniteStarsCount = (account: Account): number => {
  return isRiftBonusUnlocked((account as any)?.rift, 'Infinite_Stars')
    ? 5 + getShinyBonus((account as any)?.breeding?.pets, 'Infinite_Star_Signs')
    : 0;
}

export const parseStarSigns = (starSignsRaw: any, account: Account): any[] | undefined => {
  const infiniteStars = getInfiniteStarsCount(account);
  return liveEntries<any>(starSigns).map(({ entry: starSign, index }) => {
    const { starName } = starSign;
    const isInfiniteStar = index < infiniteStars && !!starSignsRaw?.[starName];
    return {
      ...starSign,
      indexedStarName: `${(starSignsIndicesMap as any)?.[starName]} - ${starName}`,
      starName,
      unlocked: !!starSignsRaw?.[starName],
      isInfiniteStar
    }
  });
}

export const parseConstellations = (constellationsRaw: any[]): any[] => {
  return constellations
    .filter(({ mapIndex }: any) => mapIndex != null)
    .map((constellationInfo: any) => {
      const rawIndex = constellationInfo.rawIndex ?? constellationInfo.mapIndex;
      const [completedChars = '', done = 0] = constellationsRaw?.[rawIndex] ?? [];
      return {
        ...constellationInfo,
        location: mapNames[constellationInfo.mapIndex],
        completedChars,
        done: !!done
      };
    });
}

export const getStarSignByEffect = (equippedStarSigns: any[], starEffect: string, _unused2?: any): number => {
  if (equippedStarSigns?.length === 0) return 0;
  const allBonuses = equippedStarSigns?.flatMap(({ bonuses }: any) => bonuses).filter((defined: any) => defined);
  return allBonuses?.reduce((sum: number, { effect, bonus }: { effect: string; bonus: number }) => effect === starEffect ? sum + bonus : sum, 0);
}

// game StarSigns(): DNSM.StarSigns is built for ONE character, the one playing: its equipped signs (plus the
// Infinite Stars), its Silkrode chip and its summoning level (Seraph Cosmos). Account-wide terms
// (breedability, cooking speed, artifact find, OG chance, sailing speed...) therefore pass the logged-in
// character, getBestActiveCharacter(characters), never the best value over all characters.
// The game sums each stat key over the counted signs, then:
// - Silkrode chip WITHOUT Infinite Stars: a second pass adds the equipped signs again, and every key that was
//   negative after the first pass is put back, so a positive key doubles and a negative one does not.
// - Silkrode chip WITH Infinite Stars: no second pass; the chip is a x2 inside the Seraph Cosmos multiplier
//   only, so without Seraph Cosmos it does nothing.
// - Seraph Cosmos multiplies positive keys only: chip x2 (Infinite Stars only) x (1 + Meritocracy 22 / 100)
//   x min(5, (1.1 + min(Tesseract 40, 10) / 100) ^ ceil((summoning level + 1) / 20)).
// - An Infinite Star never applies its negative bonuses; the Major signs need a class level.
// effectName is matched by substring and stands for ONE game key; the key rules run on the matched total.
// forceAllWithEffect is a what-if ceiling, never a game value: every unlocked sign with the effect counts as
// equipped, the chip counts if any character (or storage) holds it, and the summoning level is the highest.
export const getStarSignBonus = (character: Character, account: Account, effectName: string, forceNanoChip: boolean = false, forceAllWithEffect: boolean = false): number => {
  const infiniteStars = getInfiniteStarsCount(account);
  const hasChip = forceNanoChip || (forceAllWithEffect
    ? !!(account as any)?.lab?.playersChips?.flat()?.concat((account as any)?.lab?.chips)
      ?.some((chip: any) => chip?.name === 'Silkrode_Nanochip')
    : getPlayerLabChipBonus(character, account, SILKRODE_NANOCHIP_INDEX) > 0);
  const equippedNames = new Set((character as any)?.starSigns?.map(({ starName }: any) => starName));
  const classLevel = (character as any)?.level ?? 0;
  const query = effectName.toLowerCase();
  const matchesEffect = (effect: string) => !!effect && (effect.toLowerCase().includes(query)
    || !!SHARED_EFFECTS[effect]?.some((name) => name.toLowerCase() === query));

  let total = 0;
  ((account as any)?.starSigns ?? []).forEach((starSign: any, index: number) => {
    const isInfiniteStar = index < infiniteStars && starSign?.unlocked;
    const isCounted = equippedNames.has(starSign?.starName) || isInfiniteStar
      || (forceAllWithEffect && starSign?.unlocked && starSign?.bonuses?.some(({ effect }: any) => matchesEffect(effect)));
    if (!isCounted) return;
    const requiredLevel = starSign?.bonuses?.find(({ effect }: any) => effect === 'Lv')?.bonus ?? 0;
    if (classLevel < requiredLevel) return;
    starSign?.bonuses?.forEach(({ effect, bonus }: any) => {
      if (!matchesEffect(effect) || (index < infiniteStars && bonus < 0)) return;
      total += bonus;
    });
  });

  if (hasChip && infiniteStars < 1 && total > 0) {
    total *= 2;
  }
  const hasSeraphCosmos = (account as any)?.starSigns?.some(({ starName, unlocked }: any) => starName === 'Seraph_Cosmos' && unlocked);
  if (hasSeraphCosmos && total > 0) {
    const summoningLevel = (forceAllWithEffect
      ? (account as any)?.highestSummoningLevel ?? (character as any)?.skillsInfo?.summoning?.level
      : (character as any)?.skillsInfo?.summoning?.level) ?? 0;
    const chipMulti = hasChip && infiniteStars >= 1 ? 2 : 1;
    const meritocracyBonus = getMeritocracyBonus(account, 22);
    const tesseractBonus = getTesseractBonus(account, 40);
    const seraphMulti = Math.min(5, Math.pow(1.1 + Math.min(tesseractBonus, 10) / 100, Math.ceil((summoningLevel + 1) / 20)));
    total *= chipMulti * (1 + meritocracyBonus / 100) * seraphMulti;
  }
  return total;
}

export const calcTotalConstellations = (constellations: any[]): number => {
  return constellations?.reduce((sum: number, { done }: { done: boolean }) => done ? sum + 1 : sum, 0);
}
