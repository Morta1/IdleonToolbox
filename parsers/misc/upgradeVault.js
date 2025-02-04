import { tryToParse } from '@utility/helpers';
import { upgradeVault } from '../../data/website-data';

export const getUpgradeVault = (idleonData, accountData) => {
  const upgradeVaultRaw = idleonData?.UpgVault || tryToParse(idleonData?.UpgVault);
  return parseUpgradeVault(upgradeVaultRaw, accountData);
}

export const parseUpgradeVault = (upgradeVaultRaw, accountData) => {
  console.log('upgradeVaultRaw', upgradeVaultRaw)
  const totalUpgradeLevels = upgradeVaultRaw?.reduce((sum, level) => sum + level, 0);
  let upgrades = upgradeVault.map((upgrade, index) => {
    return {
      ...upgrade,
      level: upgradeVaultRaw?.[index],
      unlocked: totalUpgradeLevels >= upgrade?.unlockLevel
    }
  })
  upgrades = upgrades.map((upgrade, index) => {
    return {
      ...upgrade,
      cost: getUpgradeCost(upgrades, index),
      costToMax: getCostToMax(upgrades, index),
      bonus: calcUpgradeVaultBonus(upgrades, index)
    }
  })
  const nextUnlock = upgrades?.find(({ unlocked }) => !unlocked);
  console.log(nextUnlock)
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
  return Math.max(0.1, 1 - calcUpgradeVaultBonus(upgrades, 13) / 100)
    * (level + (x1 + level)
      * Math.pow(x2, level));
}

export const getUpgradeVaultBonus = (upgrades, index) => {
  return upgrades?.[index]?.bonus || 0;
}

const calcUpgradeVaultBonus = (upgrades, index) => {
  const { level, x5 } = upgrades?.[index];
  return 32 === index || 1 === index || 6 === index || 7 === index || 8 === index || 9 === index || 13 === index || 999 === index || 999 === index
    ? level * x5
    : 0 === index
      ? (level
        * x5
        + (Math.max(0, level - 25)
          + (Math.max(0, level - 50)
            + Math.max(0, level - 100))))
      * (1 + calcUpgradeVaultBonus(upgrades, 32) / 100)
      : level
      * x5
      * (1 + calcUpgradeVaultBonus(upgrades, 32) / 100);
}