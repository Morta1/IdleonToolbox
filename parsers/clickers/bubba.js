import { tryToParse, lavaLog, lavaLog2, commaNotation, notateNumber } from '@utility/helpers';
import { generalSpelunky, bubbaUpgrades } from '@website-data';

export const getBubba = (idleonData, account) => {
  const rawBubba = tryToParse(idleonData?.Bubba);

  return parseBubba(rawBubba, account);
}

// Helper function to get MeatProdREQ
const getMeatProdREQ = (upgradeTypeIndex) => {
  if (upgradeTypeIndex === 0) return 0;
  return 50 * Math.pow(2.8 + upgradeTypeIndex / 3.55, upgradeTypeIndex - Math.min(1, Math.floor(upgradeTypeIndex / 4)));
};

// Helper function to get TotalUpgTypesAvailable
// This is calculated by checking how many upgrade types can be unlocked based on meat production
const getTotalUpgTypesAvailable = (rawBubba) => {
  const meatProduced = rawBubba?.[0]?.[4] || 0;
  let totalAvailable = 1; // Start with at least 1 upgrade type available

  // Check up to 28 upgrade types (max)
  for (let i = 1; i < 28; i++) {
    const meatReq = getMeatProdREQ(i);
    if (meatProduced >= meatReq) {
      totalAvailable = i + 1;
    } else {
      break;
    }
  }

  return Math.min(28, totalAvailable);
};

const parseBubba = (rawBubba, account) => {
  const totalUpgTypesAvailable = getTotalUpgTypesAvailable(rawBubba);
  const megafleshOwned = rawBubba?.[1]?.[8];
  const upgrades = bubbaUpgrades.map((upgrade, index) => {
    return {
      ...upgrade,
      level: rawBubba?.[1]?.[index] || 0,
      prestige: rawBubba?.[2]?.[index] || 0,
      realLV: getRealLV(rawBubba, index),
      cost: getUpgradeCost(rawBubba, index),
      bonus: getTotUpgBonus(rawBubba, index),
      description: formatUpgradeDescription(rawBubba, index),
      unlocked: index < totalUpgTypesAvailable,
    }
  });
  return {
    upgrades,
    meatSlices: rawBubba?.[0]?.[0] || 0,
    meatsliceRate: 60 * getMeatsliceRate(rawBubba, account),
    progress: rawBubba?.[0]?.[4] || 0,
    progressReq: getProgressReq(totalUpgTypesAvailable),
    bonuses: getBubbaBonusesObject(rawBubba),
    totalUpgTypesAvailable,
    megafleshOwned
  };
}

const getProgressReq = (totalUpgTypesAvailable) => {
  return 50 * Math.pow(2.8 + totalUpgTypesAvailable / 3.55, totalUpgTypesAvailable - Math.min(1, Math.floor(totalUpgTypesAvailable / 4)));
}

const getBubbaBonusesObject = (rawBubba) => {
  
  return {
    buildRate: {
      name: 'Build Rate',
      bonus: getBubbaBonuses(rawBubba, 1),
      isNegative: false,
    },
    critterGain: {
      name: 'Critter Gain',
      bonus: getBubbaBonuses(rawBubba, 2),
      isNegative: false,
    },
    soulGain: {
      name: 'Soul Gain',
      bonus: getBubbaBonuses(rawBubba, 3),
      isNegative: false,
    },
    totalDamage: {
      name: 'Total Damage',
      bonus: getBubbaBonuses(rawBubba, 4),
      isNegative: false,
    },
    allKills: {
      name: 'All Kills',
      bonus: getBubbaBonuses(rawBubba, 5),
      isNegative: false,
    },
    expMulti: {
      name: 'EXP Multi',
      bonus: getBubbaBonuses(rawBubba, 6),
      isNegative: false,
    },
    atomCost: {
      name: 'Atom Cost',
      bonus: getBubbaBonuses(rawBubba, 7),
      isNegative: true,
    },
  };
};

