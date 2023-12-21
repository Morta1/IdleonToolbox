import { items, traps as trapsInfo } from '../data/website-data';

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

export const calcTotalCritters = (traps) => {
  return traps?.reduce((res, trapSlots) => {
    trapSlots.reduce((total, { crittersQuantity, trapExp, rawName }) => {
      res = {
        ...res,
        [rawName]: {
          critters: (res?.[rawName]?.critters ?? 0) + crittersQuantity,
          exp: (res?.[rawName]?.exp ?? 0) + trapExp
        }
      }
    }, {});
    return res;
  }, {});
}