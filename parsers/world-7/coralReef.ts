import { tryToParse, notateNumber, commaNotation } from '@utility/helpers';
import { generalSpelunky, coralReef } from '@website-data';
import {
  isCompanionBonusActive,
  getEventShopBonus,
  getKillRoyShopBonus,
  getLoggedInSkillLevel
} from '@parsers/misc';
import { getMeritocracyBonus } from '@parsers/world-2/voteBallot';
import { getLegendTalentBonus } from '@parsers/world-7/legendTalents';
import { getArcadeBonus } from '@parsers/world-2/arcade';
import { getVialsBonusByEffect } from '@parsers/world-2/alchemy';
import { getStampsBonusByEffect } from '@parsers/world-1/stamps';
import { isJadeBonusUnlocked } from '@parsers/world-6/sneaking';
import { getCardLevel } from '@parsers/cards';
import { getMineheadBonusQTY } from '@parsers/world-7/minehead';
import { getClamWorkBonus } from '@parsers/world-7/clamWork';
import { getStatueBonus } from '@parsers/world-1/statues';
import { sumSaveArray } from '@parsers/world-7/saveTotals';
import { NUMBERED_GROUP, additiveGroup, createBreakdown, flat, multiplier, percent, productGroup } from '@parsers/breakdown';
// getDancingCoralBonus is implemented locally since it's not exported from spelunking.js

export const getCoralReef = (idleonData: any, account: any, charactersData: any) => {
  const rawSpelunking = tryToParse(idleonData?.Spelunk) || {};
  const rawTowerInfo = idleonData?.TowerInfo || tryToParse(idleonData?.Tower);
  const coralReefLevels = rawSpelunking?.[13] || [];
  const rawDancingCoral = rawTowerInfo?.slice(18) || [];

  return parseCoralReef(rawSpelunking, account, coralReefLevels, rawDancingCoral, charactersData);
}

