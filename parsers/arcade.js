import { growth, tryToParse } from '../utility/helpers';
import { arcadeShop } from '../data/website-data';
import { getMaxClaimTime, getSecPerBall } from './dungeons';

export const getArcade = (idleonData, account, serverVars) => {
  const arcadeRaw = tryToParse(idleonData?.ArcadeUpg) || idleonData?.ArcadeUpg;
  return parseArcade(arcadeRaw, account, serverVars);
}

const parseArcade = (arcadeRaw, account, serverVars) => {
  const balls = account?.accountOptions?.[74];
  const goldBalls = account?.accountOptions?.[75];
  const royalBalls = account?.accountOptions?.[324];
  const maxBalls = Math.round(getMaxClaimTime(account) / Math.max(1800, getSecPerBall(account)));
  const arcadeShopList = arcadeShop?.map((upgrade, index) => {
    const { x1, x2, func } = upgrade;
    const level = arcadeRaw?.[index] ?? 0;
    const bonus = growth(func, Math.min(level, 100), x1, x2, false);
    return {
      ...upgrade,
      level,
      active: serverVars?.ArcadeBonuses?.includes(index),
      bonus: level > 100 ? bonus * 2 : bonus,
      iconName: `PachiShopICON${index}`
    }
  });
  const totalUpgradeLevels = arcadeShopList?.reduce((res, { level }) => res + level, 0);
  return {
    shop: arcadeShopList,
    balls,
    goldBalls,
    royalBalls,
    maxBalls,
    totalUpgradeLevels
  }
}

export const getArcadeBonus = (list, effectName) => {
  return list?.find(({ effect }) => effect.includes(effectName))
}