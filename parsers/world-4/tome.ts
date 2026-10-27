import type { IdleonData, Account } from '../types';
import { ninjaExtraInfo, tomeData } from '@website-data';
import { calcStampLevels } from '@parsers/world-1/stamps';
import { calcStatueLevels, calcTotalOnyx } from '@parsers/world-1/statues';
import { calcCardsLevels } from '@parsers/cards';
import { calcTalentMaxLevel, calcTotalStarTalent, getBestActiveCharacter, mainStatMap } from '@parsers/talents';
import { calcTotalQuestCompleted, getEventShopBonus } from '@parsers/misc';
import { calcTotalTasks } from '@parsers/tasks';
import { calcTotalAchievements } from '@parsers/achievements';
import { calcNametagsFound, calcObolsFound, calcTrophiesFound } from '@parsers/items';
import { calcBubbleLevels, calcSigilsLevels, calcVialsLevels, getBubbleBonus } from '@parsers/world-2/alchemy';
import { calcTotalKillsDigits } from '@parsers/world-3/deathNote';
import { calcTotalAtomLevels } from '@parsers/world-3/atomCollider';
import { calcTotalMeals, getTotalKitchenLevels } from '@parsers/world-4/cooking';
import { calcTotalItemInStorage } from '@parsers/storage';
import { calcHighestPower } from '@parsers/world-4/breeding';
import { calcColoTotalScore, calcMinigameTotalScore } from '@parsers/highScores';
import { calcArtifactsAcquired, calcTotalBoatLevels } from '@parsers/world-5/sailing';
import { calcTotalBeanstalkLevel } from '@parsers/world-6/sneaking';
import { calcTotalPrayersLevel } from '@parsers/world-3/prayers';
import { lavaLog, tryToParse } from '@utility/helpers';
import { getGrimoireBonus } from '@parsers/class-specific/grimoire';
import { getUpgradeVaultBonus } from '@parsers/misc/upgradeVault';
import { getArmorSetBonus } from '@parsers/world-3/armorSmithy';
import { OPT } from '@parsers/accountOptions';

export const segmentColors = {
  bronze: '#ffc277',
  silver: '#d6dbe0',
  gold: 'gold',
  blue: '#56ccff'
};

// _event_Tome2
export const getTome = (idleonData: IdleonData, account: Account, characters: any[], serverVars: any) => {
  const indexes = ninjaExtraInfo[32];
  const bonusNames = ninjaExtraInfo[33];
  const tomeQuantities = calcTomeQuantity(account, characters, idleonData);
  let totalPoints = 0;
  let tome = tomeData.map((bonus: any, index: number) => {
    const realIndex = indexes.indexOf(index.toString());
    const tomeLvReq = 40 * realIndex + (5 * Math.max(0, realIndex - 35) + (10 * Math.max(0, realIndex - 60) + (10 * Math.max(0, realIndex - 80) + 15 * Math.max(0, realIndex - 100)))) + 350;
    const quantity = tomeQuantities?.[index] || 0;
    const pointsPercent = calcPointsPercent(bonus, quantity);
    const color = TIER_THRESHOLDS.silver > pointsPercent ? segmentColors.bronze : TIER_THRESHOLDS.gold > pointsPercent
      ? segmentColors.silver
      : TIER_THRESHOLDS.blue > pointsPercent
        ? segmentColors.gold
        : segmentColors.blue;
    const points = Math.ceil(pointsPercent * bonus?.x3);
    const maxPoints = getMaxPointsForBonus(bonus);
    totalPoints += (account?.accountLevel ?? 0) >= tomeLvReq ? points : 0;
    const requiredQuantities = getRequiredQuantitiesEfficient(bonus);
    return {
      ...bonus,
      tomeLvReq,
      // catalog position; `index` is the display rank the list is re-sorted by below
      tomeIndex: index,
      index: realIndex,
      quantity: tomeQuantities?.[index] || 0,
      points,
      maxPoints,
      color,
      requiredQuantities
    }
  });

  const loggedInCharacter = getBestActiveCharacter(characters);
  const bonuses = [...bonusNames, 'DMG_Multi', 'Drop_Multi'].map((name: string, index: number) => ({
    name: name.replace('+{%', ''),
    bonus: getTomeBonus(account, totalPoints, index, loggedInCharacter),
    isMulti: name === 'Drop_Multi' || name === 'DMG_Multi',
    ...(name === 'Drop_Multi' ? { icon: 'etc/Tome_2.png' } : name === 'DMG_Multi' ? { icon: 'etc/Tome_0.png' } : {})
  }));

  tome = tome.toSorted((a: any, b: any) => a.index - b.index);
  let tops = serverVars?.TomePct || []; // Use tops for consistency
  let top = -1; // Initialize top to -1 if no valid index is found

  for (let index = 0; index < 7; index++) {
    if (totalPoints > tops[index]) {
      top = index;
    }
  }

  if (top === -1) {
    for (let index = 0; index < 5; index++) {
      if (totalPoints >= tops[index + 7]) {
        top = index + 7;
        break; // Stop at the first match
      }
    }
  }
  tops = tops.toSorted((a: number, b: number) => b - a)

  // Tome nametag rewards: reaching rank tiers 0-6 (Top 50% down to Top 0.1%) each grant one
  // claimable nametag (EquipmentNametag22..28). accountOptions[447] = nametags claimed this period,
  // accountOptions[448] = month stamp of last reset. The tome (and claim count) reset ~monthly, so
  // if the stored month stamp no longer matches the current month the claimed count is treated as 0.
  const nametagClaim = getNametagClaim(account, top, serverVars);

  return {
    tome,
    bonuses,
    totalPoints,
    tops,
    top,
    nametagClaim
  };
}