const parseCoralReef = (rawSpelunking: any, account: any, coralReefLevels: any, rawDancingCoral: any, charactersData: any) => {
  // CoralKid upgrades - get descriptions from generalSpelunky[25]
  const coralKidDescriptions = generalSpelunky?.[25] || [];
  const coralKidUpgrades = Array.from({ length: 6 }, (_, index) => {
    const level = account?.accountOptions?.[427 + index] || 0;
    const bonus = getCoralKidUpgBonus(account, index);
    const baseDescription = coralKidDescriptions[index] || '';
    const description = getCoralKidDescription(
      baseDescription,
      level,
      index,
      bonus,
      account,
      coralReefLevels,
      charactersData
    );
    return {
      index,
      level,
      description,
      cost: getCoralKidUpgCost(index, level),
      bonus
    };
  });

  // Dancing Coral - get descriptions from generalSpelunky[23]
  const dancingCoralDescriptions = generalSpelunky?.[23] || [];
  const dancingCoralNames = [
    'Reef_Coral',
    'Vibrant_Coral',
    'Glowing_Coral',
    'Char_Coral',
    'Neon_Coral',
    'Aegean_Coral',
    'Gilded_Coral',
    'Twisted_Coral',
    'Eternal_Coral'
  ];
  // Kept hand-written rather than derived from monsterDrops: that catalog is ~3.8MB and nothing
  // else in the bundle imports it. Verified against monsterDrops for Coral1-5; the last three
  // corals have no drop entry yet, so their source is a guess until the tiers actually ship.
  const dancingCoralDropResources = [
    'Generated_Daily_in_Town',
    'Dropped_by_Shellslugs',
    'Dropped_by_Litterfish',
    'Dropped_by_Coralcave_Crab',
    'Dropped_by_Eggroll',
    'Dropped_by_Ancientfish',
    'Dropped_by_RIPtide',
    'Dropped_by_RIPtide',
    'Dropped_by_RIPtide'
  ];

  const unlockedCorals = rawSpelunking?.[4]?.[6] ?? 0;
  const dancingCoralCount = dancingCoralDescriptions.length;
  const dancingCoral = Array.from({ length: dancingCoralCount }, (_, index) => {
    const level = rawDancingCoral?.[index] || 0;
    const baseDescription = dancingCoralDescriptions[index] || '';
    const description = getDancingCoralDescription(baseDescription, account, index);
    const tower = account?.towers?.data?.slice(18)?.[index] || '';
    return {
      index,
      level,
      unlocked: index < unlockedCorals,
      coralName: dancingCoralNames[index] || '',
      description,
      dropResource: dancingCoralDropResources[index] || '',
      cost: getDancingCoralCost(rawSpelunking, index),
      bonus: getDancingCoralBonus(account, index, 0),
      tower,
      towerEffect: getShrineEffect(tower?.desc)
    };
  });

  const grindTimeDaily = getGrindTimeDaily(account, coralReefLevels);
  const reefUpgrades = coralReef.map((reefData: any, index: any) => {
    const level = coralReefLevels?.[index] ?? 0;
    let description = reefData?.name || '';
    if (index === 0) {
      description = description.replace('{', '' + Math.round(grindTimeDaily));
    } else if (index === 4) {
      description = description.replace('}', '' + Math.ceil(level / 4)).replace('{', '' + Math.ceil(3 * level));
    }
    let extraData;

    if (index === 2) {
      const loreBonuses = account?.spelunking?.loreBonuses;
      extraData = loreBonuses?.map((bonus: any) => ({ ...bonus, unlocked: level >= bonus?.index }))?.filter((_: any, index: any) => index < reefData?.x1);
    }
    else if (index === 3) {
      const specialUpgrades = account?.sneaking?.upgrades?.filter((upgrade: any) => upgrade?.isSpecialUpgrade);
      extraData = specialUpgrades?.map((upgrade: any) => ({ ...upgrade, unlocked: level >= upgrade?.unlockOrder }));
    }

    return {
      index,
      level: level || 0,
      ...reefData,
      description,
      extraData,
      cost: getReefCost(account, index, level || 0),
      bonus: index === 0 ? grindTimeDaily : index === 4 ? 0 : 0
    };
  });


  return {
    coralKidUpgrades,
    // the leaderboard total: OptLacc[427..432]
    coralKidUpgradeLevelTotal: sumSaveArray(account?.accountOptions?.slice?.(427, 433)),
    dancingCoral,
    reefUpgrades,
    grindTimeDaily,
    unlockedCorals,
    ownedCorals: rawSpelunking?.[4]?.[5] ?? 0,
    reefDayGains: getReefDayGains(account) // Default to first reef
  };
}

// game: "CoralKidUpgCost"
export const getCoralKidUpgCost = (index: any, level: any) => {
  if (index === 1) {
    return 1e7 * Math.pow(6, index) * Math.pow(1.25, level);
  }
  return 1e7 * Math.pow(6, index) * Math.pow(1.1, level);
}

// game: "CoralKidUpgBonus"
export const getCoralKidUpgBonus = (account: any, index: any) => {
  const accountOptions = account?.accountOptions || {};
  const levelValue = accountOptions?.[427 + index] || 0;

  switch (index) {
    case 0:
      return 10 * levelValue;
    case 1:
      return Math.round(2 * levelValue);
    case 2:
      return (levelValue / (25 + levelValue)) * 20;
    case 3:
      return Math.round(levelValue);
    case 4:
      return Math.round(2 * levelValue);
    case 5:
      return (levelValue / (40 + levelValue)) * 100;
    default:
      return 0;
  }
}

// game: "DancingCoralCOST"
export const getDancingCoralCost = (rawSpelunking: any, index: any) => {
  const baseCost = Number(generalSpelunky?.[22]?.[index]) || 0;
  const overstimLevel = rawSpelunking?.[4]?.[7] ?? 0;
  return baseCost / (1 + (10 * overstimLevel + Math.pow(1.05, overstimLevel)) / 100);
}

