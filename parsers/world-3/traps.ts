import { items, traps as trapsInfo } from '@website-data';
import { getVialsBonusByStat } from '@parsers/world-2/alchemy';
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
    }
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