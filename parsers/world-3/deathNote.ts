import { deathNote, mapEnemies, mapEnemiesArray, monsters, ninjaExtraInfo } from '@website-data';
import { isRiftBonusUnlocked } from '@parsers/world-4/rift';
import { lavaLog } from '@utility/helpers';
import { saveField } from '@parsers/saveField';

// The game's monster face sprite (Mface + MonsterFace), as Killroy's monster list draws it. The minibosses share one
// placeholder face, so they get none here: the page draws their own portrait (monsterSprite)
const faceOf = (rawName: string) => {
  const face = (monsters as any)?.[rawName]?.MonsterFace;
  return face != null ? `data/Mface${face}.png` : null;
};

// The next skull a mob reaches: the kills it needs and the points it adds, or null past its last rank. Past rank 10 a
// normal mob's next is the eclipse skull, once the rift bonus is unlocked
export const getNextDeathNoteRank = (account: any, kills: number, isMiniBosses?: boolean) => {
  const table = isMiniBosses ? MINI_BOSS_DEATH_NOTE_RANKS : DEATH_NOTE_RANKS;
  const rank = getDeathNoteRank(account, kills, isMiniBosses);
  const next = table.find(([threshold]) => kills < threshold);
  if (next) return { kills: next[0], rank: next[1], points: next[1] - rank, toGo: next[0] - kills };
  if (!isMiniBosses && rank < ECLIPSE_SKULL_RANK && isRiftBonusUnlocked(account?.rift, 'Eclipse_Skulls')) {
    // Strictly more than the threshold
    const needed = ECLIPSE_SKULL_KILLS + 1;
    return { kills: needed, rank: ECLIPSE_SKULL_RANK, points: ECLIPSE_SKULL_RANK - rank, toGo: needed - kills };
  }
  return null;
};

export const getDeathNote = (idleonData: any, charactersData: any, account: any) => {
  const rawSneaking = saveField(idleonData, 'Ninja');
  const bosses = ninjaExtraInfo?.[30];
  const miniBossesKills = rawSneaking?.[105];
  const allKills = getAllCharactersKills(charactersData);
  const miniBosses = bosses.map((rawName: any, index: any) => ({
    rawName,
    kills: miniBossesKills?.[index] ?? 0
  })).reduce((res: any, { rawName, kills }: any) => {
    const rank = getDeathNoteRank(account, kills, true);
    return {
      rank: (res?.rank || 0) + rank,
      mobs: [...(res?.mobs || []), { rawName, displayName: monsters?.[rawName]?.Name, kills, icon: null }]
    }
  }, {});
  return deathNote.reduce((res: any, { rawName, world }) => {
    const mobIndex = mapEnemies?.[rawName];
    const kills = allKills?.[mobIndex] ?? 0;
    const rank = getDeathNoteRank(account, kills, false);
    return {
      ...res,
      [world]: {
        ...(res?.[world] || {}),
        rank: (res?.[world]?.rank || 0) + rank,
        mobs: [...(res?.[world]?.mobs || []), { rawName, displayName: monsters?.[rawName]?.Name, kills, icon: faceOf(rawName) }]
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

// game: WorkbenchStuff("DeathNoteRank"): the rank a mob reaches at each kill count, as [kills, rank]
export const DEATH_NOTE_RANKS = [[25e3, 1], [1e5, 2], [25e4, 3], [5e5, 4], [1e6, 5], [5e6, 7], [1e8, 10]];
export const MINI_BOSS_DEATH_NOTE_RANKS = [[100, 1], [250, 2], [1e3, 3], [5e3, 4], [25e3, 5], [1e5, 7], [1e6, 10]];
// Past this many kills (strictly more) a normal mob turns into an eclipse skull once the rift bonus is unlocked
export const ECLIPSE_SKULL_KILLS = 1e9;
export const ECLIPSE_SKULL_RANK = 20;

const getRankFromTable = (table: number[][], kills: number) => table.reduce((rank, [threshold, tableRank]) =>
  kills >= threshold ? tableRank : rank, 0);

export const getDeathNoteRank = (account: any, kills: any, isMiniBosses?: any) => {
  if (isMiniBosses) return getRankFromTable(MINI_BOSS_DEATH_NOTE_RANKS, kills);
  if (kills > ECLIPSE_SKULL_KILLS && isRiftBonusUnlocked(account?.rift, 'Eclipse_Skulls')) return ECLIPSE_SKULL_RANK;
  return getRankFromTable(DEATH_NOTE_RANKS, kills);
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
      return res + (rank >= ECLIPSE_SKULL_RANK ? 1 : 0);
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