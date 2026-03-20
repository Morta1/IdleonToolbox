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
  const maxBalls = Math.round(getMaxClaimTime(account) / Math.max(1800, getSecPerBall(account)));

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

export const getArcadeBonus = (list: any[] | undefined, effectName: string) => {
  return list?.find(({ effect }: { effect: string }) => effect.includes(effectName))
}
