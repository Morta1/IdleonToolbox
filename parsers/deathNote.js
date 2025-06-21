import { deathNote, mapEnemies, mapEnemiesArray, monsters, ninjaExtraInfo } from '../data/website-data';
import { isRiftBonusUnlocked } from './world-4/rift';
import { lavaLog, tryToParse } from '@utility/helpers';

export const getDeathNote = (idleonData, charactersData, account) => {
  const rawSneaking = tryToParse(idleonData?.Ninja);
  const bosses = ninjaExtraInfo?.[30]?.split(' ');
  const miniBossesKills = rawSneaking?.[105];
  const allKills = getAllCharactersKills(charactersData);
  const miniBosses = bosses.map((rawName, index) => ({
    rawName,
    kills: miniBossesKills?.[index]
  })).reduce((res, { rawName, kills }) => {
    const rank = getDeathNoteRank(account, kills, true);
    return {
      rank: (res?.rank || 0) + rank,
      mobs: [...(res?.mobs || []), { rawName, displayName: monsters?.[rawName]?.Name, kills }]
    }
  }, {});
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
  }, { miniBosses });
}

export const getAllCharactersKills = (charactersData) => {
  return charactersData?.reduce((result, character) => {
    const { kills } = character;
    if (kills && kills.length) {
      kills.forEach((kill, index) => {
        result[index] = (result[index] || 0) + kill;
      });
    }
    return result;
  }, [])
}

export const getTopKilledMonsters = (charactersData) => {
  const allKills = getAllCharactersKills(charactersData);
  const indexedArr = allKills.map((value, index) => [index, value]);
  indexedArr.sort((a, b) => b[1] - a[1]);
  return indexedArr.filter(([enemyIndex]) => monsters?.[mapEnemiesArray?.[enemyIndex]]?.Name !== '_').slice(0, 15).map(([enemyIndex, kills]) => {
    return {
      enemy: monsters?.[mapEnemiesArray?.[enemyIndex]]?.Name,
      kills
    }
  });
}

export const getDeathNoteRank = (account, kills, isMiniBosses) => {
  return isMiniBosses ? (100 > kills ? 0 : 250 > kills ? 1 : 1e3 > kills ? 2 : 5e3 > kills ? 3 : 25e3 > kills
    ? 4
    : 1e5 > kills ? 5 : 1e6 > kills
      ? 7
      : 10) : 25e3 > kills ? 0 : 1e5 > kills ? 1 : 25e4 > kills ? 2 : 5e5 > kills ? 3 : 1e6 > kills ? 4 : 5e6 > kills
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

export const calcTotalKillsDigits = (deathNote) => {
  const deathNoteCopy = structuredClone((deathNote));
  return Object.values(deathNoteCopy).reduce((sum, { mobs }) => {
    const digits = mobs.reduce((sum, { kills }) => sum + Math.ceil(lavaLog(kills)), 0);
    return sum + digits;
  }, 0)
}