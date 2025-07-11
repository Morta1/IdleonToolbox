import { tryToParse } from '@utility/helpers';
import { getCashMulti, getDropRate } from '@parsers/character';
import { getMaxDamage } from '@parsers/damage';
import { calcTotalBoatLevels } from '@parsers/sailing';
import { differenceInYears } from 'date-fns';

const url = process.env.NEXT_PUBLIC_PROFILES_URL;
// const url = 'http://localhost:8787/api';
export const uploadProfile = async ({ profile, leaderboardConsent }, token) => {
  try {
    const parsedProfile = parseProfile(profile);
    const response = await fetch(`${url}/profiles`, {
      method: 'POST',
      body: JSON.stringify({ profile: parsedProfile, leaderboardConsent }),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      }
    });
    if (response?.status !== 200) {
      throw response;
    }
    return response;
  } catch (err) {
    console.error('Error has occurred: ', err);
    if (err?.status === 429) {
      throw 'You have uploaded your profile in the past 4 hours. Please wait until the cooldown is over.'
    } else if (err?.status === 500 || err?.status === 400) {
      throw 'An error has occurred while uploading your profile. Please try again later.'
    }
    throw 'An error has occurred while uploading your profile. Please try again later.';
  }
}

export const getProfile = async ({ mainChar }) => {
  try {
    const response = await fetch(`${url}/profiles/?profile=${mainChar}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    if (!response) return null
    return await response?.json();
  } catch (e) {
    console.error(`${__filename} -> Error has occurred while getting profile for ${mainChar}`);
    throw e;
  }
}

export const fetchLeaderboard = async (leaderboard) => {
  try {
    const response = await fetch(`${url}/leaderboards?leaderboard=${leaderboard}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    if (!response) return null
    return await response?.json();
  } catch (e) {
    console.error(`${__filename} -> Error has occurred while getting leaderboards`);
    throw e;
  }
}

export const fetchUserLeaderboards = async (leaderboard, leaderboardUser) => {
  try {
    const response = await fetch(`${url}/leaderboards?leaderboard=${leaderboard}&leaderboardUser=${leaderboardUser}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    if (!response) return null
    return await response?.json();
  } catch (e) {
    console.error(`${__filename} -> Error has occurred while getting leaderboards`);
    throw e;
  }
}

export const expandLeaderboardInfo = (account, characters) => {
  const dropRate = Math.max(...characters.map(character => getDropRate(character, account, characters)?.dropRate || 0));
  const cashMulti = Math.max(...characters.map(character => getCashMulti(character, account, characters)?.cashMulti || 0));
  const playersInfo = characters.map(character => getMaxDamage(character, characters, account));
  const defence = Math.max(...playersInfo.map(({ defence }) => defence?.value));
  const accuracy = Math.max(...playersInfo.map(({ accuracy }) => accuracy));
  const hp = Math.max(...playersInfo.map(({ maxHp }) => maxHp));
  const mp = Math.max(...playersInfo.map(({ maxMp }) => maxMp));
  const greenMushroomKills = account?.deathNote?.[0]?.mobs?.[0]?.kills || 0;
  const totalBoats = calcTotalBoatLevels(account?.sailing?.boats);
  const totalTomePoints = account?.tome?.totalPoints;
  const logbooks = account?.gaming?.logBook?.reduce((sum, { unlocked }) => sum + unlocked, 0);
  const villagers = account?.hole?.villagers?.map(({ expRate }) => expRate.value)?.filter(val => val > 0);
  const highestVillagerExpPerHour = villagers?.length > 0 ? Math.max(...villagers) : 0;
  return {
    dropRate: Math.max(dropRate, withDefault(account.accountOptions?.[200])),
    defence: withDefault(defence),
    accuracy: withDefault(accuracy),
    hp: withDefault(hp),
    mp: withDefault(mp),
    logBook: logbooks,
    totalShinyLevels: withDefault(account?.breeding?.totalShinyLevels),
    totalBreedabilityLevels: withDefault(account?.breeding?.totalBreedabilityLv),
    slab: withDefault(account?.looty?.lootedItems, 0),
    greenMushroomKills,
    totalBoats,
    totalTomePoints: withDefault(totalTomePoints, 0),
    highestVillagerExpPerHour,
    topKilledMonsters: account?.topKilledMonsters,
    accountAge: differenceInYears(new Date(), new Date(account?.accountCreateTime)),
    currentWorld: account?.currentWorld,
    cashMulti: withDefault(cashMulti)
  }
}
const withDefault = (value, defaultValue = 0) => {
  return isNaN(value) ? defaultValue : value;
}

const parseProfile = (profile) => {
  const data = Object.entries(profile.data).reduce((acc, [key, value]) => {
    acc[key] = tryToParse(value);
    return acc;
  }, {});
  return {
    ...profile,
    data
  }
}