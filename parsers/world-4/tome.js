import { ninjaExtraInfo, tomeData } from '../../data/website-data';
import { calcStampLevels } from '@parsers/stamps';
import { calcStatueLevels, calcTotalOnyx } from '@parsers/statues';
import { calcCardsLevels } from '@parsers/cards';
import { calcTalentMaxLevel, calcTotalStarTalent } from '@parsers/talents';
import { calcTotalQuestCompleted, getEventShopBonus } from '@parsers/misc';
import { calcTotalTasks } from '@parsers/tasks';
import { calcTotalAchievements } from '@parsers/achievements';
import { calcObolsFound, calcTrophiesFound } from '@parsers/items';
import { calcBubbleLevels, calcSigilsLevels, calcVialsLevels, getBubbleBonus } from '@parsers/alchemy';
import { calcTotalKillsDigits } from '@parsers/deathNote';
import { calcTotalAtomLevels } from '@parsers/atomCollider';
import { calcTotalMeals, getTotalKitchenLevels } from '@parsers/cooking';
import { calcTotalItemInStorage } from '@parsers/storage';
import { calcHighestPower } from '@parsers/breeding';
import { calcColoTotalScore, calcMinigameTotalScore } from '@parsers/highScores';
import { calcArtifactsAcquired, calcTotalBoatLevels } from '@parsers/sailing';
import { calcTotalBeanstalkLevel } from '@parsers/world-6/sneaking';
import { calcTotalPrayersLevel } from '@parsers/prayers';
import { lavaLog } from '@utility/helpers';

export const getTome = (idleonData, account, characters, serverVars) => {
  const indexes = ninjaExtraInfo[32].split(' ');
  const bonusNames = ninjaExtraInfo[33].split(' ');
  const tomeQuantities = calcTomeQuantity(account, characters, idleonData);
  let totalPoints = 0;
  const tome = tomeData.map((bonus, index) => {
    const realIndex = indexes.indexOf(index.toString());
    const tomeLvReq = 50 * realIndex + (10 * Math.max(0, realIndex - 30) + 10 * Math.max(0, realIndex - 50)) + 500;
    const quantity = tomeQuantities?.[index] || 0;
    const pointsPercent = calcPointsPercent(bonus, quantity);
    const color = .4 > pointsPercent ? '#ffc277' : .75 > pointsPercent ? '#d6dbe0' : .999 > pointsPercent
      ? 'gold'
      : '#56ccff';
    const points = Math.ceil(pointsPercent * bonus?.x3);
    totalPoints += account?.accountLevel > tomeLvReq ? points : 0;
    return {
      ...bonus,
      tomeLvReq,
      index: realIndex,
      quantity: tomeQuantities?.[index] || 0,
      points,
      color
    }
  });
  const bonuses = bonusNames.map((name, index) => ({
    name: name.replace('+{%', ''),
    bonus: getTomeBonus(account, totalPoints, index)
  }))
  tome.sort((a, b) => a.index - b.index);
  const tops = serverVars?.TomePct || [];
  const top = tops.reduce((res, topScore, index) => totalPoints > topScore ? index : res, -1);
  return {
    tome,
    bonuses,
    totalPoints,
    tops,
    top
  };
}

const getTomeBonus = (account, totalPoints, index) => {
  const strTomeBonus = getBubbleBonus(account?.alchemy?.bubbles, 'power', 'TOME_STRENGTH');
  const agiTomeBonus = getBubbleBonus(account?.alchemy?.bubbles, 'quicc', 'TOME_AGILITY');
  const wisTomeBonus = getBubbleBonus(account?.alchemy?.bubbles, 'high-iq', 'TOME_WISDOM');
  const multiplier = (totalPoints - 5000) / 2000;
  return 0 === index
    ? 10 * Math.pow(Math.floor(totalPoints / 100), 0.7)
    : 1 === index ? (1 === account?.accountOptions?.[196]
        ? 4 * Math.pow(Math.floor(Math.max(0, totalPoints - 4e3) / 100), 0.7)
        : 0)
      : 2 === index ? (1 === account?.accountOptions?.[197]
          ? 2 * Math.pow(Math.floor(Math.max(0, totalPoints - 8e3) / 100), 0.7) : 0)
        : 3 === index ? strTomeBonus * multiplier
          : 4 === index ? agiTomeBonus * multiplier
            : 5 === index ? wisTomeBonus * multiplier
              : 6 === index && getEventShopBonus(account, 0) ? 4 * Math.pow(Math.floor(totalPoints / 1e3), 0.4)
              : 0
}

