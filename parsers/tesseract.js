import { commaNotation, getFilteredPortals, lavaLog, lavaLog2, notateNumber, tryToParse } from '@utility/helpers';
import { mapEnemiesArray, mapPortals, monsterDrops, monsters, tesseract, items } from '@website-data';
import { CLASSES, getCharacterByHighestTalent, getTalentBonus, getHighestTalentByClass } from '@parsers/talents';
import { getStatsFromGear } from '@parsers/items';
import { getArcadeBonus } from '@parsers/arcade';
import { getJewelBonus, getLabBonus } from '@parsers/lab';
import { getEmperorBonus } from '@parsers/world-6/emperor';
import { getCharmBonus } from '@parsers/world-6/sneaking';
import { hasItemDropped, isBundlePurchased, getMasterclassCostReduction } from '@parsers/misc';
import { getOptimizedGenericUpgrades } from './genericUpgradeOptimizer';
import { getLegendTalentBonus } from '@parsers/world-7/legendTalents';
import { getPaletteBonus } from '@parsers/gaming';
import { getExoticMarketBonus } from '@parsers/world-6/farming';

export const tachyonNames = {
  0: 'Purple',
  1: 'Brown',
  2: 'Green',
  3: 'Red',
  4: 'Silver',
  5: 'Gold'
};

export const TESSERACT_UPGRADE_CATEGORIES = {
  damage: {
    name: 'Damage',
    stats: ['damage'],
    upgradeIndices: [0, 4, 6, 12, 15, 24, 31, 36, 42, 50, 53, 39, 49, 54]
  },
  accuracy: {
    name: 'Accuracy',
    stats: ['accuracy'],
    upgradeIndices: [1, 9, 19, 22, 27, 38, 44, 52, 55, 39, 49, 54]
  },
  defence: {
    name: 'Defence',
    stats: ['defence'],
    upgradeIndices: [2, 11, 22, 29, 44, 46, 55, 39, 49, 54]
  },
  crit: {
    name: 'Crit',
    stats: ['critPct', 'critDamage'],
    upgradeIndices: [8, 14, 39, 49, 54]
  },
  attackSpeed: {
    name: 'Attack Speed',
    stats: ['attackSpeed'],
    upgradeIndices: [21, 39, 49, 54]
  }
};

export const mapBonusNames = {
  0: 'DR',
  1: 'EXP',
  2: 'AFK'
}

export const getTesseract = (idleonData, characters, account) => {
  const tachyons = account?.accountOptions?.slice(388, 394).map((value, index) => ({
    value,
    name: tachyonNames?.[index]
  }));
  const totalTachyons = tachyons?.reduce((sum, { value }) => sum + value, 0);
  const tesseractRaw = tryToParse(idleonData?.Arcane) || [];
  const [portalsRaw] = tryToParse(idleonData?.Tess) || [];
  const mapBonusRaw = tryToParse(idleonData?.MapBon) || [];
  const totalUpgradeLevels = tesseractRaw?.reduce((sum, level) => sum + level, 0);
  let upgrades = tesseract?.map((upgrade, index) => {
    const level = tesseractRaw?.[index]
    return {
      ...upgrade,
      level,
      index
    }
  });
  upgrades = upgrades.map((upgrade, index) => {
    const bonus = calcTesseractBonus(upgrades, index);
    const nextLevelBonus = getTesseractBonusAtLevel(upgrades, index, upgrade?.level + 1);
    return {
      ...upgrade,
      unlocked: upgrade?.x6 <= totalUpgradeLevels,
      bonus,
      nextLevelBonus,
      bonusDiff: nextLevelBonus - bonus,
      description: getDescription(upgrade?.description, bonus)
    }
  })
  upgrades = upgrades.map((upgrade, index) => {
    const cost = getUpgradeCost({ ...upgrade, index, account, upgrades });
    return {
      ...upgrade,
      cost
    }
  })

  const crystalChargeReq = getCrystalChargeReq(characters, upgrades)
  const weaponDropChance = 1 / (300 * Math.pow(1.2, account?.accountOptions?.[396]));
  const weaponQuality = calcTesseractBonus(upgrades, 5, 0);
  const ringDropChance = 1 / (500 * Math.pow(1.2, account?.accountOptions?.[397]));
  const ringQuality = calcTesseractBonus(upgrades, 23, 0);

  const unlockedPortals = (portalsRaw || []).reduce((result, mapRaw) => {
    return {
      ...result,
      [mapRaw]: true
    }
  }, {});

  return {
    upgrades,
    tachyons,
    totalTachyons,
    totalUpgradeLevels,
    crystalChargeReq,
    weaponDropChance,
    weaponQuality,
    ringDropChance,
    ringQuality,
    unlockedPortals,
    mapBonusRaw
  }
}

