import { items, traps as trapsInfo } from '../data/website-data';
import { getVialsBonusByStat } from '@parsers/alchemy';
import { checkCharClass, CLASSES, getCharacterByHighestTalent, getTalentBonus } from '@parsers/talents';
import { getCompassBonus } from '@parsers/compass';
import { getAtomBonus } from '@parsers/atomCollider';

export const getTraps = (rawCharactersData) => {
  return parseTraps(rawCharactersData);
}

const parseTraps = (rawCharactersData) => {
  return rawCharactersData.map((char) => {
    const traps = char?.PldTraps || [];
    return traps.reduce((res, critterInfo) => {
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

export const calcTotalCritters = (account, { critter, exp }) => {
  return account?.traps?.reduce((res, trapSlots) => {
    trapSlots.reduce((total, { crittersQuantity, trapExp, rawName }) => {
      res = {
        ...res,
        [rawName]: {
          critters: (res?.[rawName]?.critters ?? 0) + (crittersQuantity * critter ?? 1),
          exp: (res?.[rawName]?.exp ?? 0) + (trapExp * exp ?? 1)
        }
      }
    }, {});
    return res;
  }, {});
}

export const getTrapsBonuses = (account, characters) => {
  const critterBonuses = characters?.map((_, index) => calcCrittersBonus({
    currentCharacterIndex: index,
    account,
    characters,
    isExp: false
  }))
  const expBonuses = characters?.map((_, index) => calcCrittersBonus({
    currentCharacterIndex: index,
    account,
    characters,
    isExp: true
  }))
  return {
    max: {
      critter: Math.max(...(critterBonuses || [1])),
      exp: Math.max(...(expBonuses || [1]))
    },
    min: {
      critter: Math.min(...(critterBonuses || [1])),
      exp: Math.min(...(expBonuses || [1]))
    }
  }
}

export const calcCrittersBonus = ({ currentCharacterIndex, account, characters, isExp }) => {
  // CollectAllPCT
  const atomBonus = getAtomBonus(account, 'Magnesium_-_Trap_Compounder') * account?.accountOptions?.[363];
  let moreCritters = isExp
    ? 0
    : getVialsBonusByStat(account?.alchemy?.vials, 'TrapOvision') + getCompassBonus(account, 42) + atomBonus;
  if (checkCharClass(characters?.[currentCharacterIndex]?.class, CLASSES.Hunter)) {
    const bestHunter = getCharacterByHighestTalent(characters, CLASSES.Hunter, 'EAGLE_EYE', isExp);
    moreCritters += isExp
      ? Math.max(40, Math.min(getTalentBonus(bestHunter?.flatTalents, 'EAGLE_EYE', isExp), 99))
      : Math.max(50, getTalentBonus(bestHunter?.flatTalents, 'EAGLE_EYE'));
  } else {
    let highestCritterBonus = 0;
    for (let i = 0; i < characters?.length; i++) {
      if (checkCharClass(characters?.[i]?.class, CLASSES.Hunter)) {
        const bestHunter = getCharacterByHighestTalent(characters, CLASSES.Hunter, 'EAGLE_EYE', isExp, true);
        highestCritterBonus = Math.max(highestCritterBonus, getTalentBonus(bestHunter?.flatTalents, 'EAGLE_EYE', isExp, true));
      } else {
        highestCritterBonus = Math.max(highestCritterBonus, isExp ? 40 : 50);
      }
    }
    moreCritters += highestCritterBonus;
  }
  return isNaN(moreCritters) ? 1 : moreCritters / 100;
}