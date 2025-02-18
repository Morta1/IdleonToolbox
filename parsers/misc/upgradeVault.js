import { commaNotation, notateNumber, tryToParse } from '@utility/helpers';
import { upgradeVault } from '../../data/website-data';

export const getUpgradeVault = (idleonData, accountData) => {
  const upgradeVaultRaw = idleonData?.UpgVault || tryToParse(idleonData?.UpgVault);
  return parseUpgradeVault(upgradeVaultRaw, accountData);
}

export const parseUpgradeVault = (upgradeVaultRaw) => {
  const totalUpgradeLevels = upgradeVaultRaw?.reduce((sum, level) => sum + level, 0);
  let upgrades = upgradeVault.map((upgrade, index) => {
    return {
      ...upgrade,
      level: upgradeVaultRaw?.[index],
      unlocked: totalUpgradeLevels >= upgrade?.unlockLevel
    }
  })
  upgrades = upgrades.map((upgrade, index) => {
    const bonus = calcUpgradeVaultBonus(upgrades, index);
    const description = upgrade?.description?.replace('{', commaNotation(bonus)).replace('}', notateNumber(1 + bonus / 100, 'MultiplierInfo'));
    return {
      ...upgrade,
      cost: getUpgradeCost(upgrades, index),
      costToMax: getCostToMax(upgrades, index),
      bonus,
      description
    }
  })
  const nextUnlock = upgrades?.find(({ unlocked }) => !unlocked);

  return {
    upgrades,
    totalUpgradeLevels,
    nextUnlock
  };
}


const getCostToMax = (upgrades, index) => {
  const localUpgrades = structuredClone(upgrades);
  const { level, maxLevel } = localUpgrades?.[index];
  let costToMax = 0;
  for (let i = level; i < maxLevel; i++) {
    localUpgrades[index].level = i;
    costToMax += getUpgradeCost(localUpgrades, index)
  }
  return costToMax ?? 0;
}

const getUpgradeCost = (upgrades, index) => {
  const { level, x1, x2 } = upgrades?.[index];
  return 33 > index
    ? Math.max(0.1, 1 - calcUpgradeVaultBonus(upgrades, 13) / 100)
    * (level + (x1 + level) * Math.pow(x2, level))
    : 1 * (level + (x1 + level) * Math.pow(x2, level))
}

export const getUpgradeVaultBonus = (upgrades, index) => {
  return upgrades?.[index]?.bonus || 0;
}

const calcUpgradeVaultBonus = (upgrades, index) => {
  const { level, x5 } = upgrades?.[index];
  const higherBonuses = upgrades?.[60];
  return 32 === index || 1 === index || 6 === index
  || 7 === index || 8 === index || 9 === index
  || 13 === index || 999 === index || 999 === index
  || 33 === index || 36 === index || 40 === index
  || 42 === index || 43 === index || 44 === index
  || 49 === index || 51 === index || 52 === index
  || 53 === index || 57 === index || 61 === index
  || 999 === index
    ? level * x5
    : 0 === index
      ? (level
        * x5
        + (Math.max(0, level - 25)
          + (Math.max(0, level - 50)
            + Math.max(0, level - 100))))
      * (1 + calcUpgradeVaultBonus(upgrades, 32, 0) / 100)
      : 60 === index
        ? (higherBonuses?.level
          * higherBonuses?.x5
          + (Math.max(0, higherBonuses?.level - 25)
            + (Math.max(0, higherBonuses?.level - 50)
              + (2 * Math.max(0, higherBonuses?.level - 100)
                + (3 * Math.max(0, higherBonuses?.level - 200)
                  + (5 * Math.max(0, higherBonuses?.level - 300)
                    + (7 * Math.max(0, higherBonuses?.level - 400)
                      + 10 * Math.max(0, higherBonuses?.level - 450))))))))
        * (1 + Math.floor(higherBonuses?.level / 25) / 5)
        * (1 + calcUpgradeVaultBonus(upgrades, 61, 0) / 100)
        : 32 > index
          ? level
          * x5
          * (1 + calcUpgradeVaultBonus(upgrades, 32, 0) / 100)
          : 61 > index
            ? level
            * x5
            * (1 + calcUpgradeVaultBonus(upgrades, 61, 0) / 100)
            : 0;
}