export const getTesseractBonus = (account, index) => {
  return account?.tesseract?.upgrades?.[index]?.bonus || 0;
}

export const getWeaponBaseStats = (itemQuality) => {
  const item = items?.["EquipmentWandsArc0"];
  const baseStats = {
    speed: item?.Speed,
    weaponPower: item?.Weapon_Power,
    uq1: item?.UQ1val,
    uq2: item?.UQ2val,
  };
  const pow15 = (v) => Math.pow(v, 15);

  // === Speed ===
  // Original: randomInt(-2, min(6, 2 + floor(quality/300))) * pow(randomFloat(min(.7, .4 + quality/6000), 1), 15)
  const speedIntMin = -2;
  const speedIntMax = Math.min(6, 2 + Math.floor(itemQuality / 300));
  const speedFloatMin = Math.min(0.7, 0.4 + itemQuality / 6000);
  const speedFloatMax = 1;
  const speedMin = baseStats.speed + Math.round(speedIntMin * pow15(speedFloatMin));
  const speedMax = baseStats.speed + Math.round(speedIntMax * pow15(speedFloatMax));

  // === Weapon Power ===
  // Original: randomInt(-5, 15) * pow(randomFloat(min(.92, .8 + quality/20000), 1), 15) + floor(quality/25)
  const wpIntMin = -5;
  const wpIntMax = 15;
  const wpFloatMin = Math.min(0.92, 0.8 + itemQuality / 20000);
  const wpFloatMax = 1;
  const qualityBonus = Math.floor(itemQuality / 25);
  const wpMin = baseStats.weaponPower + Math.round(wpIntMin * pow15(wpFloatMin) + qualityBonus);
  const wpMax = baseStats.weaponPower + Math.round(wpIntMax * pow15(wpFloatMax) + qualityBonus);

  // === UQ1val (Arcanist DMG) ===
  // Original: randomInt(-10, 50) * pow(randomFloat(min(.92, .8 + quality/20000), 1), 15) + floor(quality/20)
  const uq1IntMin = -10;
  const uq1IntMax = 50;
  const uq1FloatMin = Math.min(0.92, 0.8 + itemQuality / 20000);
  const uq1FloatMax = 1;
  const uq1QualityBonus = Math.floor(itemQuality / 20);
  const uq1Min = baseStats.uq1 + Math.round(uq1IntMin * pow15(uq1FloatMin) + uq1QualityBonus);
  const uq1Max = baseStats.uq1 + Math.round(uq1IntMax * pow15(uq1FloatMax) + uq1QualityBonus);

  // === UQ2val (Extra Tachyons) ===
  // Original: randomInt(-1, 30) * pow(randomFloat(min(.92, .8 + quality/20000), 1), 15) + floor(quality/15)
  const uq2IntMin = -1;
  const uq2IntMax = 30;
  const uq2FloatMin = Math.min(0.92, 0.8 + itemQuality / 20000);
  const uq2FloatMax = 1;
  const uq2QualityBonus = Math.floor(itemQuality / 15);
  const uq2Min = baseStats.uq2 + Math.round(uq2IntMin * pow15(uq2FloatMin) + uq2QualityBonus);
  const uq2Max = baseStats.uq2 + Math.round(uq2IntMax * pow15(uq2FloatMax) + uq2QualityBonus);

  return [
    { title: 'Base stats' },
    { name: 'Speed', min: speedMin, max: speedMax },
    { name: 'Weapon Power', min: wpMin, max: wpMax },
    { name: 'Arcanist DMG', min: uq1Min, max: uq1Max },
    { name: 'Extra Tachyons', min: uq2Min, max: uq2Max }
  ]
}