// Odds that a Glimmerwick Candle (Quest114) wish grants the Top 0.1% Tome Nametag. The game keys
// this off the tome rank tier, and hard-guarantees the wish once you've failed 1/chance times in a
// row (accountOptions[490]), so the reciprocal doubles as the pity count.
const getTomeWishChance = (top: number) => {
  if (top < 0) return 1 / 120;
  switch (top) {
    case 6:
      return 1 / 30;
    case 5:
      return 1 / 40;
    case 4:
      return 1 / 50;
    case 3:
      return 1 / 60;
    case 2:
      return 1 / 70;
    case 1:
      return 1 / 80;
    default:
      return 1 / 90;
  }
}

export const getTomeWishPity = (account: any) => {
  const top = account?.tome?.top ?? -1;
  return {
    attempts: Math.round(account?.accountOptions?.[490] ?? 0),
    pity: Math.round(1 / getTomeWishChance(top))
  };
}

const getNametagClaim = (account: any, top: number, serverVars: any) => {
  const tomeUnlocked = serverVars?.TomeOn === 1;
  const claimed = account?.accountOptions?.[447] ?? 0;
  const monthStamp = account?.accountOptions?.[448] ?? 0;
  const currentMonth = Math.floor((account?.timeAway?.GlobalTime ?? 0) / 2628e3);
  const effectiveClaimed = currentMonth !== monthStamp ? 0 : claimed;
  const rewardTier = top >= 0 && top <= 6 ? Math.min(top, 6) : -1;
  const available = rewardTier >= 0 ? Math.max(0, rewardTier + 1 - effectiveClaimed) : 0;
  return { tomeUnlocked, available, claimed: effectiveClaimed, rewardTier };
}

// The bar colours getTome draws: bronze below silver, silver below gold, gold below blue.
const TIER_THRESHOLDS: Record<string, number> = { silver: 0.4, gold: 0.75, blue: 0.999 };

// The quantity each colour needs, found on the scoring curve itself (calcPointsPercent, the game's TomePCT) so the bar
// and the threshold can never disagree. Curve 3 is lower-is-better: the most you may have; the rest: the least you need.
// null when the curve never reaches the colour.
const getRequiredQuantitiesEfficient = (bonus: any) => {
  const reaches = (quantity: number, target: number) => calcPointsPercent(bonus, quantity) >= target;
  // Smallest q in [lo, hi] where pass(q) flips to true, given pass(lo) is false and pass(hi) true.
  const flip = (lo: number, hi: number, pass: (q: number) => boolean) => {
    while (hi - lo > 1) {
      const mid = Math.floor((lo + hi) / 2);
      if (mid === lo || mid === hi) break;
      if (pass(mid)) hi = mid;
      else lo = mid;
    }
    return hi;
  };
  return Object.fromEntries(Object.entries(TIER_THRESHOLDS).map(([tier, target]) => {
    if (bonus?.x2 === 3) {
      const most = 5 * bonus.x1;
      if (!reaches(0, target)) return [tier, null];
      if (reaches(most, target)) return [tier, most];
      return [tier, flip(0, most, (q) => !reaches(q, target)) - 1];
    }
    if (reaches(0, target)) return [tier, 0];
    let hi = 1;
    while (!reaches(hi, target)) {
      hi *= 2;
      if (!isFinite(hi)) return [tier, null];
    }
    return [tier, flip(0, hi, (q) => reaches(q, target))];
  }));
}

