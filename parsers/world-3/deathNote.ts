import { deathNote, mapEnemies, mapEnemiesArray, monsters, ninjaExtraInfo } from '@website-data';
import { isRiftBonusUnlocked } from '@parsers/world-4/rift';
import { lavaLog, tryToParse } from '@utility/helpers';

export const getDeathNote = (idleonData: any, charactersData: any, account: any) => {
  const rawSneaking = tryToParse(idleonData?.Ninja);
  const bosses = ninjaExtraInfo?.[30];
  const miniBossesKills = rawSneaking?.[105];
  const allKills = getAllCharactersKills(charactersData);
  const miniBosses = bosses.map((rawName: any, index: any) => ({
    rawName,
    kills: miniBossesKills?.[index]
  })).reduce((res: any, { rawName, kills }: any) => {
    const rank = getDeathNoteRank(account, kills, true);
    return {
      rank: (res?.rank || 0) + rank,
      mobs: [...(res?.mobs || []), { rawName, displayName: monsters?.[rawName]?.Name, kills }]
    }
  }, {});
  return deathNote.reduce((res: any, { rawName, world }) => {
    const mobIndex = mapEnemies?.[rawName];
    const kills = allKills?.[mobIndex];
    const rank = getDeathNoteRank(account, kills, false);
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

export const getAllCharactersKills = (charactersData: any) => {
  return charactersData?.reduce((result: any, character: any) => {
    const { kills } = character;
    if (kills && kills.length) {
      kills.forEach((kill: any, index: any) => {
        result[index] = (result[index] || 0) + kill;
      });
    }
    return result;
  }, [])
}

export const getTopKilledMonsters = (charactersData: any) => {
  const allKills = getAllCharactersKills(charactersData);
  const indexedArr = allKills.map((value: any, index: any) => [index, value]);
  indexedArr.sort((a: any, b: any) => b[1] - a[1]);
  return indexedArr.filter(([enemyIndex]: any) => monsters?.[mapEnemiesArray?.[enemyIndex]]?.Name !== '_').slice(0, 15).map(([enemyIndex, kills]: any) => {
    return {
      enemy: monsters?.[mapEnemiesArray?.[enemyIndex]]?.Name,
      kills
    }
  });
}

export const getDeathNoteRank = (account: any, kills: any, isMiniBosses?: any) => {
  return isMiniBosses ? (100 > kills ? 0 : 250 > kills ? 1 : 1e3 > kills ? 2 : 5e3 > kills ? 3 : 25e3 > kills
    ? 4
    : 1e5 > kills ? 5 : 1e6 > kills
      ? 7
      : 10) : 25e3 > kills ? 0 : 1e5 > kills ? 1 : 25e4 > kills ? 2 : 5e5 > kills ? 3 : 1e6 > kills ? 4 : 5e6 > kills
    ? 5
    : 1e8 > kills ? 7 : 1e9 < kills && isRiftBonusUnlocked(account?.rift, 'Eclipse_Skulls') ? 20 : 10;
}

export const getEclipseSkullsBonus = (account: any) => {
  const hasBonus = isRiftBonusUnlocked(account?.rift, 'Eclipse_Skulls');
  if (!hasBonus) return 0;
  // Game only counts worlds 0-5 (6 > e), excludes world 6+ and miniBosses
  const validWorlds = ['0', '1', '2', '3', '4', '5'];
  const count = Object.entries(account?.deathNote || {})?.reduce((sum: any, [key, value]) => {
    if (!validWorlds.includes(key)) return sum;
    const { mobs } = value as any;
    const eclipses = mobs?.reduce((res: any, { kills }: any) => {
      const rank = getDeathNoteRank(account, kills);
      return res + (rank >= 15 ? 1 : 0);
    }, 0)
    return sum + eclipses;
  }, 0)
  return 5 * count;
}

export const calcTotalKillsDigits = (deathNote: any) => {
  const deathNoteCopy = structuredClone(deathNote || {});
  return Object.values(deathNoteCopy).reduce((sum: any, value: any) => {
    const { mobs } = value;
    const digits = mobs.reduce((sum: any, { kills }: any) => sum + Math.ceil(lavaLog(kills)), 0);
    return sum + digits;
  }, 0)
}