export const getRingBaseStats = (itemQuality) => {
  const item = items?.["EquipmentRingsArc0"];
  const baseStats = {
    uq1: item?.UQ1val,
    uq2: item?.UQ2val,
  };
  const pow15 = (v) => Math.pow(v, 15);

  // === UQ1val (Arcanist ACC) ===
  // Original: randomInt(-5, 40) * pow(randomFloat(min(.92, .8 + quality/20000), 1), 15) + floor(quality/15)
  const uq1IntMin = -5;
  const uq1IntMax = 40;
  const uq1FloatMin = Math.min(0.92, 0.8 + itemQuality / 20000);
  const uq1FloatMax = 1;
  const uq1QualityBonus = Math.floor(itemQuality / 15);
  const uq1Min = baseStats.uq1 + Math.round(uq1IntMin * pow15(uq1FloatMin) + uq1QualityBonus);
  const uq1Max = baseStats.uq1 + Math.round(uq1IntMax * pow15(uq1FloatMax) + uq1QualityBonus);

  // === UQ2val (Extra Tachyons) ===
  // Original: randomInt(-1, 30) * pow(randomFloat(min(.92, .8 + quality/20000), 1), 15) + floor(quality/10)
  const uq2IntMin = -1;
  const uq2IntMax = 30;
  const uq2FloatMin = Math.min(0.92, 0.8 + itemQuality / 20000);
  const uq2FloatMax = 1;
  const uq2QualityBonus = Math.floor(itemQuality / 10);
  const uq2Min = baseStats.uq2 + Math.round(uq2IntMin * pow15(uq2FloatMin) + uq2QualityBonus);
  const uq2Max = baseStats.uq2 + Math.round(uq2IntMax * pow15(uq2FloatMax) + uq2QualityBonus);

  return [
    { title: 'Base stats' },
    { name: 'Arcanist ACC', min: uq1Min, max: uq1Max },
    { name: 'Extra Tachyons', min: uq2Min, max: uq2Max }
  ]
}

export const getTesseractMapBonus = (account, characters, character, bonusIndex) => {
  const tesseractMapBonuses = getMaps(account, characters, character);
  const charMap = tesseractMapBonuses?.find(({ mapIndex }) => parseFloat(mapIndex) === parseFloat(character?.mapIndex));
  const bonus = charMap?.mapBonuses?.[bonusIndex]?.value;
  return bonus > 0 ? bonus : 0;
}
export const getMaps = (account, characters, character) => {
  const { unlockedPortals, upgrades, mapBonusRaw } = account?.tesseract;
  const highestOverwhelmingEnergy = getHighestTalentByClass(characters, CLASSES.Arcane_Cultist, 'OVERWHELMING_ENERGY');

  const maxMapBonus = 100 * (highestOverwhelmingEnergy - 1) + Math.min(10, calcTesseractBonus(upgrades, 58, 0))
  return getFilteredPortals()?.map(({ mapIndex, mapName }) => {
    const availablePortals = mapPortals?.[mapIndex];
    const portals = availablePortals.map((_, portalIndex) => {
      return {
        unlocked: unlockedPortals?.[mapIndex + '_' + portalIndex]
      }
    });
    const monsterRawName = mapEnemiesArray?.[mapIndex];
    const coinQuantity = monsterDrops?.[monsterRawName]?.find(({ rawName }) => rawName === 'COIN')?.quantity;
    const tachyonQuantity = getTachyonQuantityBase(coinQuantity);
    const tachyonType = getTachyonType(coinQuantity);
    const mapBonuses = getMapMultiBonus(mapBonusRaw?.[mapIndex], maxMapBonus);

    return {
      mapIndex,
      mapName,
      portals,
      reqKills: getMapKillsReq(mapIndex),
      timeLeft: getMapTimeLeft(mapIndex),
      monster: monsters?.[monsterRawName],
      unlocked: portals.every(({ unlocked }) => unlocked),
      tachyonQuantity,
      tachyonType,
      mapBonuses
    }
  });

}