const getUpgradeCost = (rawBubba, upgradeIndex) => {
  const level = rawBubba?.[1]?.[upgradeIndex] || 0;
  const upgrade = bubbaUpgrades?.[upgradeIndex];
  const x1 = upgrade?.x1 || 0;
  const x2 = upgrade?.x2 || 0;

  // Cost reduction multipliers
  const costReduction4 = 1 / (1 + getTotUpgBonus(rawBubba, 4) / 100);
  const costReduction18 = 1 / (1 + getTotUpgBonus(rawBubba, 18) / 100);
  const costReduction26 = 1 / (1 + getTotUpgBonus(rawBubba, 26) / 100);
  const costReductionCharisma = 1 / (1 + getCharismaBonus(rawBubba, 1) / 100);

  // Base cost calculation
  const baseCost = Math.pow(upgradeIndex + 1, 2) * level
    + Math.pow(2.4 + upgradeIndex / 3.65, upgradeIndex) * Math.pow(x2, level);

  return costReduction4
    * costReduction18
    * costReduction26
    * costReductionCharisma
    * baseCost
    * x1;
};

// Helper function to get RealLV (level + prestige)
const getRealLV = (rawBubba, upgradeIndex) => {
  const level = rawBubba?.[1]?.[upgradeIndex] || 0;
  const prestige = rawBubba?.[2]?.[upgradeIndex] || 0;
  return Math.round(level + prestige);
};

// Helper function to get TotUpgBonus
const getTotUpgBonus = (rawBubba, upgradeIndex) => {
  const realLV = getRealLV(rawBubba, upgradeIndex);
  const upgradeBonus = bubbaUpgrades?.[upgradeIndex]?.x3 || 0; // x3 value from bubbaUpgrades
  return realLV * upgradeBonus;
};

// Helper function to get HappinessBonus
const getHappinessBonus = (rawBubba) => {
  const happiness = rawBubba?.[0]?.[1] || 0;
  return 1 + (10 * (lavaLog2(happiness) + 25 * lavaLog(happiness) + Math.pow(happiness, 0.75))) / 100;
};

// Helper function to get TotalQTYofLVs
const getTotalQTYofLVs = (rawBubba) => {
  let total = 0;
  for (let i = 0; i < 28; i++) {
    total = Math.round(total + getRealLV(rawBubba, i));
  }
  return total;
};

// Helper function to get CharismaBonus
const getCharismaBonus = (rawBubba, traitIndex) => {
  const charismaData = generalSpelunky?.[37]?.split(' ') || []; // Charisma bonus values
  const selectedTrait = rawBubba?.[0]?.[15] || 0;
  const charismaLevel = rawBubba?.[3]?.[traitIndex] || 0;
  const charismaValue = parseFloat(charismaData?.[traitIndex] || 0);
  const isSelected = Math.round(traitIndex + 1) === selectedTrait;
  const totUpgBonus13 = getTotUpgBonus(rawBubba, 13);

  if (isSelected) {
    return 3 * charismaLevel * charismaValue * (1 + totUpgBonus13 / 100);
  }
  return charismaLevel * charismaValue * (1 + totUpgBonus13 / 100);
};

// Helper function to get GiftPassiveBonus
const getGiftPassiveBonus = (rawBubba, giftIndex, checkAll = false) => {
  const giftPassiveData = generalSpelunky?.[41]?.split(' ') || []; // Gift passive bonus values
  const selectedGift1 = rawBubba?.[0]?.[2] || 0;
  const selectedGift2 = rawBubba?.[0]?.[3] || 0;

  if (checkAll && selectedGift1 !== Math.round(giftIndex + 1) && selectedGift2 !== Math.round(giftIndex + 1)) {
    return 0;
  }

  const giftValue = parseFloat(giftPassiveData?.[giftIndex] || 0);
  const totUpgBonus17 = getTotUpgBonus(rawBubba, 17);
  return giftValue * Math.min(5, 1 + totUpgBonus17 / 100);
};

