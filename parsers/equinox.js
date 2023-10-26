import { equinoxChallenges, equinoxUpgrades } from '../data/website-data';
import { tryToParse } from '../utility/helpers';
import { getVialsBonusByStat } from 'parsers/alchemy';
import { isBundlePurchased } from './misc';

export const getEquinox = (idleonData, account) => {
  const weeklyBoss = tryToParse(idleonData?.WeeklyBoss) || idleonData?.WeeklyBoss;
  const dream = tryToParse(idleonData?.Dream) || idleonData?.Dream;
  if (!weeklyBoss || !dream) return null;
  return parseEquinox(weeklyBoss, dream, account);
}

const parseEquinox = (weeklyBoss, dream, account) => {
  const totalUpgrade = dream.slice(2, 13).reduce((accumulator, currentValue) => accumulator + currentValue, 0);
  const equinoxResult = Object.keys(weeklyBoss).filter(key => key.startsWith('d_')).reduce((obj, key) => {
    obj[key.substring(2)] = weeklyBoss[key];
    return obj;
  }, {});

  let nbChallengeActive = dream[2];
  const challenges = equinoxChallenges.map(({ label, goal, reward }, index) => ({
    label,
    goal,
    reward,
    current: equinoxResult[index] || 0,
    active: equinoxResult[index] !== -1 && 0 < nbChallengeActive--,
  }));
  const upgrades = parseEquinoxUpgrades(challenges, dream.slice(2, 13), account.accountOptions);

  const bundleBonus = isBundlePurchased(account?.bundles, 'bun_q') ? 50 : 0;
  const eqBarVial = getVialsBonusByStat(account?.alchemy?.vials, 'EqBar');

  const chargeRate = Math.round(60 * (1 + (bundleBonus) / 100) * (1 + (eqBarVial + 10 * (equinoxResult[3] === -1) + 15 * (equinoxResult[9] === -1) + 20 * (equinoxResult[14] === -1) + 25 * (equinoxResult[19] === -1) + 30 * (equinoxResult[22] === -1) + 35 * (equinoxResult[24] === -1) + 40 * (equinoxResult[29] === -1)) / 100))
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
  };
}

const parseEquinoxUpgrades = (challenges, dream, accountOptions) => {
  const increasedMaxLvl = challenges.filter(challenge => challenge.current === -1 && challenge.reward.includes('Max_LV')).map(challenge => challenge.reward);
  const nbChallengeUnlocked = challenges.filter(challenge => challenge.current === -1 && challenge.reward === 'Unlock_next_Equinox_upgrade').length
  return equinoxUpgrades.map(({ name, description, maxLevel, bonus }, index) => ({
    name: name,
    bonus: name === 'Food_Lust'
      ? Math.min(parseInt(dream[index]), accountOptions?.[193])
      : bonus * dream[index] || 0,
    desc: description?.replace('{}', bonus * dream[index] || 0).replace('{', '').split('_@_'),
    lvl: dream[index] || 0,
    maxLvl: maxLevel + increasedMaxLvl.filter(reward => reward.includes(name)).reduce((accumulator, currentValue) => accumulator + (parseInt(currentValue.match(/\d+/)[0], 10)), 0),
    unlocked: index <= nbChallengeUnlocked,
  }));
};

export const getEquinoxBonus = (upgrades, name) => {
  return upgrades?.filter(upgrade => upgrade.name === name)?.[0]?.bonus || 0;
};