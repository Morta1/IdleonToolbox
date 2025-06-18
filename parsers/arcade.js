import { growth, tryToParse } from '../utility/helpers';
import { arcadeShop } from '../data/website-data';
import { getMaxClaimTime, getSecPerBall } from './dungeons';
import { isCompanionBonusActive } from '@parsers/misc';

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
    const bonus = growth(func, level, x1, x2, false);
    const superBonus = level > 100 ? 2 : 1;
    const companionBonus = isCompanionBonusActive(account, 27) ? 2 : 1;
    return {
      ...upgrade,
      level,
      active: serverVars?.ArcadeBonuses?.includes(index),
      rotationIndex: serverVars?.ArcadeBonuses?.indexOf(index),
      bonus: bonus * superBonus * companionBonus,
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