const getMaxPointsForBonus = (bonus: any) => {
  // pointsPercent caps per x2 curve; see calcPointsPercent
  const maxPercent = bonus?.x2 === 0
    ? Math.pow(1.7, 0.7) // asymptote of type-0 curve
    : bonus?.x2 === 1
      ? 1.2 // log curve approaches 1.2
      : bonus?.x2 === 2
        ? 1 // linear, capped at 1
        : bonus?.x2 === 3
          ? 1.1512569953 // peak of type-3 curve at q -> 0
          : bonus?.x2 === 4
            ? 1 // capped at 1
            : 0;

  return Math.ceil(maxPercent * (bonus?.x3 ?? 0));
}

const TOME_BUBBLE_SCORE_START = 5000;
const TOME_BUBBLE_SCORE_STEP = 2000;

// game: TalentCalc multiplies the tome bubbles (Tome of STR/AGI/WIS and the crop, stealth and essence
// chapters) by one whole step per 2000 tome points past 5000.
export const getTomeBubbleMulti = (tomePoints: number) =>
  Math.floor(Math.max(0, (tomePoints - TOME_BUBBLE_SCORE_START) / TOME_BUBBLE_SCORE_STEP));

// game: TomeBonus 3/4/5 read DNSM.AlchBubbles.W8/A9/M9, built for the logged-in character, so its own
// class cauldron gets the class bubble multiplier.
const getTomeBonus = (account: any, totalPoints: number, index: number, loggedInCharacter: any) => {
  const mainStat = (mainStatMap as Record<string, string>)?.[loggedInCharacter?.class];
  const strTomeBonus = getBubbleBonus(account, 'TOME_STRENGTH', false, mainStat === 'strength');
  const agiTomeBonus = getBubbleBonus(account, 'TOME_AGILITY', false, mainStat === 'agility');
  const wisTomeBonus = getBubbleBonus(account, 'TOME_WISDOM', false, mainStat === 'wisdom');
  const grimoireBonus = getGrimoireBonus(account?.grimoire?.upgrades, 17);
  const armorSetBonus = getArmorSetBonus(account, 'TROLL_SET');
  const extraBonus = 1 + (grimoireBonus + armorSetBonus) / 100;
  const bubbleMulti = getTomeBubbleMulti(totalPoints) * extraBonus;
  const dmgMulti = getEventShopBonus(account, 0);
  const dropMulti = getEventShopBonus(account, 27);

  return 0 === index ? 10 *
    Math.pow(Math.floor(totalPoints / 100), 0.7) * extraBonus
    : 1 === index ? (1 === account?.accountOptions?.[196] ?
        4 * Math.pow(Math.floor(Math.max(0, totalPoints - 4e3) / 100), 0.7) * extraBonus : 0)
      : 2 === index ? (1 === account?.accountOptions?.[197] ?
          2 * Math.pow(Math.floor(Math.max(0, totalPoints - 8e3) / 100), 0.7) * extraBonus : 0)
        : 3 === index ? strTomeBonus * bubbleMulti : 4 === index ? agiTomeBonus * bubbleMulti :
          5 === index ? wisTomeBonus * bubbleMulti : 6 === index && dmgMulti
            ? 4 * Math.pow(Math.floor(totalPoints / 1e3), 0.4) * extraBonus
            : 7 === index && dropMulti
              ? 3 * Math.pow(Math.floor(totalPoints / 1e3), 0.3) * extraBonus
              : 0
}

