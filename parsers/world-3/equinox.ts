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

export const getEquinox = (idleonData: any, account: any) => {
  const weeklyBoss = tryToParse(idleonData?.WeeklyBoss) || idleonData?.WeeklyBoss;
  const dream = tryToParse(idleonData?.Dream) || idleonData?.Dream;
  if (!weeklyBoss || !dream) return null;
  return parseEquinox(weeklyBoss, dream, account);
}

const parseEquinox = (weeklyBoss: any, dream: any, account: any) => {
  const totalUpgrade = dream.slice(2, 16).reduce((accumulator: any, currentValue: any) => accumulator + currentValue, 0);
  const clouds: Record<string, any> = Object.keys(weeklyBoss).filter(key => key.startsWith('d_')).reduce((obj: Record<string, any>, key) => {
    obj[key.substring(2)] = weeklyBoss[key];
    return obj;
  }, {});
  const completedClouds = Object.values(clouds).reduce((sum: any, key) => sum + (key === -1 ? 1 : 0), 0)
  let nbChallengeActive = dream[2];
  const challenges = equinoxChallenges.map(({ label, goal, reward }, index) => ({
    label,
    goal,
    reward,
    current: clouds[index] || 0,
    active: clouds[index] !== -1 && 0 < nbChallengeActive--
  }));
  const upgrades = parseEquinoxUpgrades(challenges, dream.slice(2, 14), account);
  const bundleBonus = isBundlePurchased(account?.bundles, 'bun_q');
  const eqBarVial = getVialsBonusByStat(account?.alchemy?.vials, 'EqBar');
  const voteBonus = getVoteBonus(account, 32);
  const eventShopBonus = getEventShopBonus(account, 3);
  const companionBonus = isCompanionBonusActive(account, 15) ? (account?.companions?.list?.at(15)?.bonus ?? 0) : 0;
  const cosmoBonus = getCosmoBonus({ majik: account?.hole?.holesObject?.idleonMajiks, t: 2, i: 5 }) || 0;
  const arcadeBonus = getArcadeBonus(account?.arcade?.shop, 'Equinox_Fill_Rate')?.bonus || 0;
  const emperorBonus = getEmperorBonus(account, 5);
  const tesseractBonus = getTesseractBonus(account, 37);
  const loreEpiBonus = getLoreBossBonus(account, 8) ?? 0;

  const cloudsBonus = (
    (10 * Number(clouds[3] === -1)
      + (15 * Number(clouds[9] === -1)
        + (20 * Number(clouds[14] === -1)
          + (25 * Number(clouds[19] === -1)
            + (30 * Number(clouds[22] === -1)
              + (35 * Number(clouds[24] === -1)
                + 40 * Number(clouds[29] === -1))))))));

  const base = (1 + voteBonus / 100)
    * (1 + loreEpiBonus / 100)
    * (1 + companionBonus)
    * (1 + cosmoBonus / 100)
    * (1 + 0.5 * eventShopBonus)
    * (1 + account?.accountOptions?.[320] / 10)
    * (1 + tesseractBonus / 100)
    * (1 + (eqBarVial + cloudsBonus + arcadeBonus + emperorBonus) / 100)

  const breakdown = [
    { title: 'Multiplicative' },
    { name: '' },
    { name: 'Arcade', value: arcadeBonus / 100 },
    { name: 'Vote', value: voteBonus / 100 },
    { name: 'Cosmo', value: cosmoBonus / 100 },
    { name: 'Tome', value: loreEpiBonus / 100 },
    { name: 'Companion', value: companionBonus },
    { name: 'Event shop', value: .5 * eventShopBonus },
    { name: 'Penguins', value: 1 + account?.accountOptions?.[320] / 10 },
    { name: 'Vial', value: eqBarVial / 100 },
    { name: 'Clouds', value: cloudsBonus / 100 },
    { name: 'Emperor', value: emperorBonus / 100 },
    { name: 'Tesseract', value: tesseractBonus / 100 },
    { name: 'Bundle*', value: bundleBonus ? 90 : 60 }
  ]

  const chargeRate = bundleBonus ? Math.round(90 * base) : Math.round(60 * base);

  const chargeRequired = Math.round((120 + 40 * totalUpgrade) * Math.pow(1.02, totalUpgrade));
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

const parseEquinoxUpgrades = (challenges: any, dream: any, account: any) => {
  const nbChallengeUnlocked = challenges.filter((challenge: any) => challenge.current === -1 && challenge.reward === 'Unlock_next_Equinox_upgrade').length;
  return equinoxUpgrades.map(({ name, description, maxLevel, bonus }, index) => {
    const realBonus = name === 'Hmm...' ? 0 : name === 'Food_Lust'
      ? Math.min(parseInt(dream[index]), account?.accountOptions?.[193])
      : bonus * dream[index] || 0;
    const winBonus = getWinnerBonus(account, '+{ Equinox Max LV');
    const cloudBonusMap = {
      4: 5 * getCloudBonus(challenges, 12) +
        10 * getCloudBonus(challenges, 18) +
        10 * getCloudBonus(challenges, 34),
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

const getCloudBonus = (arr: any, index: any) => {
  const bonus = arr.find((challenge: any, ind: any) => ind === index && challenge.current === -1);
  return bonus ? 1 : 0;
}

export const getEquinoxBonus = (upgrades: any, name: any) => {
  return (upgrades || [])?.filter((upgrade: any) => upgrade.name === name)?.[0]?.bonus || 0;
};