import type { IdleonData, Account, ServerVars } from '../types';
import { growth, tryToParse } from '@utility/helpers';
import { arcadeShop } from '@website-data';
import { getMaxClaimTime, getSecPerBall } from '@parsers/dungeons';
import { isCompanionBonusActive } from '@parsers/misc';

export const getArcade = (idleonData: IdleonData, account: Account, serverVars: ServerVars) => {
  const arcadeRaw = tryToParse((idleonData as any)?.ArcadeUpg) || (idleonData as any)?.ArcadeUpg;
  return parseArcade(arcadeRaw, account, serverVars);
}

const parseArcade = (arcadeRaw: any, account: Account, serverVars: ServerVars) => {
  const balls = (account as any)?.accountOptions?.[74];
  const goldBalls = (account as any)?.accountOptions?.[75];
  const royalBalls = (account as any)?.accountOptions?.[324];
  const maxBalls = Math.floor(getMaxClaimTime(account) / Math.max(1800, getSecPerBall(account)));

  const arcadeShopList = arcadeShop?.map((upgrade: any, index: number) => {
    const { x1, x2, func } = upgrade;
    const level = arcadeRaw?.[index] ?? 0;
    const bonus = growth(func, level, x1, x2, false);
    const superBonus = level > 100 ? 2 : 1;
    const companionBonus = isCompanionBonusActive(account, 27) ? 2 : 1;
    return {
      ...upgrade,
      level,
      active: (serverVars as any)?.ArcadeBonuses?.includes(index),
      rotationIndex: (serverVars as any)?.ArcadeBonuses?.indexOf(index),
      bonus: bonus * superBonus * companionBonus,
      iconName: `PachiShopICON${index}`
    }
  });
  const totalUpgradeLevels = arcadeShopList?.reduce((res: number, { level }: { level: number }) => res + level, 0);
  return {
    shop: arcadeShopList,
    balls,
    goldBalls,
    royalBalls,
    maxBalls,
    totalUpgradeLevels
  }
}

// The name must match the effect exactly, minus its leading "+{%_": a substring match let 'Drop_Rate'
// reach Marble Drop Rate. Names the shop repeats (Cash_from_Mobs is 10 and 11, Artifact_Find 32 and
// 66) go by index, as the game's ArcadeBonus(i) does.
export const getArcadeBonus = (list: any[] | undefined, effectNameOrIndex: string | number) => {
  if (typeof effectNameOrIndex === 'number') return list?.[effectNameOrIndex];
  return list?.find(({ effect }: { effect: string }) => effect.replace(/^[^A-Za-z]*/, '') === effectNameOrIndex);
}
