import { getCashMulti, getDropRate } from '@parsers/character';
import { getMaxDamage } from '@parsers/damage';
import { calcTotalBoatLevels } from '@parsers/world-5/sailing';
import { getMaps } from '@parsers/class-specific/tesseract';
import { highestArcaneMapMulti, outpostInfo } from './leaderboardMasterclass';
import { differenceInYears } from 'date-fns';
import { OPT } from '@parsers/accountOptions';
import { calcCardsLevels } from '@parsers/cards';
import { calcTotalKillsDigits } from '@parsers/world-3/deathNote';
import { getExaltedStampBonus } from '@parsers/world-1/stamps';
import { getGoldenFoodMulti } from '@parsers/misc';
import { getPrismaMulti } from '@parsers/class-specific/tesseract';
import { calcTimePerEgg } from '@parsers/world-4/breeding';
import { getGalleryBonusMulti } from '@parsers/world-7/gallery';
import { getCropEvolution } from '@parsers/world-6/farming';
import { evaluateBreakdownNode } from '@parsers/breakdown';

// Kept out of services/profiles.js on purpose: profiles.js is imported eagerly by
// AppProvider (every page), and this function pulls the parsers graph + website-data
// (9.8MB JSON) with it. Consumers import this module lazily or at page level.
export const expandLeaderboardInfo = (account, characters) => {
  const dropRate = Math.max(...characters.map(character => getDropRate(character, account, characters)?.dropRate || 0));
  const playersInfo = characters.map(character => getMaxDamage(character, characters, account));
  const cashMulti = Math.max(...characters.map((character, index) => getCashMulti(character, account, characters, playersInfo[index])?.cashMulti || 0));
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
  const totalVillagerExpPerHour = villagers?.reduce((sum, expRate) => sum + expRate, 0) ?? 0;
  return {
    dropRate: Math.max(dropRate, withDefault(account.accountOptions?.[OPT.highestDropRateMulti])),
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
    totalVillagerExpPerHour,
    topKilledMonsters: account?.topKilledMonsters,
    accountAge: differenceInYears(new Date(), new Date(account?.accountCreateTime)),
    currentWorld: account?.currentWorld,
    cashMulti: withDefault(cashMulti),
    highestSpelunkingPower: withDefault(account?.spelunking?.power?.value),
    ...outpostInfo(account?.royalGuardian?.outposts),
    highestArcaneMapMulti: highestArcaneMapMulti(arcaneMaps(account, characters)),
    sproutSpeed: sproutCyclesPerHour(account),
    ...moreBoards(account, characters)
  }
}

// The 2026-11 boards that need the parsers (the rest read the raw save in the worker). Each value is guarded on its own: a section that throws or reads NaN uploads 0, never a failed upload.
const ORB_OF_REMEMBRANCE = 168;
const sum = (list, valueOf) => (list ?? []).reduce((total, item) => total + (Number(valueOf(item)) || 0), 0);
const maxOf = (characters, valueOf) => Math.max(0, ...(characters ?? []).map((character) => Number(valueOf(character)) || 0));
const safe = (valueOf) => {
  try {
    const value = Number(valueOf());
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
};
// A multi still at its 1x base means the feature is locked: 0 keeps those accounts off the board.
const aboveBase = (multi) => (multi > 1 ? multi : 0);
const hasExaltedStamp = (account) => Object.values(account?.compass?.exaltedStamps ?? {})
  .some((tree) => Object.values(tree ?? {}).some(Boolean));
// A "fastest" board stores runs per hour so the fastest ranks first; the site shows it as seconds again.
const perHour = (seconds) => (seconds > 0 ? 3600 / seconds : 0);

const moreBoards = (account, characters) => {
  const boards = {
    totalCardLevels: () => calcCardsLevels(account?.cards),
    goldenFoodBonus: () => maxOf(characters, (character) => 100 * (getGoldenFoodMulti(character, account, characters)?.value - 1)),
    totalDeathNoteDigits: () => calcTotalKillsDigits(account?.deathNote),
    orbOfRemembranceLevel: () => maxOf(characters, (character) => character?.flatTalents?.find(({ skillIndex }) => skillIndex === ORB_OF_REMEMBRANCE)?.level),
    exaltedStampMulti: () => (hasExaltedStamp(account) ? 1 + getExaltedStampBonus(account)?.value / 100 : 0),
    // getPrismaMulti reads 2x with no prisma bubble at all
    prismaBubbleMulti: () => (account?.accountOptions?.[OPT.prismaBubbles] ? getPrismaMulti(account)?.value : 0),
    meritocracyMulti: () => account?.voteBallot?.meritocracyMult,
    hatRackMulti: () => (account?.hatRack?.totalHats > 0 ? account?.hatRack?.bonusMulti : 0),
    fastestEggTime: () => (account?.totalSkillsLevels?.breeding?.level > 0 ? perHour(calcTimePerEgg(account) / 1000) : 0),
    totalPetPower: () => sum(account?.companions?.list?.filter((companion) => companion?.copies > 0), (companion) => companion?.tourPower),
    crystalGlunkoCoveDropRate: () => aboveBase(account?.hole?.caverns?.crystalGlunkoCove?.dropRate),
    monumentAfkGain: () => account?.hole?.caverns?.bravery?.afkPercent?.effectiveValue,
    lumiPerHour: () => account?.menagerie?.lumiRate,
    // Group 1 of the evolution chance, on the first plot
    cropEvolutionMulti: () => aboveBase(maxOf(characters, (character) => evaluateBreakdownNode(
      getCropEvolution(account, character, account?.farming?.plot?.[0], false, characters)?.breakdown?.tree?.[1]))),
    galleryMulti: () => aboveBase(maxOf(characters, (character) => getGalleryBonusMulti(account?.gallery?.rawSpelunk, account, character))),
  };
  return Object.fromEntries(Object.entries(boards).map(([key, valueOf]) => [key, safe(valueOf)]));
};

// Sprout Speed ranks fastest first, so the board stores growth cycles per hour; the site shows it as seconds again.
// OptLacc[411] (100x slower sprouts for 100x bits) is a player setting, not progress, so the board ranks with it off.
const sproutCyclesPerHour = (account) => {
  const gaming = account?.gaming;
  if (!gaming?.unlocked || !(gaming?.sproutGrowSeconds > 0)) return 0;
  const toggle = Number(account?.accountOptions?.[411]) || 0;
  return 3600 * (1 + 99 * toggle) / gaming.sproutGrowSeconds;
};

// getMaps destructures account.tesseract, so an account without it gets no maps.
const arcaneMaps = (account, characters) => {
  if (!account?.tesseract) return [];
  return characters.map((character) => getMaps(account, characters, character) ?? []);
};

const withDefault = (value, defaultValue = 0) => {
  return isNaN(value) ? defaultValue : value;
}
