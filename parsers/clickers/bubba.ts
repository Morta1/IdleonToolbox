import { cleanUnderscore, gameFill, lavaLog, lavaLog2, tryToParse } from '@utility/helpers';
import { bubbaUpgrades, generalSpelunky } from '@website-data';
import { getCompanionBonus, getEventShopBonus } from '@parsers/misc';
import { additiveGroup, createBreakdown, flat, multiplier, percent, sumGroup } from '@parsers/breakdown';
import { getUpgradeVaultBonus } from '@parsers/misc/upgradeVault';
import { getSushiBonus } from '@parsers/world-7/sushiStation';
import { getJellyBonus } from '@parsers/world-7/jellyOperator';
import { getFountainBonusTotal } from '@parsers/world-5/caverns/the-fountain';
import { getMineheadBonusQTY } from '@parsers/world-7/minehead';
import { getClickerCheapener } from '@parsers/world-7/menagerie';
import { getPetArenaCrucBonus } from '@parsers/world-4/breeding';
import { OPT } from '@parsers/accountOptions';

const BUBBA_CHEAPENER_BOOST = 20;
const UNCAPPED_LEVEL = 999;
const MAX_UPGRADE_TYPES = 28;
// Bubba Boon (upgrade 3): its level unlocks Bubba's IdleOn bonuses one by one
const BUBBA_BOON = 3;
export const SMOKER_UPGRADE = 15;

// Minehead opponent whose bonus makes every Bubba upgrade cheaper
const MINEHEAD_BUBBA_COST_BONUS = 5;

export const getBubba = (idleonData: any, account: any) => {
  const rawBubba = tryToParse(idleonData?.Bubba);

  return parseBubba(rawBubba, account);
}

// game: "MeatProdREQ"
const getMeatProdREQ = (upgradeTypeIndex: any) => {
  if (upgradeTypeIndex === 0) return 0;
  return 50 * Math.pow(2.8 + upgradeTypeIndex / 3.55, upgradeTypeIndex - Math.min(1, Math.floor(upgradeTypeIndex / 4)));
};

// Helper function to get TotalUpgTypesAvailable
// This is calculated by checking how many upgrade types can be unlocked based on meat production
// game: "TotalUpgTypesAvailable"
const getTotalUpgTypesAvailable = (rawBubba: any) => {
  const meatProduced = rawBubba?.[0]?.[4] || 0;
  let totalAvailable = 1; // Start with at least 1 upgrade type available

  for (let i = 1; i < MAX_UPGRADE_TYPES; i++) {
    const meatReq = getMeatProdREQ(i);
    if (meatProduced >= meatReq) {
      totalAvailable = i + 1;
    }
    else {
      break;
    }
  }

  return Math.min(MAX_UPGRADE_TYPES, totalAvailable);
};