const calcPointsPercent = (bonus: any, quantity: number) => {
  if (0 === bonus?.x2) {
    if (0 > quantity) {
      return 0;
    }
    else {
      return Math.pow((1.7 * quantity) / (quantity + (bonus?.x1)), 0.7);
    }
  }
  else if (1 === bonus?.x2) {
    return (2.4 * lavaLog(quantity)) / (2 * lavaLog(quantity) + (bonus?.x1));
  }
  else if (2 === bonus?.x2) {
    return Math.min(1, quantity / (bonus?.x1));
  }
  else if (3 === bonus?.x2) {
    if (quantity > 5 * (bonus?.x1)) {
      return 0;
    }
    else {
      return Math.pow((1.2 * (6 * (bonus?.x1) - quantity)) / (7 * (bonus?.x1) - quantity), 5);
    }
  }
  else if (4 === bonus?.x2) {
    const minValue = Math.min(bonus?.x1, quantity);
    return Math.pow((2 * minValue) / (minValue + bonus?.x1), 0.7);
  }
  else {
    return 0;
  }
}

// Game: TomeQTY[1] sums the logged-in character's own StatueLevels, so this reads one character's
// levels rather than the per-statue maximum across the account (which can exceed every character).
const calcActiveCharacterStatueLevels = (characters: any[], idleonData: any, account: any) => {
  const activeCharacter = getBestActiveCharacter(characters);
  const raw = tryToParse(idleonData?.[`StatueLevels_${activeCharacter?.playerId}`])
    || idleonData?.[`StatueLevels_${activeCharacter?.playerId}`];
  if (!Array.isArray(raw)) return calcStatueLevels(account?.statues);
  return raw.reduce((sum: number, statue: any) => sum + (Number(statue?.[0]) || 0), 0);
}