const getMapMultiBonus = (mapBonuses, maxMapBonus) => {
  const multiBonuses = [];

  for (let index = 0; index < 3; index++) {
    const rawKills = parseInt(mapBonuses?.[index], 10);
    const arcaneValue = getMapMulti(rawKills);
    const clampedValue = Math.min(maxMapBonus, arcaneValue);

    let killsToNext;
    let testKills = rawKills;

    // First check: if adding 100,000 kills doesn't change the value at 1000x precision
    if (Math.floor(1000 * arcaneValue) === Math.floor(1000 * getMapMulti(testKills + Math.pow(10, 5)))) {
      killsToNext = 'TONS';
    }
    else {
      let precisionPower = 4;
      let iterationCount = 0;

      while (iterationCount < 5) {
        iterationCount++;

        while (Math.floor(10 * getMapMulti(rawKills)) === Math.floor(10 * getMapMulti(testKills + Math.pow(10, precisionPower)))) {
          testKills += Math.pow(10, precisionPower);
        }

        precisionPower--;
      }

      killsToNext = testKills - rawKills;
    }

    multiBonuses.push({
      kills: rawKills,
      value: clampedValue,
      killsToNext,
      type: mapBonusNames?.[index]
    });
  }

  return multiBonuses;
};

const getMapMulti = (index) => {
  return (2 * Math.max(0, lavaLog(index) - 3.5)
    + Math.max(0, lavaLog2(index) - 12))
    * (lavaLog(index) / 2.5)
    + (Math.min(2, index / 1e3) + Math.max(5 * (lavaLog(index) - 5), 0));
}

export const getTachyonQuantityBase = (index) => {
  const type = getTachyonType(index);

  if (type >= 5) {
    return Math.pow(Math.max(1, index - 9999) / 8, 0.83);
  }
  else if (type >= 4) {
    return Math.pow(Math.max(1, index - 3999) / 6, 0.87);
  }
  else if (type >= 3) {
    if (index === 1850) return 40;
    if (index === 2500) return 80;
    return Math.max(5, Math.pow(Math.max(1, index - 2749) / 5, 0.9));
  }
  else if (type >= 2) {
    return Math.max(3, Math.pow(Math.max(1, index - 799) / 3, 0.9));
  }
  else if (type >= 1) {
    return Math.pow(Math.max(1, index - 249) / 2, 0.9);
  }
  else {
    return Math.pow(Math.max(1, index) / 2, 0.9);
  }
};

export const getTachyonType = (index) => {
  if (index === 5e5) return 5;
  if (index === 12500 || index === 4e5) return 4;
  if (index === 2500 || index === 1850) return 3;
  if (index === 770 || index === 1500 || index === 22e3 || index === 23e4) return 2;
  if (index === 6e3 || index === 2e5) return 1;
  if (index === 8500 || index === 17e3 || index === 175e3) return 0;
  if (index >= 1e4) {
    return Math.min(Math.floor(index / 71) % 6, 5);
  }
  if (index >= 4e3) {
    return Math.min(Math.floor(index / 71) % 5, 4);
  }
  if (index >= 2750) {
    return Math.min(Math.floor(index / 35) % 4, 3);
  }
  if (index >= 800) {
    return Math.min(Math.floor(index / 35) % 3, 2);
  }
  if (index >= 250) {
    return Math.min(Math.floor(index / 35) % 2, 1);
  }
  return 0;
};

