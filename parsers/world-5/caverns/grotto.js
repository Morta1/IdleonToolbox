export const getGrotto = (holesObject) => {
  const layer = holesObject?.extraCalculations[26] + 1;
  const monarchHp = 1e11 * Math.pow(7.5, (holesObject?.extraCalculations[26]));
  const mushroomKillsLeft = Math.max(0, 5e3 * Math.pow(3.4, (holesObject?.extraCalculations[26])) - (holesObject?.extraCalculations[27]));
  const mushroomKills = holesObject?.extraCalculations[27];
  const mushroomKillsReq = holesObject?.extraCalculations[28];
  return { monarchHp, mushroomKillsLeft, mushroomKills, mushroomKillsReq, layer };
}