const calcPointsPercent = (bonus, quantity) => {
  if (0 === bonus?.x2) {
    if (0 > quantity) {
      return 0;
    } else {
      return Math.pow((1.7 * quantity) / (quantity + (bonus?.x1)), 0.7);
    }
  } else if (1 === bonus?.x2) {
    return (2.4 * lavaLog(quantity)) / (2 * lavaLog(quantity) + (bonus?.x1));
  } else if (2 === bonus?.x2) {
    return Math.min(1, quantity / (bonus?.x1));
  } else if (3 === bonus?.x2) {
    if (quantity > 5 * (bonus?.x1)) {
      return 0;
    } else {
      return Math.pow((1.2 * (6 * (bonus?.x1) - quantity)) / (7 * (bonus?.x1) - quantity), 5);
    }
  } else {
    return 0;
  }
}

export const calcTomeQuantity = (account, characters) => {
  const quantities = [];
  quantities.push(calcStampLevels(account?.stamps));
  quantities.push(calcStatueLevels(account?.statues));
  quantities.push(calcCardsLevels(account?.cards));
  quantities.push(calcTalentMaxLevel(characters)); // TODO: CHECK
  quantities.push(calcTotalQuestCompleted(characters));
  quantities.push(account?.accountLevel);
  quantities.push(calcTotalTasks(account?.tasks));
  quantities.push(calcTotalAchievements(account?.achievements));
  quantities.push(account.accountOptions?.[198]);
  quantities.push(account.accountOptions?.[208]);
  quantities.push(calcTrophiesFound(account?.looty));
  quantities.push(Object.entries(account?.totalSkillsLevels).reduce((sum, [skill, { level }]) => skill !== 'character'
    ? sum + level
    : sum, 0));
  quantities.push(account.accountOptions?.[201]) // spike round
  quantities.push(account?.tasks?.[0]?.[0]?.[2]);
  quantities.push(account.accountOptions?.[172]); // DPS in shimmer island
  quantities.push(calcTotalStarTalent(characters, account));
  quantities.push(1 / account.accountOptions?.[202]); // crystal spawn
  quantities.push(account?.dungeons?.rank);
  quantities.push(account.accountOptions?.[200]); // highest drop multi
  quantities.push(account?.rawConstellationsDone);
  quantities.push(account.accountOptions?.[203]); // Gravestone damage
  quantities.push(calcObolsFound(account?.looty));
  quantities.push(calcBubbleLevels(account?.alchemy?.bubbles));
  quantities.push(calcVialsLevels(account?.alchemy?.vials));
  quantities.push(calcSigilsLevels(account?.alchemy?.p2w?.sigils));
  quantities.push(account.accountOptions?.[199]); // Jackpots Hit in Arcade
  quantities.push(account?.currencies?.DeliveryBoxComplete + account?.currencies?.DeliveryBoxStreak + account?.currencies?.DeliveryBoxMisc);
  quantities.push(account.accountOptions?.[204]); // killroy warrior
  quantities.push(account.accountOptions?.[205]); // killroy archer
  quantities.push(account.accountOptions?.[206]); // killroy mage
  quantities.push(1e3 - account.accountOptions?.[207]); // Fastest Time to kill Chaotic
  quantities.push(account.accountOptions?.[211]); // Largest_Oak_Log_Printer_Sample
  quantities.push(account.accountOptions?.[212]); // Largest_Copper_Ore_Printer_Sample
  quantities.push(account.accountOptions?.[213]); // Largest_Spore_Cap_Printer_Sample
  quantities.push(account.accountOptions?.[214]); // Largest_Goldfish_Printer_Sample
  quantities.push(account.accountOptions?.[215]); // Largest_Fly_Printer_Sample
  quantities.push(account.accountOptions?.[209]); // Best_Non_Duplicate_Goblin_Gorefest_Wave_
  quantities.push(account?.towers?.totalWaves);
  quantities.push(calcTotalKillsDigits(account?.deathNote));
  quantities.push(account?.equinox?.completedClouds);
  quantities.push(account?.refinery?.totalLevels);
  quantities.push(calcTotalAtomLevels(account?.atoms?.atoms));
  quantities.push(account?.towers?.totalLevels);
  quantities.push(calcTotalItemInStorage(account?.storage, 'Critter11A'));
  quantities.push(account.accountOptions?.[224]); // Most Greenstacks in Storage
  quantities.push(account.rift?.currentRift);
  quantities.push(calcHighestPower(account?.breeding));
  quantities.push(1e3 - account.accountOptions?.[220]); // Fastest Time reaching Round 100 Arena (in Seconds)
  quantities.push(getTotalKitchenLevels(account?.cooking?.kitchens));
  quantities.push(account?.breeding?.totalShinyLevels);
  quantities.push(calcTotalMeals(account?.cooking?.meals));
  quantities.push(account?.breeding?.totalBreedabilityLv);
  quantities.push(account?.lab?.totalRawChips);
  quantities.push(calcColoTotalScore(account?.highscores?.coloHighscores));
  quantities.push(account.accountOptions?.[217]); // Most Giants Killed in a Single Week
  quantities.push(calcTotalOnyx(account));
  quantities.push(1e3 - account.accountOptions?.[218]); // Fastest Time to Kill 200 Tremor Wurms (in Seconds)
  quantities.push(calcTotalBoatLevels(account?.sailing?.boats));
  quantities.push(account?.divinity?.godRank);
  quantities.push(account?.gaming?.totalPlantsPicked);
  quantities.push(calcArtifactsAcquired(account?.sailing?.artifacts));
  quantities.push(account?.sailing?.lootPile?.[0]?.amount);
  quantities.push(Math.max(...(account?.sailing?.captains?.map(({ level }) => level) || [])));
  quantities.push(Math.max(account?.gaming?.snailLevel, account.accountOptions?.[210]));
  quantities.push(account?.gaming?.bestNugget);
  quantities.push(account?.looty?.lootyRaw?.length);
  quantities.push(account?.gaming?.bits);
  quantities.push(Math.pow(2, account.accountOptions?.[219])); // Highest Crop OG
  quantities.push(account?.farming?.cropsFound);
  quantities.push(calcTotalBeanstalkLevel(account?.sneaking?.beanstalkData));
  quantities.push(account?.summoning?.totalUpgradesLevels);
  quantities.push(account?.summoning?.totalWins); // Best Endless Summoning Round - account.accountOptions?.[232] > 0 ? 12 * account.accountOptions?.[232] : 0
  quantities.push(account?.sneaking?.unlockedFloors);
  quantities.push(account?.summoning?.familiarsOwned);
  quantities.push(account?.sneaking?.totalJadeEmporiumUnlocked);
  quantities.push(calcMinigameTotalScore(account?.highscores?.minigameHighscores));
  quantities.push(calcTotalPrayersLevel(account?.prayers));
  quantities.push(account?.farming?.totalRanks); // total land ranks
  quantities.push(account.accountOptions?.[221]); // Largest Magic Bean Trade
  quantities.push(account.accountOptions?.[222]); // Most Balls earned from LBoFaF
  quantities.push(account.arcade?.totalUpgradeLevels);
  return quantities;
}