// Helper function to get Dice_Multi
const getDiceMulti = (rawBubba) => {
  let diceTotal = 0;
  for (let i = 0; i < 8; i++) {
    const diceValue = rawBubba?.[4]?.[i] || 0;
    if (diceValue > 0) {
      diceTotal = Math.max(1, diceTotal) * (Math.min(diceValue, 6) + Math.max(diceValue - 6, 0) / 2.5);
    }
  }
  return 1 + diceTotal / 100;
};

// Helper function to get SmokeMeat_Multi
const getSmokeMeatMulti = (rawBubba) => {
  const smokeMeatData = generalSpelunky?.[34]?.[0]?.split(' ') || []; // Smoke meat bonus values
  let smokeMeatTotal = 1;
  for (let i = 0; i < 5; i++) {
    const smokeMeatValue = rawBubba?.[5]?.[i] || 0;
    if (smokeMeatValue > 0) {
      const smokeMeatBonus = parseFloat(smokeMeatData?.[i] || 0);
      smokeMeatTotal = smokeMeatTotal * (1 + (smokeMeatValue * smokeMeatBonus) / 100);
    }
  }
  return smokeMeatTotal;
};

// Helper function to get MegafleshOwned
const getMegafleshOwned = (rawBubba, megafleshIndex) => {
  const megafleshLevel = rawBubba?.[1]?.[8] || 0;
  if (megafleshLevel > megafleshIndex) {
    if (megafleshIndex === 11) {
      return megafleshLevel - 11;
    }
    return 1;
  }
  return 0;
};

// Helper function to get BubbaRoG_Bonuses (Ring of Greed bonuses)
const getBubbaBonuses = (rawBubba, ringIndex) => {
  const rogBonusesData = generalSpelunky?.[33]?.split(' ') || []; // Ring of Greed bonuses

  // Calculate Bubba_RoG_all: 20 * sum of MegafleshOwned for indices 1, 3, 6, 9, 11
  const bubbaRoGAll = 20 * (
    getMegafleshOwned(rawBubba, 1) +
    getMegafleshOwned(rawBubba, 3) +
    getMegafleshOwned(rawBubba, 6) +
    getMegafleshOwned(rawBubba, 9) +
    getMegafleshOwned(rawBubba, 11)
  );

  // Get the Ring of Greed bonus value for this ring index
  const rogBonusValue = parseFloat(rogBonusesData?.[Math.round(ringIndex)] || 0);

  // Get the level of upgrade index 3 (Bubba[1][3])
  const upgrade3Level = rawBubba?.[1]?.[3] || 0;

  // Calculate the bonus: (1 + Bubba_RoG_all / 100) * Spelunky[33][ringIndex] * Math.ceil((Bubba[1][3] - (ringIndex - 1)) / 7)
  const bonus = (1 + bubbaRoGAll / 100)
    * rogBonusValue
    * Math.ceil((upgrade3Level - (ringIndex - 1)) / 7);

  return Math.max(0, bonus);
};

// Helper function to get SpareCoins_Multi
const getSpareCoinsMulti = (rawBubba) => {
  const coin1 = rawBubba?.[0]?.[9] || 0;
  const coin2 = rawBubba?.[0]?.[10] || 0;
  const coin3 = rawBubba?.[0]?.[11] || 0;
  const coin4 = rawBubba?.[0]?.[12] || 0;
  return 1 + (coin1 + (5 * coin2 + (25 * coin3 + 100 * coin4))) / 100;
};

// Helper function to get DailyPetting
const getDailyPetting = (rawBubba) => {
  const realLV1 = getRealLV(rawBubba, 1);
  return Math.ceil(lavaLog2(realLV1) + Math.min(realLV1, 3));
};

// Helper function to get DailyPet_HappinessFromUpg
const getDailyPetHappinessFromUpg = (rawBubba) => {
  const totUpgBonus5 = getTotUpgBonus(rawBubba, 5);
  const totUpgBonus20 = getTotUpgBonus(rawBubba, 20);
  const charismaBonus2 = getCharismaBonus(rawBubba, 2);
  const giftPassiveBonus1 = getGiftPassiveBonus(rawBubba, 1, true);
  const multiplier = 1 + (totUpgBonus20 + (charismaBonus2 + giftPassiveBonus1)) / 100;

  return (Math.min(1, totUpgBonus5) + (totUpgBonus5 / (totUpgBonus5 + 200)) * 2) * multiplier;
};