export const getExtraTachyon = (character, account) => {
  const upgrades = account?.tesseract?.upgrades;
  const tesseract = getTalentBonus(character?.flatTalents, 'TESSERACT');
  const { value: equipBonus } = getStatsFromGear(character, 95, account);
  const arcadeBonus = getArcadeBonus(account?.arcade?.shop, 'Arcane_Tachyons')?.bonus ?? 0;
  const spelunkerObolMulti = getLabBonus(account?.lab.labBonuses, 8); // gem multi
  const jewelBonus = getJewelBonus(account?.lab.jewels, 23, spelunkerObolMulti);
  const emperorBonus = getEmperorBonus(account, 6);
  const charmBonus = getCharmBonus(account, 'Mystery_Fizz');
  const backupEnergy = getTalentBonus(character?.flatTalents, 'BACKUP_ENERGY');
  const bundleBonus = isBundlePurchased(account?.bundles, 'bun_x') ? 1.2 : 1;

  return (1 + (calcTesseractBonus(upgrades, 17, 0)
    + (tesseract +
      ((calcTesseractBonus(upgrades, 34, 0) * lavaLog(account?.accountOptions?.[390]))
        + ((calcTesseractBonus(upgrades, 56, 0) * lavaLog(account?.accountOptions?.[393]))
          + (equipBonus + (jewelBonus + arcadeBonus)))))) / 100)
    * (1 + emperorBonus / 100)
    * (1 + charmBonus / 100)
    * Math.max(1, backupEnergy)
    * bundleBonus
}

export const getMapKillsReq = (mapId) => {
  const worldReq = [10, 20, 40, 70, 80, 250, 250, 250];
  return 25 > mapId ? 5 : worldReq[Math.floor(mapId / 50)];
}

export const getMapTimeLeft = (mapId) => {
  const worldReq = [360, 270, 225, 200, 180, 180, 180, 180];
  return worldReq[Math.floor(mapId / 50)]
}

export const getArcanistStats = (upgrades, totalUpgradeLevels, character, account) => {
  const labotomizer = getTalentBonus(character?.flatTalents, 'LABOTOMIZER')
  const ghastlyPowerX = getTalentBonus(character?.flatTalents, 'GHASTLY_POWER');
  const ghastlyPowerY = getTalentBonus(character?.flatTalents, 'GHASTLY_POWER', true);
  const goulishPower = getTalentBonus(character?.flatTalents, 'GHOULISH_POWER');
  const arcanistForm = getTalentBonus(character?.flatTalents, 'ARCANIST_FORM');
  const { value: equipBonus } = getStatsFromGear(character, 94, account);
  const { value: equipBonus2 } = getStatsFromGear(character, 93, account);
  let equipmentWeaponPower = 0;
  const bowWeaponPower = character?.equipment?.[1];

  if (bowWeaponPower?.rawName?.includes('EquipmentWandsArc')) {
    equipmentWeaponPower += bowWeaponPower?.Weapon_Power;
  }

  const damage = (5 + (calcTesseractBonus(upgrades, 0, 0) + (calcTesseractBonus(upgrades, 6, 0)
    + (calcTesseractBonus(upgrades, 15, 0) + (calcTesseractBonus(upgrades, 36, 0)
      + calcTesseractBonus(upgrades, 50, 0)))))) * (1 + (ghastlyPowerX
        * (totalUpgradeLevels / 100)) / 100)
    * Math.pow(1.04, Math.max(0, equipmentWeaponPower))
    * (1 + arcanistForm / 100)
    * (1 + (calcTesseractBonus(upgrades, 12, 0)
      * lavaLog(account?.accountOptions?.[388])
      + (calcTesseractBonus(upgrades, 4, 0) + (calcTesseractBonus(upgrades, 24, 0)
        + (calcTesseractBonus(upgrades, 31, 0)
          + (calcTesseractBonus(upgrades, 42, 0) + calcTesseractBonus(upgrades, 53, 0)))))) / 100)
    * (1 + equipBonus2 / 100);
  const defence = (calcTesseractBonus(upgrades, 2, 0)
    + (calcTesseractBonus(upgrades, 11, 0)
      + (calcTesseractBonus(upgrades, 29, 0)
        + calcTesseractBonus(upgrades, 46, 0))))
    * (1 + (goulishPower *
      (totalUpgradeLevels / 100)) / 100)
    * (1 + (calcTesseractBonus(upgrades, 22, 0)
      + (calcTesseractBonus(upgrades, 44, 0)
        + calcTesseractBonus(upgrades, 55, 0))) / 100)
    * (1 + (calcTesseractBonus(upgrades, 41, 0)
      * lavaLog(account?.accountOptions?.[391])) / 100);

  const accuracy = (2 + (calcTesseractBonus(upgrades, 1, 0)
    + (calcTesseractBonus(upgrades, 9, 0)
      + (calcTesseractBonus(upgrades, 19, 0)
        + (calcTesseractBonus(upgrades, 38, 0)
          + calcTesseractBonus(upgrades, 52, 0))))))
    * (1 + (goulishPower *
      (totalUpgradeLevels / 100)) / 100)
    * (1 + (calcTesseractBonus(upgrades, 22, 0)
      + (calcTesseractBonus(upgrades, 44, 0) +
        calcTesseractBonus(upgrades, 55, 0))) / 100)
    * (1 + (calcTesseractBonus(upgrades, 27, 0) *
      lavaLog(account?.accountOptions?.[389])) / 100)
    * (1 + equipBonus / 100);
  const mastery = 0.25;
  const critPct = 5 + calcTesseractBonus(upgrades, 8, 0) + labotomizer
    * Math.floor(character?.skillsInfo?.laboratory?.level / 10);
  const critDamage = 1 + (20 + calcTesseractBonus(upgrades, 14, 0)) / 100;
  const attackSpeed = ghastlyPowerY
    * (totalUpgradeLevels / 100)
    + calcTesseractBonus(upgrades, 21, 0);

  return {
    damage,
    defence,
    accuracy,
    mastery,
    critPct,
    critDamage,
    attackSpeed
  }
}

