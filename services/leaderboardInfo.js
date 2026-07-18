import { getCashMulti, getDropRate } from '@parsers/character';
import { getMaxDamage } from '@parsers/damage';
import { calcTotalBoatLevels } from '@parsers/world-5/sailing';
import { differenceInYears } from 'date-fns';

// Kept out of services/profiles.js on purpose: profiles.js is imported eagerly by
// AppProvider (every page), and this function pulls the parsers graph + website-data
// (9.8MB JSON) with it. Consumers import this module lazily or at page level.
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
  const tomePoints = (account?.tome?.tome || []).map(t => t?.points ?? 0);
  const tomeRankThresholds = account?.tome?.tops || [];
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
    tomePoints,
    tomeRankThresholds,
    highestVillagerExpPerHour,
    topKilledMonsters: account?.topKilledMonsters,
    accountAge: differenceInYears(new Date(), new Date(account?.accountCreateTime)),
    currentWorld: account?.currentWorld,
    cashMulti: withDefault(cashMulti),
    highestSpelunkingPower: withDefault(account?.spelunking?.power?.value)
  }
}

const withDefault = (value, defaultValue = 0) => {
  return isNaN(value) ? defaultValue : value;
}