// Helper function to format timer display (seconds to HH:MM:SS)
const formatTimerDisplay = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

// Format upgrade description with bonus values
const formatUpgradeDescription = (rawBubba, upgradeIndex) => {
  const upgrade = bubbaUpgrades?.[upgradeIndex];
  if (!upgrade || !upgrade.description) {
    return '';
  }

  let description = upgrade.description;
  const bonus = getTotUpgBonus(rawBubba, upgradeIndex);

  // Replace { with bonus value
  if (description.includes('{')) {
    const bonusValue = bonus < 1e6
      ? commaNotation(bonus)
      : notateNumber(bonus, 'Big');
    description = description.replace('{', bonusValue);
  }

  // Replace } with multiplier (1 + bonus / 100)
  if (description.includes('}')) {
    const multiplier = 1 + bonus / 100;
    let multiplierStr = notateNumber(multiplier, 'MultiplierInfo');
    // Remove # if present
    multiplierStr = multiplierStr.replace(/#/g, '');
    description = description.replace('}', multiplierStr);
  }

  // Replace $ with special values
  if (description.includes('$')) {
    let dollarValue = '';
    if (upgradeIndex === 4 || upgradeIndex === 18 || upgradeIndex === 26) {
      // Cost reduction percentage
      dollarValue = Math.floor(1e4 * (1 - 1 / (1 + bonus / 100))) / 100;
    } else if (upgradeIndex === 1) {
      // DailyPetting value
      dollarValue = getDailyPetting(rawBubba);
    } else if (upgradeIndex === 5) {
      // DailyPet_HappinessFromUpg value
      dollarValue = Math.round(100 * getDailyPetHappinessFromUpg(rawBubba)) / 100;
    }
    description = description.replace('$', dollarValue);
  }

  // Replace ~ with timer values
  if (description.includes('~')) {
    let timerValue = '';
    if (upgradeIndex === 1 || upgradeIndex === 12) {
      // Timer for 3600 - Bubba[0][13]
      const timeRemaining = Math.max(0, 3600 - (rawBubba?.[0]?.[13] || 0));
      timerValue = formatTimerDisplay(timeRemaining);
    } else if (upgradeIndex === 15) {
      // Timer for Bubba[0][14]
      const timeValue = rawBubba?.[0]?.[14] || 0;
      timerValue = formatTimerDisplay(timeValue);
    }
    description = description.replace('~', timerValue);
  }

  return description;
};

// Calculate MeatsliceRate
const getMeatsliceRate = (rawBubba, account) => {
  const baseRate = getTotUpgBonus(rawBubba, 0) + getTotUpgBonus(rawBubba, 7) + getTotUpgBonus(rawBubba, 23);
  const percentageBonus = (getTotUpgBonus(rawBubba, 2)
    + getTotUpgBonus(rawBubba, 11)
    + getTotUpgBonus(rawBubba, 19)
    + getTotUpgBonus(rawBubba, 24) * lavaLog(account?.accountOptions?.[267] || 1)) / 100;

  const happinessBonus = getHappinessBonus(rawBubba);
  const diceMulti = getDiceMulti(rawBubba);
  const smokeMeatMulti = getSmokeMeatMulti(rawBubba);
  const charismaBonus = getCharismaBonus(rawBubba, 0) / 100;
  const megafleshBonus = (getMegafleshOwned(rawBubba, 0) * getTotalQTYofLVs(rawBubba)) / 100;
  const giftPassiveBonus = getGiftPassiveBonus(rawBubba, 0, true) / 100;
  const spareCoinsMulti = getSpareCoinsMulti(rawBubba);

  return baseRate
    * (1 + percentageBonus)
    * happinessBonus
    * diceMulti
    * smokeMeatMulti
    * (1 + charismaBonus)
    * (1 + megafleshBonus)
    * (1 + giftPassiveBonus)
    * spareCoinsMulti;
};