const getDescription = (description, bonus) => {
  if (bonus < 1e9) {
    description = description.replace('{', commaNotation(bonus));
    if (bonus < 1e3) {
      const multiplier = 1 + bonus / 100;
      description = description.replace('}', notateNumber(multiplier, 'MultiplierInfo'));
    }
    else {
      const multiplier = Math.floor(1 + bonus / 100);
      description = description.replace('}', commaNotation(multiplier));
    }
  }
  else {
    description = description.replace('{', notateNumber(bonus));
  }
  return description;
}

const getCrystalChargeReq = (characters, upgrades) => {
  const bestArcane = getCharacterByHighestTalent(characters, CLASSES.Arcane_Cultist, 'BACKUP_ENERGY', true);
  const bestBackupEnergy = getTalentBonus(bestArcane?.flatTalents, 'BACKUP_ENERGY');

  return Math.ceil(Math.max(50, 200
    - (Math.min(100, calcTesseractBonus(upgrades, 13, 0))
      + Math.min(10, bestBackupEnergy))));
}
export const getPrismaFragChance = (character, account, upgrades) => {
  const primoPrisma = getTalentBonus(character?.flatTalents, 'PRIMO_PRISMA');
  return (1 / (1e3 * Math.pow(1.27, account?.accountOptions?.[395])))
    * Math.max(1, (character?.dropRate?.dropRate - 1)
      * (calcTesseractBonus(upgrades, 51, 0) / 100))
    * Math.max(1, primoPrisma * Math.pow(1.5, Math.floor(character?.mapIndex / 50)))
}