// game: "DancingCoralBonus"
export const getDancingCoralBonus = (account: any, index: any, secondIndex = 0): any => {
  if (secondIndex === 999) {
    return generalSpelunky?.[24]?.[index] || 0;
  }

  const baseBonus: any = getDancingCoralBonus(account, index, 999);
  const coralLevel = account?.spelunking?.rawDancingCoral?.[index] || 0;

  return baseBonus * Math.max(0, coralLevel - 200);
}

// game: "ReefCost"
export const getReefCost = (account: any, index: any, level: any) => {
  const reefData = coralReef?.[index];
  if (!reefData) return 0;

  const baseCost = reefData.x2 || 0;
  const exponent = reefData.exponent || 1.1;

  return baseCost * Math.pow(exponent, level);
}

const REEF_DAY_BASE_GAINS = 10;

// game: "ReefDayGains"
export const getReefDayGains = (account: any) => {
  const companionBonusValue = isCompanionBonusActive(account, 40) ? account?.companions?.list?.at(40)?.bonus : 0;
  const eventShopBonus = getEventShopBonus(account, 25) || 0;

  const gemShopBonus = (account?.gemShopPurchases?.find((value: any, idx: any) => idx === 41) || 0);
  const coralKidBonus = getCoralKidUpgBonus(account, 5);
  const dancingCoralBonus = getDancingCoralBonus(account, 0, 0);
  const clamWorkBonus = getClamWorkBonus(account, 5);
  const killroyBonus = getKillRoyShopBonus(account, 6) || 0;
  const stampBonus = getStampsBonusByEffect(account, 'Daily_Coral_gain_for_the_Coral_Reef') || 0;
  const vialBonus = getVialsBonusByEffect(account?.alchemy?.vials, null, '7corale') || 0;
  const legendTalentBonus = getLegendTalentBonus(account, 0) || 0;
  const arcadeBonus = getArcadeBonus(account?.arcade?.shop, 'Daily_Coral')?.bonus || 0;
  const emporiumBonus = isJadeBonusUnlocked(account, 'Coral_Conservationism');
  // game: min(2 * CardLv("w7a9"), 15) - the card's raw level, no chip or legend boost, capped at 15.
  const passiveCardBonus = Math.min(2 * getCardLevel(account?.cards, 'w7a9'), 15);
  const statueBonus = getStatueBonus(account, 31);

  const value = REEF_DAY_BASE_GAINS * (1 + companionBonusValue)
    * (1 + 0.3 * eventShopBonus)
    * (1 + (20 * gemShopBonus) / 100)
    * (1 + (coralKidBonus
      + (dancingCoralBonus
        + (20 * clamWorkBonus
          + (killroyBonus
            + (stampBonus
              + (vialBonus
                + (legendTalentBonus
                  + (arcadeBonus
                    + (20 * emporiumBonus
                      + (passiveCardBonus
                        + statueBonus)))))))))) / 100);

  const breakdown = createBreakdown('Reef day gains', notateNumber(value, 'MultiplierInfo'), [
    flat('Base', REEF_DAY_BASE_GAINS),
    productGroup(NUMBERED_GROUP, [
      multiplier('Companion', 1 + companionBonusValue),
      multiplier('Event Shop', 1 + 0.3 * eventShopBonus),
      multiplier('Gem Shop', 1 + (20 * gemShopBonus) / 100),
      additiveGroup(NUMBERED_GROUP, [
        percent('Coral Kid Upgrade', coralKidBonus),
        percent('Dancing Coral', dancingCoralBonus),
        percent('Clam Work', 20 * clamWorkBonus),
        percent('Killroy Shop', killroyBonus),
        percent('Stamps', stampBonus),
        percent('Vials', vialBonus),
        percent('Legend Talent', legendTalentBonus),
        percent('Arcade', arcadeBonus),
        percent('Emporium', 20 * emporiumBonus),
        percent('Passive Card', passiveCardBonus),
        percent('Statue', statueBonus)
      ])
    ])
  ]);

  return { value, breakdown }
}