const parseBubba = (rawBubba: any, account: any) => {
  const totalUpgTypesAvailable = getTotalUpgTypesAvailable(rawBubba);
  const megafleshOwned = rawBubba?.[1]?.[8] || 0;
  const upgrades = bubbaUpgrades.map((upgrade, index) => {
    const level = rawBubba?.[1]?.[index] || 0;
    // game: an upgrade buys while Bubba[1][n] < BubbaUpg[n][4], 999 meaning no cap
    const maxLevel = upgrade?.x4 && upgrade.x4 !== UNCAPPED_LEVEL ? upgrade.x4 : null;
    return {
      ...upgrade,
      level,
      maxLevel,
      maxed: maxLevel !== null && level >= maxLevel,
      prestige: rawBubba?.[2]?.[index] || 0,
      realLV: getRealLV(rawBubba, index),
      cost: getUpgradeCost(rawBubba, account, index),
      bonus: getTotUpgBonus(rawBubba, index),
      description: formatUpgradeDescription(rawBubba, index),
      unlocked: index < totalUpgTypesAvailable
    }
  });
  const megafleshDesc = generalSpelunky?.[38] || [];
  const megaFlesh = megafleshDesc.map((description: any, index: any) => {
    const base = {
      description: replaceLineBreaks(description),
      unlocked: index + 1 <= megafleshOwned,
      // game: the panel title, "GLAZED_MEGAFLESH ... CHROMATIC_#_MEGAFLESH" (the 12th counts its stacks)
      name: MEGAFLESH_NAMES[index]
    };
    if (index === 0) {
      const value = 1 + (getMegafleshOwned(rawBubba, 0) * getTotalQTYofLVs(rawBubba)) / 100;
      const formatted = gameFill(value, value < 100 ? 'MultiplierInfo' : 'Comma');
      return { ...base, totalBonus: formatted };
    }
    if (index === 11) {
      // game: ActorEvents_713 _event_11 draws Bubba[1][8] - 11 once 12 <= Bubba[1][8]; the bonus still reads Bubba[1][8] - 12
      const amount = Math.max(0, megafleshOwned - 11);
      const value = 2 + Math.max(0, megafleshOwned - 12) / 5;
      return {
        ...base,
        amount,
        totalBonus: gameFill(value, 'MultiplierInfo'),
        // Every Megaflesh past the 12th stacks on it: MegafleshOwned(11) = Bubba[1][8] - 11, +0.20x each
        nextBonus: gameFill(megafleshOwned >= 12 ? value + 0.2 : value, 'MultiplierInfo')
      };
    }
    return base;
  });
  return {
    upgrades,
    meatSlices: rawBubba?.[0]?.[0] || 0,
    meatsliceRate: 60 * getMeatsliceRate(rawBubba, account),
    meatsliceRateBreakdown: getMeatsliceRateBreakdown(rawBubba, account),
    progress: rawBubba?.[0]?.[4] || 0,
    progressReq: getProgressReq(totalUpgTypesAvailable),
    // game: with every type out, the panel draws a max mark instead of the next goal
    allUpgradesAvailable: totalUpgTypesAvailable >= MAX_UPGRADE_TYPES,
    bonuses: getBubbaBonusesObject(rawBubba, account),
    totalUpgTypesAvailable,
    megafleshOwned,
    megaFlesh,
    // Smoker (upgrade 15) smoking time: banked seconds [0][14] plus pending idle seconds [0][7],
    // which the game folds into [0][14] next time the Bubba window ticks
    smokerUnlocked: totalUpgTypesAvailable > SMOKER_UPGRADE,
    smokerSeconds: (rawBubba?.[0]?.[14] || 0) + (rawBubba?.[0]?.[7] || 0)
  };
}

// The smoked meat tier roll is floor(5 * rand ^ max(0.1, 9 - 10 * t / (7200 + t))).
// The exponent bottoms out at 0.1 once t / (7200 + t) = 0.89, so waiting longer gains nothing.
export const SMOKER_MAX_QUALITY_SECONDS = 0.89 * 7200 / 0.11;

const getProgressReq = (totalUpgTypesAvailable: any) => {
  return 50 * Math.pow(2.8 + totalUpgTypesAvailable / 3.55, totalUpgTypesAvailable - Math.min(1, Math.floor(totalUpgTypesAvailable / 4)));
}

const getBubbaBonusesObject = (rawBubba: any, account: any) => {
  // Define the structure of the bonuses
  const bonusMap = {
    buildRate: { name: 'Build Rate', id: 1 },
    critterGain: { name: 'Critter Gain', id: 2 },
    soulGain: { name: 'Soul Gain', id: 3 },
    totalDamage: { name: 'Total DMG', id: 4 },
    allKills: { name: 'All Kills', id: 5 },
    expMulti: { name: 'XP Multi', id: 6 },
    atomCost: { name: 'Atom Cost', id: 7, isNegative: true }
  };

  const boonLevel = rawBubba?.[1]?.[BUBBA_BOON] || 0;
  return Object.keys(bonusMap).reduce((acc, key) => {
    const { name, id, isNegative = false } = (bonusMap as Record<string, any>)[key];

    (acc as Record<string, any>)[key] = {
      name,
      bonus: getBubbaBonuses(rawBubba, account, id),
      isNegative,
      // game: bonus n is ceil((Bubba Boon - (n - 1)) / 7) steps, so it starts at Bubba Boon Lv n; at 0 the game draws a lock
      unlockLevel: id,
      unlocked: boonLevel >= id
    };

    return acc;
  }, {});
};