export const getPrismaMulti = (account) => {
  const arcadeBonus = getArcadeBonus(account?.arcade?.shop, 'Prisma_Bonuses')?.bonus ?? 0;
  const tesseractBonus = getTesseractBonus(account, 45) ?? 0;
  const paletteBonus = getPaletteBonus(account, 28) ?? 0;
  const exoticMarketBonus = getExoticMarketBonus(account, 48) ?? 0;
  const legendBonus = getLegendTalentBonus(account, 36) ?? 0;
  const trophyBonus = hasItemDropped(account, 'Trophy23') ? 10 : 0;
  const totalEtherealSigils = account?.alchemy?.p2w?.totalEtherealSigils || 0;
  const sigilsBonus = 0.2 * totalEtherealSigils;

  const value = Math.min(3, 2 + (tesseractBonus + (arcadeBonus + (trophyBonus + (paletteBonus + (sigilsBonus + exoticMarketBonus)))) + legendBonus) / 100);

  return {
    value,
    breakdown: {
      statName: "Prisma multi",
      totalValue: notateNumber(value, "MultiplierInfo"),
      categories: [
        {
          name: "Additive",
          sources: [
            { name: "Tesseract", value: tesseractBonus },
            { name: "Arcade", value: arcadeBonus },
            { name: "Trophy", value: trophyBonus },
            { name: "Palette", value: paletteBonus },
            { name: "Ethereal Sigils", value: sigilsBonus },
            { name: "Exotic Market", value: exoticMarketBonus },
            { name: "Legend Talent", value: legendBonus },
          ],
        },
      ],
    }
  };
}

const getUpgradeCost = ({ index, x1, x2, level, account, upgrades, forceLegendTalent }) => {
  return 3 * getMasterclassCostReduction(account, forceLegendTalent)
    * (1 / (1 + (calcTesseractBonus(upgrades, 49, 0)
      * lavaLog(account?.accountOptions?.[392])) / 100))
    * Math.pow(1.04, index) * (level + (x1 + level) * Math.pow(x2 + 0.01, level))
}

const getTesseractBonusAtLevel = (upgrades, index, levelOverride) => {
  const tempUpgrades = upgrades.map((u, i) =>
    i === index ? { ...u, level: levelOverride } : { ...u }
  );

  return calcTesseractBonus(tempUpgrades, index, 0);
};

export const calcTesseractBonus = (upgrades, index, anotherIndex) => {
  const upgrade = upgrades?.[index];
  return 3 === index || 7 === index || 8 === index || 10 === index ||
    13 === index || 16 === index || 20 === index ||
    25 === index || 26 === index || 28 === index ||
    33 === index || 35 === index || 39 === index ||
    40 === index || 43 === index || 45 === index ||
    48 === index || 57 === index || 58 === index
    ? 999 === anotherIndex
      ? 0
      : upgrade?.level * upgrade?.x5
    : 999 === anotherIndex
      ? 69.42
      : upgrade?.level * upgrade?.x5 * (1 + calcTesseractBonus(upgrades, 39, 0) / 100);
}

export const getOptimizedTesseractUpgrades = (character, account, category = 'damage', maxUpgrades = 100, options = {}) => {
  const categoryInfo = TESSERACT_UPGRADE_CATEGORIES[category];
  return getOptimizedGenericUpgrades({
    character,
    account,
    category,
    maxUpgrades,
    categoryInfo,
    getUpgrades: acc => acc?.tesseract?.upgrades || [],
    getResources: acc => acc?.tesseract?.tachyons || [],
    getCurrentStats: (upgrades, char, acc) => getArcanistStats(upgrades, acc?.tesseract?.totalUpgradeLevels, char, acc),
    getUpgradeCost: (upgrade, index, { account, upgrades, forceLegendTalent }) => getUpgradeCost({ ...upgrade, index, account, upgrades, forceLegendTalent }),
    applyUpgrade: (upgrade, upgradesArr) => upgradesArr.map(u => u.index === upgrade.index ? {
      ...u,
      level: u.level + 1
    } : u),
    updateResourcesAfterUpgrade: (resources, upgrade, resourceNames, cost) => {
      const tachyonType = tachyonNames[upgrade.x3];
      const resource = resources.find(r => r.name === tachyonType);
      if (resource) resource.value -= cost;
    },
    resourceNames: tachyonNames,
    extraArgs: options
  });
};