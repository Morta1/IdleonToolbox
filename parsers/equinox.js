import { equinoxChallenges, equinoxUpgrades } from '../data/website-data';
import { tryToParse } from '../utility/helpers';
import { getVialsBonusByStat } from 'parsers/alchemy';
import { eventShopPurchased, getEventShopBonus, isBundlePurchased } from './misc';
import { getVoteBonus } from '@parsers/world-2/voteBallot';
import { getWinnerBonus } from '@parsers/world-6/summoning';

export const getEquinox = (idleonData, account) => {
  const weeklyBoss = tryToParse(idleonData?.WeeklyBoss) || idleonData?.WeeklyBoss;
  const dream = tryToParse(idleonData?.Dream) || idleonData?.Dream;
  if (!weeklyBoss || !dream) return null;
  return parseEquinox(weeklyBoss, dream, account);
}

const parseEquinox = (weeklyBoss, dream, account) => {
  const totalUpgrade = dream.slice(2, 16).reduce((accumulator, currentValue) => accumulator + currentValue, 0);
  const clouds = Object.keys(weeklyBoss).filter(key => key.startsWith('d_')).reduce((obj, key) => {
    obj[key.substring(2)] = weeklyBoss[key];
    return obj;
  }, {});
  const completedClouds = Object.values(clouds).reduce((sum, key) => sum + (key === -1 ? 1 : 0), 0)
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
  const penguinsBonus = eventShopPurchased(account, 3);

  const base = (1 + (eqBarVial + (10 * (clouds[3] === -1) + (15 * (clouds[9] === -1) + (20 * (clouds[14] === -1) + (25 * (clouds[19] === -1) + (30 * (clouds[22] === -1) + (35 * (clouds[24] === -1) + 40 * (clouds[29] === -1)))))))) / 100);
  const chargeRate = (bundleBonus
    ? Math.round(90 * (1 + voteBonus / 100) * (1 + 0.5 * penguinsBonus) * (1 + account?.accountOptions?.[320] / 10) * (1 + 0.5 * eventShopBonus) * base)
    : Math.round(60 * (1 + voteBonus / 100) * (1 + 0.5 * penguinsBonus) * (1 + account?.accountOptions?.[320] / 10) * (1 + 0.5 * eventShopBonus) * base))

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
    completedClouds
  };
}

const parseEquinoxUpgrades = (challenges, dream, account) => {
  const nbChallengeUnlocked = challenges.filter(challenge => challenge.current === -1 && challenge.reward === 'Unlock_next_Equinox_upgrade').length;
  return equinoxUpgrades.map(({ name, description, maxLevel, bonus }, index) => {
    const realBonus = name === 'Hmm...' ? 0 : name === 'Food_Lust'
      ? Math.min(parseInt(dream[index]), account?.accountOptions?.[193])
      : bonus * dream[index] || 0;
    const winBonus = getWinnerBonus(account, '+{ Equinox Max LV');
    const cloudBonusMap = {
      3: 3 * getCloudBonus(challenges, 6) + 4 * getCloudBonus(challenges, 15),
      4: 5 * getCloudBonus(challenges, 12) +
        10 * getCloudBonus(challenges, 18) +
        10 * getCloudBonus(challenges, 34),
      5: 6 * getCloudBonus(challenges, 32),
      8: 5 * getCloudBonus(challenges, 21) + 10 * getCloudBonus(challenges, 26),
      9: 4 * getCloudBonus(challenges, 25),
      10: 4 * getCloudBonus(challenges, 30),
      11: 15 * getCloudBonus(challenges, 35)
    };
    const totalValue = index in cloudBonusMap
      ? maxLevel + winBonus + Math.round(cloudBonusMap[index])
      : index === 7
        ? maxLevel + winBonus
        : maxLevel;
    return {
      name: name,
      bonus: realBonus,
      desc: description?.replace('{}', bonus * dream[index] || 0).replace('{', '').replace('}', dream[index] || 0).split('_@_'),
      lvl: dream[index] || 0,
      maxLvl: totalValue,
      unlocked: index <= nbChallengeUnlocked
    }
  });
};

const getCloudBonus = (arr, index) => {
  const bonus = arr.find((challenge, ind) => ind === index && challenge.current === -1);
  return bonus ? 1 : 0;
}

export const getEquinoxBonus = (upgrades, name) => {
  return upgrades?.filter(upgrade => upgrade.name === name)?.[0]?.bonus || 0;
};