// game: "UpgCost"
const getUpgradeCost = (rawBubba: any, account: any, upgradeIndex: any) => {
  const level = rawBubba?.[1]?.[upgradeIndex] || 0;
  const upgrade = bubbaUpgrades?.[upgradeIndex];
  const x1 = upgrade?.x1 || 0;
  const x2 = upgrade?.x2 || 0;

  // Cost reduction multipliers
  const costReductionMinehead = 1 / (1 + getMineheadBonusQTY(account, MINEHEAD_BUBBA_COST_BONUS) / 100);
  const costReduction4 = 1 / (1 + getTotUpgBonus(rawBubba, 4) / 100);
  const costReduction18 = 1 / (1 + getTotUpgBonus(rawBubba, 18) / 100);
  const costReduction26 = 1 / (1 + getTotUpgBonus(rawBubba, 26) / 100);
  const costReductionCharisma = 1 / (1 + getCharismaBonus(rawBubba, 1) / 100);
  // game: MenagerieStuff("BubbaCheapener", t, 0)
  const menagerieCheapener = getClickerCheapener(account, BUBBA_CHEAPENER_BOOST, upgradeIndex);
  const costReductionEventShop = 1 / (1 + getEventShopBonus(account, 58));

  // Base cost calculation
  const baseCost = Math.pow(upgradeIndex + 1, 2) * level
    + Math.pow(2.4 + upgradeIndex / 3.65, upgradeIndex) * Math.pow(x2, level);

  return costReductionMinehead
    * costReduction4
    * costReduction18
    * costReductionEventShop
    * menagerieCheapener
    * costReduction26
    * costReductionCharisma
    * baseCost
    * x1;
};

// game: "RealLV" - level + prestige
const getRealLV = (rawBubba: any, upgradeIndex: any) => {
  const level = rawBubba?.[1]?.[upgradeIndex] || 0;
  const prestige = rawBubba?.[2]?.[upgradeIndex] || 0;
  return Math.round(level + prestige);
};

// game: "TotUpgBonus"
const getTotUpgBonus = (rawBubba: any, upgradeIndex: any) => {
  const realLV = getRealLV(rawBubba, upgradeIndex);
  const upgradeBonus = bubbaUpgrades?.[upgradeIndex]?.x3 || 0; // x3 value from bubbaUpgrades
  return realLV * upgradeBonus;
};

// game: "HappinessBonus"
const getHappinessBonus = (rawBubba: any) => {
  const happiness = rawBubba?.[0]?.[1] || 0;
  return 1 + (10 * (lavaLog2(happiness) + 25 * lavaLog(happiness) + Math.pow(happiness, 0.75))) / 100;
};

// game: "TotalQTYofLVs"
const getTotalQTYofLVs = (rawBubba: any) => {
  let total = 0;
  for (let i = 0; i < 28; i++) {
    total = Math.round(total + getRealLV(rawBubba, i));
  }
  return total;
};

// game: "CharismaBonus"
const getCharismaBonus = (rawBubba: any, traitIndex: any) => {
  const charismaData = generalSpelunky?.[37] || []; // Charisma bonus values
  const selectedTrait = rawBubba?.[0]?.[15] || 0;
  const charismaLevel = rawBubba?.[3]?.[traitIndex] || 0;
  const charismaValue = parseFloat(charismaData?.[traitIndex] || '0');
  const isSelected = Math.round(traitIndex + 1) === selectedTrait;
  const totUpgBonus13 = getTotUpgBonus(rawBubba, 13);

  if (isSelected) {
    return 3 * charismaLevel * charismaValue * (1 + totUpgBonus13 / 100);
  }
  return charismaLevel * charismaValue * (1 + totUpgBonus13 / 100);
};

