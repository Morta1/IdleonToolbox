import { equinoxChallenges, equinoxUpgrades } from '@website-data';
import { tryToParse } from '@utility/helpers';
import { getVialsBonusByStat } from '@parsers/world-2/alchemy';
import { getEventShopBonus, isBundlePurchased, isCompanionBonusActive } from '@parsers/misc';
import { getVoteBonus } from '@parsers/world-2/voteBallot';
import { getWinnerBonus } from '@parsers/world-6/summoning';
import { getCosmoBonus } from '@parsers/world-5/hole';
import { getArcadeBonus } from '@parsers/world-2/arcade';
import { getEmperorBonus } from '@parsers/world-6/emperor';
import { getTesseractBonus } from '@parsers/class-specific/tesseract';
import { getLoreBossBonus } from '@parsers/world-7/spelunking';
import { isSuperbitUnlocked } from '@parsers/world-5/gaming';
import { getResearchGridBonus } from '@parsers/world-7/research';
import { getArmoryUpgradeBonus } from '@parsers/class-specific/royalGuardian';
import { NUMBERED_GROUP, additiveGroup, createBreakdown, flat, multiplier, percent, productGroup } from '@parsers/breakdown';

const DREAM_UPGRADES_OFFSET = 2;
// Bar fill per hour before multipliers; the bundle raises it
const EQUINOX_BASE_RATE = 60;
const EQUINOX_BUNDLE_RATE = 90;
const dreamUpgradesEnd = () => DREAM_UPGRADES_OFFSET + equinoxUpgrades.length;
const emptyDream = () => new Array(dreamUpgradesEnd()).fill(0);

export const getLockedEquinox = () => ({
  unlocked: false,
  currentCharge: 0,
  chargeRequired: 0,
  chargeRate: 0,
  timeToFull: undefined,
  challenges: equinoxChallenges.map(({ label, goal, reward }) => ({
    label, goal, reward, current: 0, active: false, locked: false
  })),
  upgrades: equinoxUpgrades.map(({ name, description, maxLevel }, index) => ({
    name,
    bonus: 0,
    desc: description?.replace('{}', '0').replace('{', '').replace('}', '0').split('_@_'),
    lvl: 0,
    maxLvl: maxLevel,
    unlocked: index === 0
  })),
  completedClouds: 0,
  rawDream: emptyDream(),
  breakdown: createBreakdown('Equinox fill rate', 0, []),
  expression: ''
});

export const getEquinox = (idleonData: any, account: any) => {
  const weeklyBoss = tryToParse(idleonData?.WeeklyBoss) || idleonData?.WeeklyBoss;
  const dream = tryToParse(idleonData?.Dream) || idleonData?.Dream;
  return {
    ...parseEquinox(weeklyBoss || {}, dream || emptyDream(), account),
    unlocked: !!weeklyBoss && !!dream
  };
}

