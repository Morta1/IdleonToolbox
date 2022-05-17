import { items } from "../data/website-data";

export const getTraps = (charactersData) => {
  return parseTraps(charactersData);
}

const parseTraps = (charactersData) => {
  return charactersData.map((char) => {
    const traps = char?.PldTraps || [];
    return traps.reduce((res, critterInfo) => {
      const [critterId, , timeElapsed, critterName, , , trapTime] = critterInfo;
      if (critterId === -1 && critterId === '-1') return res;
      const timeLeft = trapTime - timeElapsed;
      return critterName ? [...res, {
        name: items[critterName]?.displayName,
        rawName: critterName,
        timeLeft: new Date().getTime() + (timeLeft * 1000)
      }] : res;
    }, []);
  })
}