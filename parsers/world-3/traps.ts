import { items, traps as trapsInfo, trappingInfo } from '@website-data';
import { getBubbleBonus, getVialsBonusByStat } from '@parsers/world-2/alchemy';
import { getStampsBonusByStat } from '@parsers/world-1/stamps';
import { getCardBonusByEffect } from '@parsers/cards';
import { getArcadeBonus } from '@parsers/world-2/arcade';
import { getPrayerBonusAndCurse } from '@parsers/world-3/prayers';
import { getMeritocracyBonus } from '@parsers/world-2/voteBallot';
import { getTrappingStuff } from '@parsers/character';
import { getFoodBonus, isMasteryBonusUnlocked } from '@parsers/misc';
import { cleanUnderscore, notateNumber } from '@utility/helpers';
import { checkCharClass, CLASSES, getCharacterByHighestTalent, getTalentBonus } from '@parsers/talents';
import { getCompassBonus } from '@parsers/class-specific/compass';
import { getAtomBonus } from '@parsers/world-3/atomCollider';
import { getArmorSetBonus } from '@parsers/world-3/armorSmithy';
import { getPaletteBonus } from '@parsers/world-5/gaming';

export const getTraps = (rawCharactersData: any) => {
  return parseTraps(rawCharactersData);
}

const parseTraps = (rawCharactersData: any) => {
  return rawCharactersData.map((char: any) => {
    const traps = char?.PldTraps || [];
    return traps.reduce((res: any, critterInfo: any) => {
      const [critterId, , timeElapsed, critterName, crittersQuantity, trapType, trapTime, trapExp] = critterInfo;
      if (critterId === -1 || critterId === '-1') return res;
      // trapType 0 = non shine
      // trapType 1 = shiny
      const trapData = trapsInfo[trapType].find((trap) => trap.trapTime === trapTime)
      const timeLeft = trapTime - timeElapsed;
      return critterName ? [...res, {
        name: items[critterName]?.displayName,
        rawName: critterName,
        crittersQuantity,
        trapType,
        trapExp,
        timeLeft: new Date().getTime() + (timeLeft * 1000),
        trapData
      }] : res;
    }, []);
  })
}

export const calcTotalCritters = (account: any, { critter, exp }: any) => {
  return account?.traps?.reduce((res: any, trapSlots: any) => {
    trapSlots.reduce((total: any, { crittersQuantity, trapExp, rawName }: any) => {
      res = {
        ...res,
        [rawName]: {
          critters: (res?.[rawName]?.critters ?? 0) + (crittersQuantity * critter || 1),
          exp: (res?.[rawName]?.exp ?? 0) + (trapExp * exp || 1)
        }
      }
    }, {});
    return res;
  }, {});
}

export const getTrapsBonuses = (account: any, characters: any) => {
  const critterBonuses = characters?.map((_: any, index: any) => calcCrittersBonus({
    currentCharacterIndex: index,
    account,
    characters,
    isExp: false
  }))
  const expBonuses = characters?.map((_: any, index: any) => calcCrittersBonus({
    currentCharacterIndex: index,
    account,
    characters,
    isExp: true
  }))
  const withFallback = (bonuses: any[] | undefined, pick: (...values: number[]) => number) =>
    bonuses?.length ? pick(...bonuses) : 1;

  return {
    max: {
      critter: withFallback(critterBonuses, Math.max),
      exp: withFallback(expBonuses, Math.max)
    },
    min: {
      critter: withFallback(critterBonuses, Math.min),
      exp: withFallback(expBonuses, Math.min)
    },
    perCharacter: characters?.map((character: any, index: any) => ({
      name: character?.name,
      critter: critterBonuses?.[index] ?? 1,
      exp: expBonuses?.[index] ?? 1
    })) ?? []
  }
}