const parseEquinox = (weeklyBoss: any, dream: any, account: any) => {
  const totalUpgrade = dream.slice(DREAM_UPGRADES_OFFSET, dreamUpgradesEnd()).reduce((accumulator: any, currentValue: any) => accumulator + currentValue, 0);
  const clouds: Record<string, any> = Object.keys(weeklyBoss).filter(key => key.startsWith('d_')).reduce((obj: Record<string, any>, key) => {
    obj[key.substring(2)] = weeklyBoss[key];
    return obj;
  }, {});
  const completedClouds = Object.values(clouds).reduce((sum: any, key) => sum + (key === -1 ? 1 : 0), 0)
  let nbChallengeActive = Math.min(5, dream[2]);
  const researchG8Level = getResearchGridBonus(account, 86, 1);
  const challenges = equinoxChallenges.map(({ label, goal, reward }, index) => ({
    label,
    goal,
    reward,
    current: clouds[index] || 0,
    active: clouds[index] !== -1 && 0 < nbChallengeActive--,
    locked: index >= 36 && researchG8Level < 1
  }));
  const upgrades = parseEquinoxUpgrades(challenges, dream.slice(DREAM_UPGRADES_OFFSET, dreamUpgradesEnd()), account);
  const bundleBonus = isBundlePurchased(account, 'bun_q');
  const eqBarVial = getVialsBonusByStat(account?.alchemy?.vials, 'EqBar');
  const voteBonus = getVoteBonus(account, 32);
  const eventShopBonus = getEventShopBonus(account, 3);
  const companionBonus = isCompanionBonusActive(account, 15) ? (account?.companions?.list?.at(15)?.bonus ?? 0) : 0;
  const cosmoBonus = getCosmoBonus({ majik: account?.hole?.holesObject?.idleonMajiks, t: 2, i: 5 }) || 0;
  const arcadeBonus = getArcadeBonus(account?.arcade?.shop, 'Equinox_Fill_Rate')?.bonus || 0;
  const emperorBonus = getEmperorBonus(account, 5);
  const tesseractBonus = getTesseractBonus(account, 37);
  const loreEpiBonus = getLoreBossBonus(account, 8) ?? 0;
  // game: ArmoryUpgBonus(76) - Farmer_Joe, "+{% Equinox Bar Fill rate".
  const armoryBonus76 = getArmoryUpgradeBonus(account, 76);

  const cb = (i: number) => getCloudBonus(challenges, i);
  const cloudsBonus =
    10 * cb(3) + 15 * cb(9) + 20 * cb(14) + 25 * cb(19)
    + 30 * cb(22) + 35 * cb(24) + 40 * cb(29)
    + 60 * cb(38) + 65 * cb(40) + 75 * cb(44)
    + 90 * cb(46) + 100 * cb(48) + 120 * cb(51)
    + 150 * cb(54) + 160 * cb(56) + 170 * cb(57)
    + 185 * cb(60) + 190 * cb(62) + 195 * cb(63)
    + 200 * cb(65) + 220 * cb(68) + 250 * cb(74);

  const researchG8Bonus = getResearchGridBonus(account, 86, 0);
  const cloudMulti45 = 3 * cb(45);
  const cloudMulti49 = 5 * cb(49);
  const cloudMulti52 = 6 * cb(52);
  const cloudMulti59 = 7 * cb(59);
  const cloudMulti67 = 7 * cb(67);

  const base = (1 + voteBonus / 100)
    * (1 + researchG8Bonus / 100)
    * (1 + loreEpiBonus / 100)
    * (1 + companionBonus)
    * (1 + cosmoBonus / 100)
    * (1 + 0.5 * eventShopBonus)
    * (1 + (account?.accountOptions?.[320] ?? 0) / 10)
    * (1 + tesseractBonus / 100)
    * (1 + armoryBonus76 / 100)
    * (1 + cloudMulti45 / 100)
    * (1 + cloudMulti49 / 100)
    * (1 + cloudMulti52 / 100)
    * (1 + cloudMulti59 / 100)
    * (1 + cloudMulti67 / 100)
    * (1 + (eqBarVial + cloudsBonus + arcadeBonus + emperorBonus) / 100)

  const baseRate = bundleBonus ? EQUINOX_BUNDLE_RATE : EQUINOX_BASE_RATE;
  const chargeRate = Math.round(baseRate * base);
  const breakdown = createBreakdown('Equinox fill rate', `${chargeRate} / hr`, [
    flat('Base', baseRate, bundleBonus ? { note: 'Bundle owned' } : {}),
    productGroup(NUMBERED_GROUP, [
      additiveGroup(NUMBERED_GROUP, [
        percent('Vial', eqBarVial),
        percent('Clouds', cloudsBonus),
        percent('Arcade', arcadeBonus),
        percent('Emperor', emperorBonus)
      ]),
      multiplier('Vote', 1 + voteBonus / 100),
      multiplier('Research G8', 1 + researchG8Bonus / 100),
      multiplier('Tome', 1 + loreEpiBonus / 100),
      multiplier('Companion', 1 + companionBonus),
      multiplier('Cosmo', 1 + cosmoBonus / 100),
      multiplier('Event shop', 1 + 0.5 * eventShopBonus),
      multiplier('Penguins', 1 + (account?.accountOptions?.[320] ?? 0) / 10),
      multiplier('Tesseract', 1 + tesseractBonus / 100),
      multiplier('Farmer Joe (Armory)', 1 + armoryBonus76 / 100),
      multiplier('Cloud 45', 1 + cloudMulti45 / 100),
      multiplier('Cloud 49', 1 + cloudMulti49 / 100),
      multiplier('Cloud 52', 1 + cloudMulti52 / 100),
      multiplier('Cloud 59', 1 + cloudMulti59 / 100),
      multiplier('Cloud 67', 1 + cloudMulti67 / 100)
    ])
  ], { round: 'round' });

  // BarFillReq: no outer rounding since 2.3.525.
  const chargeRequired = (120 + 40 * totalUpgrade) * Math.pow(1.02, totalUpgrade);
  const currentCharge = dream?.[0];
  const timeToFull = new Date().getTime() + ((chargeRequired - currentCharge) / chargeRate * 1000 * 3600);

  return {
    currentCharge,
    chargeRequired,
    chargeRate,
    timeToFull,
    challenges,
    upgrades,
    completedClouds,
    rawDream: dream,
    breakdown,
    expression: `const base = (1 + voteBonus / 100)
    * (1 + companionBonus * 2.5)
    * (1 + cosmoBonus / 100)
    * (1 + .5 * eventShopBonus)
    * (1 + (penguins) / 10)
    * (1 + (eqBarVial + cloudsBonus + arcadeBonus + emperorBonus) / 100);
const chargeRate = bundleBonus ? Math.round(90 * base) : Math.round(60 * base)
    `
  };
}