// game: "GrindTimeDaily"
export const getGrindTimeDaily = (account: any, coralReefLevels: any) => {
  return Math.floor((10 * (coralReefLevels?.[0] ?? 0)
    + 15 * getClamWorkBonus(account, 6)
    + getMineheadBonusQTY(account, 13))
    * (1 + getMeritocracyBonus(account, 24) / 100));
}

const getCoralKidDescription = (baseDescription: any, level: any, index: any, bonus: any, account: any, coralReefLevels: any, charactersData: any) => {
  if (!baseDescription) return '';

  let description = baseDescription;

  const bonusRounded = Math.round(10 * bonus) / 10;
  description = description.replace('{', '' + bonusRounded);

  const multiplier = 1 + bonus / 100;
  const multiplierNotation = notateNumber(multiplier, 'MultiplierInfo');
  description = description.replace('}', multiplierNotation);

  if (index === 3) {
    // game: the tooltip reads Lv0[14], the logged-in character's divinity level
    const divinityLevel = getLoggedInSkillLevel(charactersData, 'divinity');
    description = description.replace('$', '' + divinityLevel);
  } else if (index === 2) {
    const bonus2 = getCoralKidUpgBonus(account, 2);
    const unlockedDeities = account?.divinity?.unlockedDeities || 0;
    const powerValue = Math.pow(1 + bonus2 / 100, Math.max(0, unlockedDeities - 10));
    const powerNotation = notateNumber(powerValue, 'MultiplierInfo');
    description = description.replace('$', powerNotation);
  } else if (index === 4) {
    const sumReefLevels = Array.from({ length: 6 }, (_, i) => coralReefLevels?.[i] || 0)
      .reduce((acc, val) => acc + val, 0);
    const totalValue = sumReefLevels * bonus;
    description = description.replace('$', commaNotation(totalValue));
  }

  const bonus3 = getCoralKidUpgBonus(account, 3);
  const divinityLevel = getLoggedInSkillLevel(charactersData, 'divinity');
  const divisor = 60 + divinityLevel;
  const hatValue = 1 + (1 + bonus3 / 100) * divinityLevel / divisor;
  const hatNotation = notateNumber(hatValue, 'MultiplierInfo');
  description = description.replace('^', hatNotation);

  return description;
}

// The shrine's own effect, minus the "how to level it" tail and the current bonuses block.
// The game does the same trim when it appends the coral line to a shrine's tooltip.
const getShrineEffect = (desc: any) => {
  if (!desc) return '';
  return desc
    .split('_@_')?.[0]
    ?.replace('Level_it_up_by_claiming_AFK_Gains_on_the_same_map.', '')
    ?.trim()
    ?.replace(/_+$/, '') || '';
}

// Calculate Dancing Coral description based on game logic
const getDancingCoralDescription = (baseDescription: any, account: any, index: any) => {
  if (!baseDescription) return '';

  let description = baseDescription;

  // Replace { with base bonus value (rounded to 1 decimal)
  // Math.floor(10 * DancingCoralBonus(i, 999)) / 10
  const baseBonus = getDancingCoralBonus(account, index, 999);
  const bonusRounded = Math.floor(10 * baseBonus) / 10;
  description = description.replace('{', '' + bonusRounded);

  // Replace } with multiplier notation (1 + baseBonus/100), removing "#" from notation
  // notateNumber(1 + DancingCoralBonus(i, 999) / 100, "MultiplierInfo") with "#" removed
  const multiplier = 1 + baseBonus / 100;
  const multiplierNotation = notateNumber(multiplier, 'MultiplierInfo');
  description = description.replace('}', multiplierNotation);

  // Coral 5 reads "+{%_Minehead_DMG潤Money". That glyph is an in-game icon font character (it only
  // resolves inside the game's own font atlas), so it renders as mojibake on the site. The one
  // bonus really does apply to both Minehead DMG and Minehead Money, so spell the pair out.
  description = description.replace(/潤/g, '_&_');

  return description;
}

