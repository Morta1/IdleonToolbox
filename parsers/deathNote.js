import { deathNote, mapEnemies, monsters } from '../data/website-data';
import { isRiftBonusUnlocked } from './world-4/rift';

export const getDeathNote = (charactersData, account) => {
  const allKills = charactersData?.reduce((res, character) => {
    const { kills } = character;
    if (res?.length === 0) return kills;
    return kills?.map((mapKills, innerInd) => mapKills + res[innerInd]);
  }, []);
  return deathNote.reduce((res, { rawName, world }) => {
    const mobIndex = mapEnemies?.[rawName];
    const kills = allKills?.[mobIndex];
    const rank = getDeathNoteRank(account, kills);
    return {
      ...res,
      [world]: {
        ...(res?.[world] || {}),
        rank: (res?.[world]?.rank || 0) + rank,
        mobs: [...(res?.[world]?.mobs || []), { rawName, displayName: monsters?.[rawName]?.Name, kills }]
      }
    };
  }, {});
}

export const getDeathNoteRank = (account, kills) => {
  return 25e3 > kills ? 0 : 1e5 > kills ? 1 : 25e4 > kills ? 2 : 5e5 > kills ? 3 : 1e6 > kills ? 4 : 5e6 > kills
    ? 5
    : 1e8 > kills ? 7 : 1e9 < kills && isRiftBonusUnlocked(account?.rift, 'Eclipse_Skulls') ? 20 : 10;
}

export const getEclipseSkullsBonus = (account) => {
  const hasBonus = isRiftBonusUnlocked(account?.rift, 'Eclipse_Skulls');
  if (!hasBonus) return 0;
  return Object.entries(account?.deathNote || {})?.reduce((sum, [_, { mobs }]) => {
    const eclipses = mobs?.reduce((res, { kills }) => res + (kills >= 1e9 ? 1 : 0), 0)
    return sum + eclipses;
  }, 0)
}