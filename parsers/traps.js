import { items, traps as trapsInfo } from "../data/website-data";

export const getTraps = (charactersData) => {
  return parseTraps(charactersData);
}

const parseTraps = (charactersData) => {
  return charactersData.map((char) => {
    const traps = char?.PldTraps || [];
    return traps.reduce((res, critterInfo) => {
      const [critterId, , timeElapsed, critterName, crittersQuantity, trapType, trapTime] = critterInfo;
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
        timeLeft: new Date().getTime() + (timeLeft * 1000),
        trapData
      }] : res;
    }, []);
  })
}