// game: "GiftPassiveBonus"
const getGiftPassiveBonus = (rawBubba: any, giftIndex: any, checkAll = false) => {
  const giftPassiveData = generalSpelunky?.[41] || []; // Gift passive bonus values
  const selectedGift1 = rawBubba?.[0]?.[2] || 0;
  const selectedGift2 = rawBubba?.[0]?.[3] || 0;

  if (checkAll && selectedGift1 !== Math.round(giftIndex + 1) && selectedGift2 !== Math.round(giftIndex + 1)) {
    return 0;
  }

  const giftValue = parseFloat(giftPassiveData?.[giftIndex] || '0');
  const totUpgBonus17 = getTotUpgBonus(rawBubba, 17);
  return giftValue * Math.min(5, 1 + totUpgBonus17 / 100);
};

// game: "Dice_MaxSides"
const getDiceMaxSides = (rawBubba: any) =>
  Math.round(Math.min(20, 6 + getTotUpgBonus(rawBubba, 16) + 5 * getMegafleshOwned(rawBubba, 4)));

// game: "Dice_Multi"
const getDiceMulti = (rawBubba: any) => {
  let diceTotal = 0;
  for (let i = 0; i < 8; i++) {
    const diceValue = rawBubba?.[4]?.[i] || 0;
    if (diceValue > 0) {
      diceTotal = Math.max(1, diceTotal) * (Math.min(diceValue, 6) + Math.max(diceValue - 6, 0) / 2.5);
    }
  }
  return 1 + diceTotal / 100;
};

// game: "SmokeMeat_Multi"
const getSmokeMeatMulti = (rawBubba: any) => {
  const smokeMeatData = generalSpelunky?.[34] || []; // Smoke meat bonus values, one per smoked meat tier
  let smokeMeatTotal = 1;
  for (let i = 0; i < 5; i++) {
    const smokeMeatValue = rawBubba?.[5]?.[i] || 0;
    if (smokeMeatValue > 0) {
      const smokeMeatBonus = parseFloat(smokeMeatData?.[i] || '0');
      smokeMeatTotal = smokeMeatTotal * (1 + (smokeMeatValue * smokeMeatBonus) / 100);
    }
  }
  return smokeMeatTotal;
};

// game: "MegafleshOwned"
const getMegafleshOwned = (rawBubba: any, megafleshIndex: any) => {
  const megafleshLevel = rawBubba?.[1]?.[8] || 0;
  if (megafleshLevel > megafleshIndex) {
    if (megafleshIndex === 11) {
      return megafleshLevel - 11;
    }
    return 1;
  }
  return 0;
};

// game: "BubbaRoG_Bonuses" - Ring of Greed bonuses
const MEGAFLESH_NAMES = ['Glazed', 'Mutton', 'Bacon', 'Pork', 'Sooshi', 'Salmon', 'Golden', 'Beef', 'Tenderloin', 'Sirloin',
  'Ambiguous', 'Chromatic'];

const getBubbaBonuses = (rawBubba: any, account: any, ringIndex: any) => {
  const rogBonusesData = generalSpelunky?.[33] || [];
  const companionBonus = getCompanionBonus(account, 51);

  // Calculate Bubba_RoG_all: 20 * sum of MegafleshOwned for indices 1, 3, 6, 9, 11
  const bubbaRoGAll = 20 * (
    getMegafleshOwned(rawBubba, 1) +
    getMegafleshOwned(rawBubba, 3) +
    getMegafleshOwned(rawBubba, 6) +
    getMegafleshOwned(rawBubba, 9) +
    getMegafleshOwned(rawBubba, 11)
  );

  // Get the Ring of Greed bonus value for this ring index
  const rogBonusValue = parseFloat(rogBonusesData?.[Math.round(ringIndex)] || '0');

  const upgrade3Level = rawBubba?.[1]?.[BUBBA_BOON] || 0;

  // Calculate the bonus: (1 + Bubba_RoG_all / 100) * Spelunky[33][ringIndex] * Math.ceil((Bubba[1][3] - (ringIndex - 1)) / 7)
  const bonus = (1 + bubbaRoGAll / 100)
    * rogBonusValue
    * Math.ceil((upgrade3Level - (ringIndex - 1)) / 7)
    * (1 + companionBonus);

  return Math.max(0, bonus);
};

