import { tryToParse, notateNumber, commaNotation } from '@utility/helpers';
import { generalSpelunky, coralReef } from '@website-data';
import {
  isCompanionBonusActive,
  getEventShopBonus,
  getKillRoyShopBonus,
  getHighestCharacterSkill
} from '@parsers/misc';
import { getMeritocracyBonus } from '@parsers/world-2/voteBallot';
import { getLegendTalentBonus } from '@parsers/world-7/legendTalents';
import { getArcadeBonus } from '@parsers/arcade';
import { getVialsBonusByEffect } from '@parsers/alchemy';
import { getStampsBonusByEffect } from '@parsers/stamps';
import { isJadeBonusUnlocked } from '@parsers/world-6/sneaking';
import { getCardBonusByEffect } from '@parsers/cards';
import { getClamWorkBonus } from '@parsers/world-7/clamWork';
import { getStatueBonus } from '@parsers/statues';
// getDancingCoralBonus is implemented locally since it's not exported from spelunking.js

export const getCoralReef = (idleonData, account, charactersData) => {
  const rawSpelunking = tryToParse(idleonData?.Spelunk) || {};
  const rawTowerInfo = idleonData?.TowerInfo || tryToParse(idleonData?.Tower);
  const coralReefLevels = rawSpelunking?.[13] || [];
  const rawDancingCoral = rawTowerInfo?.slice(18) || [];

  return parseCoralReef(rawSpelunking, account, coralReefLevels, rawDancingCoral, charactersData);
}

