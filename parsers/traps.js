import { items, traps as trapsInfo } from '../data/website-data';
import { getVialsBonusByStat } from '@parsers/alchemy';
import { checkCharClass, getCharacterByHighestTalent, getTalentBonus } from '@parsers/talents';

export const getTraps = (charactersData) => {
  return parseTraps(charactersData);
}

const parseTraps = (charactersData) => {
  return charactersData.map((char) => {
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

export const calcTotalCritters = ({ account, characters }) => {
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
  return account?.traps?.reduce((res, trapSlots, index) => {
    trapSlots.reduce((total, { crittersQuantity, trapExp, rawName }) => {
      res = {
        ...res,
        [rawName]: {
          critters: (res?.[rawName]?.critters ?? 0) + (crittersQuantity * critterBonuses?.[index]),
          exp: (res?.[rawName]?.exp ?? 0) + (trapExp * expBonuses?.[index])
        }
      }
    }, {});
    return res;
  }, {});
}

export const calcCrittersBonus = ({ currentCharacterIndex, account, characters, isExp }) => {
  let moreCritters = getVialsBonusByStat(account?.alchemy?.vials, 'TrapOvision');
  if (checkCharClass(characters?.[currentCharacterIndex]?.class, 'Hunter')) {
    const bestHunter = getCharacterByHighestTalent(characters, 2, 'Hunter', 'EAGLE_EYE', isExp);
    moreCritters += getTalentBonus(bestHunter?.talents, 2, 'EAGLE_EYE');
  }
  else {
    let highestCritterBonus = 0;
    for (let i = 0; i < characters?.length; i++) {
      if (checkCharClass(characters?.[i]?.class, 'Hunter')) {
        const bestHunter = getCharacterByHighestTalent(characters, 2, 'Hunter', 'EAGLE_EYE', isExp, true);
        highestCritterBonus = Math.max(highestCritterBonus, getTalentBonus(bestHunter?.talents, 2, 'EAGLE_EYE', isExp, true));
      }
      else {
        highestCritterBonus = Math.max(highestCritterBonus, isExp ? 40 : 50);
      }
    }
    moreCritters += highestCritterBonus;
  }
  return isNaN(moreCritters) ? 1 : moreCritters / 100;
}