// game: "SpareCoins_Multi"
const getSpareCoinsMulti = (rawBubba: any) => {
  const coin1 = rawBubba?.[0]?.[9] || 0;
  const coin2 = rawBubba?.[0]?.[10] || 0;
  const coin3 = rawBubba?.[0]?.[11] || 0;
  const coin4 = rawBubba?.[0]?.[12] || 0;
  return 1 + (coin1 + (5 * coin2 + (25 * coin3 + 100 * coin4))) / 100;
};

// game: "DailyPetting"
const getDailyPetting = (rawBubba: any) => {
  const realLV1 = getRealLV(rawBubba, 1);
  return Math.ceil(lavaLog2(realLV1) + Math.min(realLV1, 3));
};

// game: "DailyPet_HappinessFromUpg"
const getDailyPetHappinessFromUpg = (rawBubba: any) => {
  const totUpgBonus5 = getTotUpgBonus(rawBubba, 5);
  const totUpgBonus20 = getTotUpgBonus(rawBubba, 20);
  const charismaBonus2 = getCharismaBonus(rawBubba, 2);
  const giftPassiveBonus1 = getGiftPassiveBonus(rawBubba, 1, true);
  const multiplier = 1 + (totUpgBonus20 + (charismaBonus2 + giftPassiveBonus1)) / 100;

  return (Math.min(1, totUpgBonus5) + (totUpgBonus5 / (totUpgBonus5 + 200)) * 2) * multiplier;
};

// The game renders @ as a line break
const replaceLineBreaks = (description: any) => String(description ?? '').replace(/_*@_*/g, '\n');

// Format upgrade description with bonus values
const formatUpgradeDescription = (rawBubba: any, upgradeIndex: any) => {
  const upgrade = bubbaUpgrades?.[upgradeIndex];
  if (!upgrade || !upgrade.description) {
    return '';
  }

  let description = upgrade.description;
  const bonus = getTotUpgBonus(rawBubba, upgradeIndex);

  // Replace { with bonus value
  if (description.includes('{')) {
    description = description.replace('{', gameFill(bonus, bonus < 1e6 ? 'Comma' : 'Big'));
  }

  // Replace } with multiplier (1 + bonus / 100)
  if (description.includes('}')) {
    const multiplier = 1 + bonus / 100;
    description = description.replace('}', gameFill(multiplier, 'MultiplierInfo'));
  }

  // Replace $ with special values
  if (description.includes('$')) {
    let dollarValue: any = '';
    if (upgradeIndex === 4 || upgradeIndex === 18 || upgradeIndex === 26) {
      // Cost reduction percentage
      dollarValue = Math.floor(1e4 * (1 - 1 / (1 + bonus / 100))) / 100;
    }
    else if (upgradeIndex === 1) {
      // DailyPetting value
      dollarValue = getDailyPetting(rawBubba);
    }
    else if (upgradeIndex === 5) {
      // DailyPet_HappinessFromUpg value
      dollarValue = Math.round(100 * getDailyPetHappinessFromUpg(rawBubba)) / 100;
    }
    else if (upgradeIndex === 16) {
      // More Sides: the game's panel never fills this "$", but the text means the max dice roll
      dollarValue = getDiceMaxSides(rawBubba);
    }
    description = description.replace('$', '' + dollarValue);
  }

  // The game's ~ is a clock it runs live ("Your next pats come in ~"): frozen at the save's time it reads wrong, so its
  // line goes
  return replaceLineBreaks(description.split('@').filter((line: string) => !line.includes('~')).join('@'));
};

const SLICE_UPGRADES = [0, 7, 23];
const MEAT_UPGRADES = [2, 11, 19];
const CROSSOVER = 24;