// _customEvent_TomeQTY
export const calcTomeQuantity = (account: any, characters: any[], idleonData?: any) => {
  const quantities: any[] = [];
  quantities.push(calcStampLevels(account?.stamps));
  quantities.push(calcActiveCharacterStatueLevels(characters, idleonData, account));
  quantities.push(calcCardsLevels(account?.cards));
  quantities.push(calcTalentMaxLevel(characters));
  quantities.push(calcTotalQuestCompleted(characters));
  quantities.push(account?.accountLevel);
  quantities.push(calcTotalTasks(account?.tasks));
  quantities.push(calcTotalAchievements(account?.achievements));
  quantities.push(account.accountOptions?.[198]);
  quantities.push(account.accountOptions?.[208]);
  quantities.push(calcTrophiesFound(account?.looty));
  quantities.push(Object.entries(account?.totalSkillsLevels).reduce((sum: number, [skill, { level }]: [string, any]) => skill !== 'character'
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
  // Game rounds each of the three delivery counters before summing them.
  quantities.push(Math.round(account?.currencies?.DeliveryBoxComplete ?? 0)
    + Math.round(account?.currencies?.DeliveryBoxStreak ?? 0)
    + Math.round(account?.currencies?.DeliveryBoxMisc ?? 0));
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
  quantities.push(calcTotalItemInStorage(account?.storage?.list, 'Critter11A'));
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
  quantities.push(Math.max(0, ...(account?.sailing?.captains?.map(({ level }: any) => level) || [])));
  quantities.push(Math.max(account?.gaming?.snailLevel, account.accountOptions?.[210]));
  quantities.push(account?.gaming?.bestNugget);
  quantities.push(account?.looty?.lootyRaw?.length);
  quantities.push(account?.gaming?.bits);
  quantities.push(Math.pow(2, account.accountOptions?.[219])); // Highest Crop OG
  quantities.push(account?.farming?.cropsFound);
  quantities.push(calcTotalBeanstalkLevel(account?.sneaking?.beanstalkData));
  quantities.push(account?.summoning?.totalUpgradesLevels);
  quantities.push(account?.summoning?.totalWins); // Best Endless Summoning Round - account.accountOptions?.[232] > 0 ? 12 * account.accountOptions?.[232] : 0
  quantities.push(account?.sneaking?.unlockedFloors); // [72]
  quantities.push(account?.summoning?.familiarsOwned);
  quantities.push(account?.sneaking?.totalJadeEmporiumUnlocked);
  quantities.push(calcMinigameTotalScore(account?.highscores?.minigameHighscores));
  quantities.push(calcTotalPrayersLevel(account?.prayers));
  quantities.push(account?.farming?.totalRanks); // total land ranks
  quantities.push(parseFloat(account.accountOptions?.[221])); // Largest Magic Bean Trade
  quantities.push(account.accountOptions?.[222]); // Most Balls earned from LBoFaF
  quantities.push(account.arcade?.totalUpgradeLevels);
  quantities.push(Math.min(1500, getUpgradeVaultBonus(account?.upgradeVault?.upgrades, 57))); // [81]
  quantities.push(account?.hole?.caverns?.gambit?.totalTime) // [82]
  quantities.push(account?.hole?.totalResources) // [83]
  quantities.push(account?.hole?.totalVillagersLevels) // [84]
  quantities.push(account.accountOptions?.[OPT.owlMegaFeathers]);
  quantities.push(account.accountOptions?.[OPT.kangarooMegaFish]);
  quantities.push(account?.hole?.holesObject?.extraCalculations?.[73]);
  quantities.push(account?.hole?.holesObject?.extraCalculations?.[74]);
  quantities.push(account?.hole?.holesObject?.extraCalculations?.[75]);
  quantities.push(account.accountOptions?.[356]);
  quantities.push(account?.hole?.holesObject?.extraCalculations?.[8]);
  quantities.push(account?.hole?.totalLayerResources);
  quantities.push(account?.hole?.totalOpalsFound);
  quantities.push(Math.round(Math.min(12, account.accountOptions?.[353]) + 1));
  quantities.push(Math.round(account?.accountOptions?.[369])); // 95
  quantities.push(account?.summoning?.totalSummoningStonesKills); // 96
  quantities.push(account?.spelunking?.coralReefLevels?.reduce((sum: number, level: number) => sum + level, 0));
  quantities.push(Math.max(0, ...(account?.spelunking?.bestCaveLevels || []))); // 98
  quantities.push(account?.sneaking?.totalNinjaUpgradeLevels);
  quantities.push(account?.accountOptions?.[445]); // 100
  quantities.push(account?.accountOptions?.[446]);
  quantities.push(Math.max(0, ...(account?.spelunking?.biggestHauls || []))); // 102
  quantities.push(account?.spelunking?.totalUpgradeLevels); // 103
  quantities.push(account?.spelunking?.discoveriesCount); // 104
  quantities.push(account?.spelunking?.highestSpelunkingLevelCharacter); // 105
  quantities.push(account?.accountOptions?.[443]); // 106
  quantities.push(calcNametagsFound(account?.looty)); // 107
  quantities.push(account?.bubba?.megafleshOwned); // 108
  quantities.push(account?.hatRack?.totalHats); // 109
  quantities.push(account?.minehead?.opponentsBeat); // 110
  quantities.push(account?.gaming?.ratKingCrownsClaimed); // 111 Rat king crowns claimed
  quantities.push(account?.farming?.totalStickers); // 112 stickers claimed
  quantities.push(account.accountOptions?.[498]); // 113 tournament registration
  quantities.push(account.research?.gridPTSpent); // 113 research grid upg
  quantities.push(account.minehead?.glimboTotalTrades); // 115 glimbo trades
  quantities.push(account?.sushiStation?.uniqueSushi); // 116 unique sushi
  quantities.push(account?.accountOptions?.[594]); // 117 button presses
  // game: TomeQTY[118] sums Math.max(0, RoyalG[0][t]) over all royal statues.
  quantities.push(account?.royalGuardian?.royalStatues?.reduce(
    (sum: number, statue: any) => sum + Math.max(0, statue?.level ?? 0), 0)); // 118 Total Royal Statue LV
  quantities.push(account?.royalGuardian?.outpostStats?.built); // 119 Royal Guardian Outposts Built - game: RoyalG("TotalStatz", 4, 0)
  quantities.push(account?.royalGuardian?.outpostStats?.totalNodeLevels); // 120 Total Resource Grade - game: RoyalG("TotalStatz", 0, 0)
  quantities.push(account?.jellyOperator?.obstructionsDefeated); // 121 Successful Jelly Operations - game: Research[7][9]
  // game: TomeQTY[122] Menagerie[0][2]
  quantities.push(Number((account as any)?.menagerieSave?.[0]?.[2]) || 0); // 122 Menagerie Rank
  // game: TomeQTY[123] sum of Menagerie[3]
  quantities.push(((account as any)?.menagerieSave?.[3] ?? []).reduce((sum: number, level: any) => sum + (Number(level) || 0), 0)); // 123 Menagerie Boost LVs

  return quantities;
}