export const calcCrittersBonus = ({ currentCharacterIndex, account, characters, isExp }: any) => {
  // CollectAllPCT / CollectAllPCTexp
  // The game floors the whole sum at 50 (40 for exp) *after* adding the account-wide bonuses to the
  // Eagle Eye talent, so a low talent can still be carried over the floor by vials/compass/sets.
  const atomBonus = getAtomBonus(account, 'Magnesium_-_Trap_Compounder') * account?.accountOptions?.[363];
  const dementiaSetBonus = getArmorSetBonus(account, 'DEMENTIA_SET');
  const paletteBonus = getPaletteBonus(account, 12);
  const accountBonuses = isExp
    ? 0
    : getVialsBonusByStat(account?.alchemy?.vials, 'TrapOvision') + getCompassBonus(account, 42)
    + atomBonus + dementiaSetBonus + paletteBonus;
  let talentBonus = 0;
  if (checkCharClass(characters?.[currentCharacterIndex]?.class, CLASSES.Hunter)) {
    const bestHunter = getCharacterByHighestTalent(characters, CLASSES.Hunter, 'EAGLE_EYE', isExp);
    talentBonus = isExp
      ? Math.min(getTalentBonus(bestHunter?.flatTalents, 'EAGLE_EYE', isExp), 99)
      : getTalentBonus(bestHunter?.flatTalents, 'EAGLE_EYE');
  } else {
    for (let i = 0; i < characters?.length; i++) {
      if (!checkCharClass(characters?.[i]?.class, CLASSES.Hunter)) continue;
      const bestHunter = getCharacterByHighestTalent(characters, CLASSES.Hunter, 'EAGLE_EYE', isExp, true);
      const bonus = getTalentBonus(bestHunter?.flatTalents, 'EAGLE_EYE', isExp, true);
      talentBonus = Math.max(talentBonus, isExp ? Math.min(bonus, 99) : bonus);
    }
  }
  const moreCritters = Math.max(isExp ? 40 : 50, talentBonus + accountBonuses);
  // The result is a multiplier (166% -> 1.66), so it must not be floored - the game only floors the
  // resulting item count, never the rate itself.
  return Math.min(2e9, isNaN(moreCritters) ? 1 : moreCritters / 100);
}
export interface ShinyChanceCritter {
  rawName: string;
  name: string;
  baseChance: number;
  chance: number;
}

export interface ShinyChance {
  multiplier: number;
  bundleSize: number;
  critters: ShinyChanceCritter[];
}

// TrappingStuffs("TotalRareChance") without the per-critter base, times the open-time bonuses the
// game applies in TrappingStuffs("RareBonusOnOpen"). The placed-trap value is a snapshot taken when
// the trap went into the ground, so this is what a trap placed *now* would roll with.
const calcShinyMultiplier = (character: any, account: any) => {
  const stampBonus = getStampsBonusByStat(account, 'ShinyChance', character) ?? 0;
  // "Come 'ere Critters!" - +2% shiny chance per completion
  const taskBonus = 2 * (account?.tasks?.[1]?.[2]?.[5] ?? 0);
  const bubbleMulti = Math.max(getBubbleBonus(account, 'CUZ_I_CATCH_EM_ALL') || 0, 1);
  const vialsBonus = (getVialsBonusByStat(account?.alchemy?.vials, 'Shiny1') ?? 0)
    + (getVialsBonusByStat(account?.alchemy?.vials, 'Shiny2') ?? 0);
  const talentBonus = Math.max(1, getTalentBonus(character?.flatTalents, 'REFLECTIVE_EYESIGHT'));
  const trappingLevel = character?.skillsInfo?.trapping?.level ?? 0;
  const talentMulti = Math.pow(talentBonus, 1 + Math.floor(trappingLevel / 10));

  // getFoodBonus prices in the character's food-effect multiplier, which reaches through star
  // signs - skip it entirely when no food is equipped, where the game would sum to 0 anyway.
  const foodBonus = character?.food?.length ? getFoodBonus(character, account, 'TrappingSpeedBoosts') : 0;
  // Trapping mastery tier 2 turns every owned Shiny Critter card into a passive.
  const cardsArePassives = isMasteryBonusUnlocked(account?.rift, account?.totalSkillsLevels?.trapping?.rank, 2);
  const cardBonus = (cardsArePassives
    ? getCardBonusByEffect(account?.cards, 'Shiny_Critter_Chance')
    : getCardBonusByEffect(character?.cards?.equippedCards, 'Shiny_Critter_Chance')) ?? 0;
  const minigameBonus = (getTrappingStuff('TrapMGbonus', 2, account) ?? 0) + (getTrappingStuff('TrapMGbonus', 5, account) ?? 0);
  const arcadeBonus = getArcadeBonus(account?.arcade?.shop, 'Shiny_Chance')?.bonus ?? 0;
  const onOpenBonus = foodBonus + cardBonus + minigameBonus + arcadeBonus;

  const shinySnitch = getPrayerBonusAndCurse(character?.activePrayers, 'Shiny_Snitch', account);
  const prayerDivider = Math.round(1 + (shinySnitch?.curse ?? 0));
  const meritocracyBonus = getMeritocracyBonus(account, 4) ?? 0;

  const placementMulti = (1 + (stampBonus + taskBonus) / 100)
    * bubbleMulti
    * (1 + vialsBonus / 100)
    * talentMulti;
  const onOpenMulti = 1 + onOpenBonus / 100;

  return {
    placementMulti,
    onOpenMulti,
    prayerDivider,
    multiplier: placementMulti * onOpenMulti / prayerDivider,
    bundleSize: Math.round((1 + (shinySnitch?.bonus ?? 0)) * (1 + meritocracyBonus / 100)),
    sources: {
      stampBonus,
      taskBonus,
      bubbleMulti,
      vialsBonus,
      talentBonus,
      talentMulti,
      trappingLevel,
      foodBonus,
      cardBonus,
      minigameBonus,
      arcadeBonus,
      prayerDivider,
      shinySnitchBonus: shinySnitch?.bonus ?? 0,
      meritocracyBonus
    }
  };
}