// game: "MeatsliceRate"'s factors, per second
const getMeatsliceRateParts = (rawBubba: any, account: any) => {
  const crossover = getTotUpgBonus(rawBubba, CROSSOVER) * lavaLog(account?.accountOptions?.[OPT.kangarooFish] || 1);
  return {
    slices: SLICE_UPGRADES.map((index) => ({ index, value: getTotUpgBonus(rawBubba, index) })),
    meat: [...MEAT_UPGRADES.map((index) => ({ index, value: getTotUpgBonus(rawBubba, index) })), { index: CROSSOVER, value: crossover }],
    happinessBonus: getHappinessBonus(rawBubba),
    eventShop: 1 + 2 * getEventShopBonus(account, 58),
    diceMulti: getDiceMulti(rawBubba),
    smokeMeatMulti: getSmokeMeatMulti(rawBubba),
    charisma: 1 + getCharismaBonus(rawBubba, 0) / 100,
    // game: (1 + 2 * Breeding("PetArenaCrucBonus", "0", 10, 0))
    crucible: 1 + 2 * getPetArenaCrucBonus(account, 10),
    megaflesh: 1 + (getMegafleshOwned(rawBubba, 0) * getTotalQTYofLVs(rawBubba)) / 100,
    gifts: 1 + getGiftPassiveBonus(rawBubba, 0, true) / 100,
    spareCoinsMulti: getSpareCoinsMulti(rawBubba),
    vault: 1 + getUpgradeVaultBonus(account?.upgradeVault?.upgrades, 65) / 100,
    sushi: 1 + getSushiBonus(account, 39) / 100,
    jelly: 1 + getJellyBonus(account, 58) / 100,
    // Bubba Forever (Green Water)
    fountain: 1 + getFountainBonusTotal(account?.hole?.holesObject, 2, 18) / 100
  };
};

const sumValues = (entries: { value: number }[]) => entries.reduce((total, { value }) => total + value, 0);

// game: "MeatsliceRate"
const getMeatsliceRate = (rawBubba: any, account: any) => {
  const parts = getMeatsliceRateParts(rawBubba, account);
  return sumValues(parts.slices)
    * (1 + sumValues(parts.meat) / 100)
    * parts.happinessBonus
    * parts.eventShop
    * parts.diceMulti
    * parts.smokeMeatMulti
    * parts.charisma
    * parts.crucible
    * parts.megaflesh
    * parts.gifts
    * parts.spareCoinsMulti
    * parts.vault
    * parts.sushi
    * parts.jelly
    * parts.fountain;
};

const upgradeName = (index: number): string => cleanUnderscore(bubbaUpgrades?.[index]?.name ?? '') ?? '';

// The slices-per-minute tile's drawer: the slice upgrades per minute, then what multiplies them
const getMeatsliceRateBreakdown = (rawBubba: any, account: any) => {
  const parts = getMeatsliceRateParts(rawBubba, account);
  return createBreakdown('Meat slices per minute', 60 * getMeatsliceRate(rawBubba, account), [
    sumGroup('Slice upgrades', parts.slices.map(({ index, value }) => flat(upgradeName(index), 60 * value))),
    additiveGroup('Meat upgrades', parts.meat.map(({ index, value }) => percent(upgradeName(index), value))),
    multiplier('Happiness', parts.happinessBonus),
    multiplier('Frozen Dice', parts.diceMulti),
    multiplier('Smoked Meat', parts.smokeMeatMulti),
    multiplier('Spare Coins', parts.spareCoinsMulti),
    multiplier('Charisma Chart', parts.charisma),
    multiplier('Gifts', parts.gifts),
    multiplier('Megaflesh', parts.megaflesh),
    multiplier('Event Shop', parts.eventShop),
    multiplier('Crucible', parts.crucible),
    multiplier('Upgrade Vault', parts.vault),
    multiplier('Sushi Station', parts.sushi),
    multiplier('Jelly Operator', parts.jelly),
    multiplier('Fountain', parts.fountain)
  ]);
};