// game: Dreamstuff("UpgUnlocked") = 1 + the CloudBonus of these clouds ("Unlock next Equinox upgrade")
const UPGRADE_UNLOCK_CLOUDS = [0, 2, 5, 7, 10, 13, 17, 20, 23, 28, 31, 36];

const parseEquinoxUpgrades = (challenges: any, dream: any, account: any) => {
  const nbChallengeUnlocked = UPGRADE_UNLOCK_CLOUDS.reduce((sum, index) => sum + getCloudBonus(challenges, index), 0);
  return equinoxUpgrades.map(({ name, description, maxLevel, bonus }, index) => {
    const realBonus = name === 'Hmm...' ? 0 : name === 'Food_Lust'
      ? Math.min(parseInt(dream[index]), account?.accountOptions?.[193] ?? 0)
      : bonus * dream[index] || 0;
    const winBonus = getWinnerBonus(account, '+{ Equinox Max LV');
    const cloudBonusMap = {
      4: 5 * getCloudBonus(challenges, 12) +
        10 * getCloudBonus(challenges, 18) +
        10 * getCloudBonus(challenges, 34) +
        10 * getCloudBonus(challenges, 39),
      5: 6 * getCloudBonus(challenges, 32),
      8: 5 * getCloudBonus(challenges, 21) + 10 * getCloudBonus(challenges, 26),
      9: 4 * getCloudBonus(challenges, 25),
      10: 4 * getCloudBonus(challenges, 30),
      11: 15 * getCloudBonus(challenges, 35)
    };
    const superbitBonus = isSuperbitUnlocked(account, 'Equinox_Unending') ? 10 : 0;
    let totalValue;

    if (index === 3) {
      totalValue = Math.round(
        maxLevel
        + 3 * getCloudBonus(challenges, 6)
        + 4 * getCloudBonus(challenges, 15)
      );
    }
    else if (index === 7) {
      totalValue = Math.round(
        maxLevel
        + winBonus
        + superbitBonus
      );
    }
    else if (index === 12) {
      totalValue = Math.round(
        maxLevel
        + winBonus
        + 5 * getCloudBonus(challenges, 37)
        + 5 * getCloudBonus(challenges, 42)
        + 5 * getCloudBonus(challenges, 43)
        + 5 * getCloudBonus(challenges, 47)
        + 5 * getCloudBonus(challenges, 50)
        + 5 * getCloudBonus(challenges, 55)
        + 6 * getCloudBonus(challenges, 58)
        + 6 * getCloudBonus(challenges, 61)
        + 7 * getCloudBonus(challenges, 64)
        + 8 * getCloudBonus(challenges, 75)
      );
    }
    else if (index in cloudBonusMap) {
      totalValue = Math.round(
        maxLevel
        + winBonus
        + superbitBonus
        + (cloudBonusMap as Record<number, number>)[index]
      );
    }
    else {
      totalValue = Math.round(maxLevel);
    }

    return {
      name: name,
      bonus: realBonus,
      desc: description?.replace('{}', String(bonus * dream[index] || 0)).replace('{', '').replace('}', String(dream[index] || 0)).split('_@_'),
      lvl: dream[index] || 0,
      maxLvl: totalValue,
      unlocked: index <= nbChallengeUnlocked
    }
  });
};

// Equinox clouds whose reward lands in another system's formula (the fill rate and upgrade max levels
// above read theirs in place). Index = the challenge's position in equinoxChallenges.
export const EQUINOX_CLOUD = {
  FOOD_LUST_DISCOUNT: 33,
  MINEHEAD_DEPTH_CHARGE: 41,
  SNEAKING_CHARM_MAX_LV: 53,
  EXOTIC_MARKET_PURCHASES: 66,
  DROP_RATE: 69,
  CLASS_EXP: 70,
  RESEARCH_GRID_1: 71,
  RESEARCH_GRID_2: 72,
  RIBBON_MULTI: 73,
  RESEARCH_GRID_3: 76
} as const;

// Dreamstuff("CloudBonus", index) - returns 1 when equinox challenge `index` is complete, 0 otherwise.
// It is a completion flag, not a magnitude: "clouds" are the challenges themselves (CloudX/CloudY are
// only their on-screen grid positions), and every caller applies its own multiplier, e.g. 5 * cb / 100.
// game: "CloudBonus"
export const getCloudBonus = (challenges: any, index: number) => challenges?.[index]?.current === -1 ? 1 : 0;

export const getEquinoxBonus = (upgrades: any, name: any) => {
  return (upgrades || [])?.filter((upgrade: any) => upgrade.name === name)?.[0]?.bonus || 0;
};