export const getShinyChance = (character: any, account: any): ShinyChance & { sources: any } => {
  const { multiplier, placementMulti, onOpenMulti, prayerDivider, bundleSize, sources } = calcShinyMultiplier(character, account);
  const critters = trappingInfo?.map(({ critterName, shinyChance }: any) => ({
    rawName: critterName,
    name: items?.[critterName]?.displayName ?? critterName,
    baseChance: shinyChance,
    // The game floors the placement snapshot at 0.001 before the open-time bonuses touch it.
    chance: Math.max(0.001, shinyChance * placementMulti) * onOpenMulti / prayerDivider
  })) ?? [];
  return { multiplier, bundleSize, critters, sources };
}

// The game rolls the chance against 100 * random(), so anything at or above 100 is a guaranteed
// shiny and the surplus buys nothing on that critter.
const formatChance = (value: number) => {
  if (value >= 100) return '100%';
  if (value >= 1) return `${notateNumber(value, 'Big')}%`;
  return `${parseFloat(value.toPrecision(3))}%`;
}

const formatMulti = (value: number) => `x${notateNumber(value, 'MultiplierInfo')}`;

const formatPercent = (value: number) => `+${notateNumber(value, 'Big')}%`;

// The shiny chance is per character - the talent, its trapping-level repeat, the equipped boost
// food and the Shiny Snitch prayer are all character-bound - so the caller picks whose to show,
// falling back to the best one when nothing is selected.
export const getShinyChanceInfo = (account: any, characters: any, selectedCharacter?: any) => {
  const perCharacter = characters?.map((character: any) => ({
    name: character?.name,
    ...getShinyChance(character, account)
  })) ?? [];
  const best = perCharacter.reduce((res: any, current: any) => current?.multiplier > (res?.multiplier ?? -1)
    ? current
    : res, null);
  const selected = (selectedCharacter
    ? perCharacter.find(({ name }: any) => name === selectedCharacter?.name) ?? getShinyChance(selectedCharacter, account)
    : best)
    ?? getShinyChance(null, account);
  const { multiplier, bundleSize, critters, sources } = selected;

  const breakdown = {
    statName: 'Shiny Critter Chance',
    totalValue: formatMulti(multiplier),
    categories: [
      {
        name: 'On placement',
        sources: [
          { name: 'Stamps', value: sources?.stampBonus, formatted: formatPercent(sources?.stampBonus) },
          {
            name: `Task - Come 'ere Critters!`,
            value: sources?.taskBonus,
            formatted: formatPercent(sources?.taskBonus)
          },
          {
            name: 'Bubble - Cuz I Catch Em All',
            value: sources?.bubbleMulti,
            formatted: formatMulti(sources?.bubbleMulti)
          },
          {
            name: 'Vials - Fur Refresher + Orange Malt',
            value: sources?.vialsBonus,
            formatted: formatPercent(sources?.vialsBonus)
          },
          {
            name: `Talent - Reflective Eyesight (${formatMulti(sources?.talentBonus)} every 10 trapping lv)`,
            value: sources?.talentMulti,
            formatted: formatMulti(sources?.talentMulti)
          }
        ]
      },
      {
        name: 'On collection',
        sources: [
          {
            name: 'Boost food - Critter Numnums',
            value: sources?.foodBonus,
            formatted: formatPercent(sources?.foodBonus)
          },
          { name: 'Cards', value: sources?.cardBonus, formatted: formatPercent(sources?.cardBonus) },
          {
            name: 'Trapping minigame',
            value: sources?.minigameBonus,
            formatted: formatPercent(sources?.minigameBonus)
          },
          { name: 'Arcade', value: sources?.arcadeBonus, formatted: formatPercent(sources?.arcadeBonus) },
          {
            name: 'Prayer - Shiny Snitch',
            value: sources?.prayerDivider,
            formatted: `/${sources?.prayerDivider}`
          }
        ]
      },
      {
        name: 'Chance per critter (with a x1 trap)',
        sources: critters?.map(({ name, chance }: any) => ({
          name: cleanUnderscore(name),
          value: chance,
          formatted: formatChance(chance)
        }))
      },
      {
        name: 'Per character',
        sources: perCharacter?.map(({ name, multiplier: charMulti }: any) => ({
          name,
          value: charMulti,
          formatted: formatMulti(charMulti)
        }))
      }
    ]
  };

  return { multiplier, bundleSize, critters, perCharacter, breakdown };
}
