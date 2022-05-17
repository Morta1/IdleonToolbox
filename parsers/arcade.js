import { growth, tryToParse } from "../utility/helpers";
import { arcadeShop } from "../data/website-data";

export const getArcade = (idleonData, accountOptions, serverVars) => {
  const arcadeRaw = tryToParse(idleonData?.ArcadeUpg) || idleonData?.ArcadeUpg;
  return parseArcade(arcadeRaw, accountOptions, serverVars);
}

const parseArcade = (arcadeRaw, accountOptions, serverVars) => {
  const balls = accountOptions?.[74];
  const goldBalls = accountOptions?.[75];
  const arcadeShopList = arcadeShop?.map((upgrade, index) => {
    const { x1, x2, func } = upgrade;
    const level = arcadeRaw?.[index];
    return {
      ...upgrade,
      level,
      active: serverVars?.ArcadeBonuses?.includes(index),
      bonus: growth(func, level, x1, x2, false),
      iconName: `PachiShopICON${index}`
    }
  });

  return {
    shop: arcadeShopList,
    balls,
    goldBalls
  }
}