const parseCoralReef = (rawSpelunking, account, coralReefLevels, rawDancingCoral, charactersData) => {
  // CoralKid upgrades - get descriptions from generalSpelunky[25]
  const coralKidDescriptions = generalSpelunky?.[25]?.split(' ') || [];
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
  const dancingCoralDescriptions = generalSpelunky?.[23]?.split(' ') || [];
  const dancingCoralNames = [
    'Reef_Coral',
    'Vibrant_Coral',
    'Glowing_Coral',
    'Neon_Coral',
    'Twisted_Coral',
    '6th_Coral',
    '7th_Coral',
    '8th_Coral',
    '9th_Coral'
  ];
  const dancingCoralDropResources = [
    'Generated_Daily_in_Town',
    'Dropped_by_Shellslugs',
    'Dropped_by_Litterfish',
    'Dropped_by_Coralcave_Crab',
    'Dropped_by_Pirate_Pou',
    'Dropped_by_RIPtide',
    'Dropped_by_RIPtide',
    'Dropped_by_RIPtide',
    'Dropped_by_RIPtide'
  ];

  const dancingCoral = Array.from({ length: rawDancingCoral?.length || 0 }, (_, index) => {
    const level = rawDancingCoral?.[index] || 0;
    const baseDescription = dancingCoralDescriptions[index] || '';
    const description = getDancingCoralDescription(baseDescription, account, index);
    return {
      index,
      level,
      coralName: dancingCoralNames[index] || '',
      description,
      dropResource: dancingCoralDropResources[index] || '',
      cost: getDancingCoralCost(rawSpelunking, index),
      bonus: getDancingCoralBonus(account, index, 0),
      tower: account?.towers?.data?.slice(18)?.[index] || ''
    };
  }).filter((coral, index) => index < 6);

  const grindTimeDaily = getGrindTimeDaily(account, coralReefLevels);
  const reefUpgrades = coralReefLevels?.map((level, index) => {
    const reefData = coralReef?.[index];
    let description = reefData?.name || '';
    if (index === 0) {
      description = description.replace('{', Math.round(grindTimeDaily));
    } else if (index === 4) {
      description = description.replace('}', Math.ceil(level / 4)).replace('{', Math.ceil(3 * level));
    }
    let extraData;

    if (index === 2) {
      const loreBonuses = account?.spelunking?.loreBonuses;
      extraData = loreBonuses?.map((bonus) => ({ ...bonus, unlocked: level >= bonus?.index }))?.filter((_, index) => index < reefData?.x1);
    }
    else if (index === 3) {
      const specialUpgrades = account?.sneaking?.upgrades?.filter((upgrade) => upgrade?.isSpecialUpgrade);
      extraData = specialUpgrades?.map((upgrade) => ({ ...upgrade, unlocked: level >= upgrade?.unlockOrder }));
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
  }) || [];


  return {
    coralKidUpgrades,
    dancingCoral,
    reefUpgrades,
    grindTimeDaily,
    unlockedCorals: rawSpelunking?.[4]?.[6],
    ownedCorals: rawSpelunking?.[4]?.[5],
    reefDayGains: getReefDayGains(account) // Default to first reef
  };
}

export const getCoralKidUpgCost = (index, level) => {
  if (index === 1) {
    return 1e7 * Math.pow(6, index) * Math.pow(1.25, level);
  }
  return 1e7 * Math.pow(6, index) * Math.pow(1.1, level);
}

export const getCoralKidUpgBonus = (account, index) => {
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

export const getDancingCoralCost = (rawSpelunking, index) => {
  const baseCost = generalSpelunky?.[22]?.split(' ')?.[index] || 0;
  return baseCost / (1 + (10 * rawSpelunking?.[4]?.[7] + Math.pow(1.05, rawSpelunking?.[4]?.[7])) / 100);
}

// DancingCoralBonus from Thingies.js line 68-71
export const getDancingCoralBonus = (account, index, secondIndex = 0) => {
  if (secondIndex === 999) {
    return generalSpelunky?.[24]?.[index] || 0;
  }

  const baseBonus = getDancingCoralBonus(account, index, 999);
  const coralLevel = account?.spelunking?.rawDancingCoral?.[index] || 0;

  return baseBonus * Math.max(0, coralLevel - 200);
}

// ReefCost from Thingies.js line 116-117
export const getReefCost = (account, index, level) => {
  const reefData = coralReef?.[index];
  if (!reefData) return 0;

  const baseCost = reefData.x2 || 0;
  const exponent = reefData.exponent || 1.1;

  return baseCost * Math.pow(exponent, level);
}

// ReefDayGains from Thingies.js line 118-130
export const getReefDayGains = (account) => {
  const companionBonusValue = isCompanionBonusActive(account, 40) ? account?.companions?.list?.at(40)?.bonus : 0;
  const eventShopBonus = getEventShopBonus(account, 25) || 0;

  const gemShopBonus = (account?.gemShopPurchases?.find((value, idx) => idx === 41) || 0);
  const coralKidBonus = getCoralKidUpgBonus(account, 5);
  const dancingCoralBonus = getDancingCoralBonus(account, 0, 0);
  const clamWorkBonus = getClamWorkBonus(account, 5);
  const killroyBonus = getKillRoyShopBonus(account, 6) || 0;
  const stampBonus = getStampsBonusByEffect(account, 'Daily_Coral_gain_for_the_Coral_Reef') || 0;
  const vialBonus = getVialsBonusByEffect(account?.alchemy?.vials, null, '7corale') || 0;
  const legendTalentBonus = getLegendTalentBonus(account, 0) || 0;
  const arcadeBonus = getArcadeBonus(account?.arcade?.shop, 'Daily_Coral')?.bonus || 0;
  const emporiumBonus = isJadeBonusUnlocked(account, 'Coral_Conservationism');
  const passiveCardBonus = getCardBonusByEffect(account?.cards, 'Daily_Coral_(Passive)') || 1;
  const statueBonus = getStatueBonus(account, 31);

  const value = 10 * (1 + companionBonusValue)
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

  const breakdown = {
    statName: "Reef day gains",
    totalValue: notateNumber(value, "MultiplierInfo"),
    categories: [
      {
        name: "Base",
        sources: [
          { name: "Base", value: 10 },
        ],
      },
      {
        name: "Additive",
        sources: [
          { name: "Coral Kid Upgrade", value: coralKidBonus },
          { name: "Dancing Coral", value: dancingCoralBonus },
          { name: "Clam Work", value: 20 * clamWorkBonus },
          { name: "Killroy Shop", value: killroyBonus },
          { name: "Stamps", value: stampBonus },
          { name: "Vials", value: vialBonus },
          { name: "Legend Talent", value: legendTalentBonus },
          { name: "Arcade", value: arcadeBonus },
          { name: "Emporium", value: 20 * emporiumBonus },
          { name: "Passive Card", value: passiveCardBonus },
          { name: "Statue", value: statueBonus },
        ],
      },
      {
        name: "Multiplicative",
        sources: [
          { name: "Companion", value: companionBonusValue },
          { name: "Event Shop", value: 0.3 * eventShopBonus },
          { name: "Gem Shop", value: 20 * gemShopBonus },
        ],
      },
    ],
  }

  return { value, breakdown }
}

// GrindTimeDaily from Thingies.js line 131-133
export const getGrindTimeDaily = (account, coralReefLevels) => {
  return Math.floor((10 * coralReefLevels?.[0]
    + 15 * getClamWorkBonus(account, 6))
    * (1 + getMeritocracyBonus(account, 24) / 100));
}

const getCoralKidDescription = (baseDescription, level, index, bonus, account, coralReefLevels, charactersData) => {
  if (!baseDescription) return '';

  let description = baseDescription;

  const bonusRounded = Math.round(10 * bonus) / 10;
  description = description.replace('{', '' + bonusRounded);

  const multiplier = 1 + bonus / 100;
  const multiplierNotation = notateNumber(multiplier, 'MultiplierInfo');
  description = description.replace('}', multiplierNotation);

  if (index === 3) {
    const highestDivinityLevel = getHighestCharacterSkill(charactersData, 'divinity'); // TODO: possibly add char select
    description = description.replace('$', '' + highestDivinityLevel);
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
  const highestDivinityLevel = getHighestCharacterSkill(charactersData, 'divinity'); // TODO: possibly add char select
  const divisor = 100;
  const hatValue = 1 + (1 + bonus3 / 100) * highestDivinityLevel / divisor;
  const hatNotation = notateNumber(hatValue, 'MultiplierInfo');
  description = description.replace('^', hatNotation);

  return description;
}

// Calculate Dancing Coral description based on game logic
const getDancingCoralDescription = (baseDescription, account, index) => {
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

  return description;
}

