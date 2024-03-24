import { tomeData, ninjaExtraInfo } from '../../data/website-data';

export const getTome = (idleonData, account, characters) => {
  const indexes = ninjaExtraInfo[32].split(' ');
  return tomeData.map((bonus, index) => {
    const tomeLvReq = 50 * index + (10 * Math.max(0, index - 30) + 10 * Math.max(0, index - 50)) + 500;
    return {
      ...bonus,
      tomeLvReq
    }
  });
}