import { equinoxChallenges, equinoxUpgrades } from '../data/website-data';
import { tryToParse } from '../utility/helpers';
import { getVialsBonusByStat } from 'parsers/alchemy';
import { getEventShopBonus, isBundlePurchased } from './misc';
import { getVoteBonus } from '@parsers/world-2/voteBallot';

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
  const upgrades = parseEquinoxUpgrades(challenges, dream.slice(2, 14), account.accountOptions);
  const bundleBonus = isBundlePurchased(account?.bundles, 'bun_q');
  const eqBarVial = getVialsBonusByStat(account?.alchemy?.vials, 'EqBar');
  const voteBonus = getVoteBonus(account, 32);
  const eventShopBonus = getEventShopBonus(account, 3);

  const base = (1 + (eqBarVial + (10 * (clouds[3] === -1) + (15 * (clouds[9] === -1) + (20 * (clouds[14] === -1) + (25 * (clouds[19] === -1) + (30 * (clouds[22] === -1) + (35 * (clouds[24] === -1) + 40 * (clouds[29] === -1)))))))) / 100);
  const chargeRate = (bundleBonus
    ? Math.round(90 * (1 + voteBonus / 100) * (1 + 0.5 * eventShopBonus) * base)
    : Math.round(60 * (1 + voteBonus / 100) * (1 + 0.5 * eventShopBonus) * base))

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

const parseEquinoxUpgrades = (challenges, dream, accountOptions) => {
  const increasedMaxLvl = challenges.filter(challenge => challenge.current === -1 && challenge.reward.includes('Max_LV')).map(challenge => challenge.reward);
  const nbChallengeUnlocked = challenges.filter(challenge => challenge.current === -1 && challenge.reward === 'Unlock_next_Equinox_upgrade').length;
  return equinoxUpgrades.map(({ name, description, maxLevel, bonus }, index) => {
    const realBonus = name === 'Hmm...' ? 0 : name === 'Food_Lust'
      ? Math.min(parseInt(dream[index]), accountOptions?.[193])
      : bonus * dream[index] || 0;
    return {
      name: name,
      bonus: realBonus,
      desc: description?.replace('{}', bonus * dream[index] || 0).replace('{', '').replace('}', dream[index] || 0).split('_@_'),
      lvl: dream[index] || 0,
      maxLvl: maxLevel + increasedMaxLvl.filter(reward => reward.includes(name)).reduce((accumulator, currentValue) => accumulator + (parseInt(currentValue.match(/\d+/)[0], 10)), 0),
      unlocked: index <= nbChallengeUnlocked
    }
  });
};

export const getEquinoxBonus = (upgrades, name) => {
  return upgrades?.filter(upgrade => upgrade.name === name)?.[0]?.bonus || 0;
};