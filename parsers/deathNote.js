import { deathNote, mapEnemies, monsters } from "../data/website-data";

export const getDeathNote = (charactersData) => {
  const allKills = charactersData?.reduce((res, character) => {
    const { kills } = character;
    if (res?.length === 0) return kills;
    return kills?.map((mapKills, innerInd) => mapKills + res[innerInd]);
  }, []);
  return deathNote.reduce((res, { rawName, world }) => {
    const mobIndex = mapEnemies?.[rawName];
    const kills = allKills?.[mobIndex];
    const rank = getDeathNoteRank(kills);
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

export const getDeathNoteRank = (kills) => {
  return 25e3 > kills ? 0 : 1e5 > kills ? 1 : 25e4 > kills ? 2 : 5e5 > kills ? 3 : 1e6 > kills ? 4 : 5e6 > kills ? 5 : 1e8 > kills ? 7 : 10;
}