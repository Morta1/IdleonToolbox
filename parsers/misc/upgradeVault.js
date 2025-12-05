import { commaNotation, notateNumber, tryToParse, lavaLog } from '@utility/helpers';
import { upgradeVault, mapPortals } from '@website-data';

export const getUpgradeVault = (idleonData, accountData, charactersData) => {
  const upgradeVaultRaw = idleonData?.UpgVault || tryToParse(idleonData?.UpgVault);
  return parseUpgradeVault(upgradeVaultRaw, accountData, charactersData);
}

export const parseUpgradeVault = (upgradeVaultRaw, accountData, charactersData) => {
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
  const vaultTotalKills = getVaultTotalKills({ characters: charactersData, account: accountData });

  return {
    upgrades,
    totalUpgradeLevels,
    nextUnlock,
    vaultTotalKills
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

/**
 * Calculate VaultKillzTOT - used for upgrade vault bonuses
 * Based on obfuscated code: _customBlock_VaultKillzTOT
 * 
 * This calculates various kill-related metrics for vault upgrades:
 * - Kills needed to advance for 4 world portals (maps 14, 24, 13, 8)
 * - Log transformations of those kills
 * - Completed tasks count
 * - Cauldron (alchemy bubbles) levels
 * - Kills for map 101
 * 
 * @param {Object} params - Parameters object
 * @param {Array} params.characters - Array of character objects with kills property (calculated from character.js)
 * @param {Object} params.account - Account data with alchemy bubbles and tasks (account.tasks[3] is task completions array)
 * @param {Number} index - Index to return from VaultKillzTOT array (0-10)
 * @returns {Number} Value from VaultKillzTOT at the specified index
 */
export const getVaultTotalKills = ({ characters, account }) => {
  // Map indices for the 4 world portals: [14, 24, 13, 8]
  const worldPortalMapIndices = [14, 24, 13, 8];
  const vaultKillzTotals = [];

  // Calculate kills for 4 world portals
  // character.kills[mapIndex] already contains: mapPortals[mapIndex][0] - KillsLeft2Advance[mapIndex][0]
  for (let worldIndex = 0; worldIndex < 4; worldIndex++) {
    const mapIndex = worldPortalMapIndices[worldIndex];
    let totalKills = 0;

    // Sum kills from all characters
    for (let charIndex = 0; charIndex < characters?.length; charIndex++) {
      totalKills += parseFloat(characters[charIndex]?.kills?.[mapIndex] || 0);
    }

    vaultKillzTotals.push(totalKills);
  }

  // Apply log transformation for each of the 4 values
  // If value < 10, push 0, otherwise push Math.floor(lavaLog(value))
  for (let worldIndex = 0; worldIndex < 4; worldIndex++) {
    const portalKills = vaultKillzTotals[worldIndex];
    if (portalKills < 10) {
      vaultKillzTotals.push(0);
    } else {
      vaultKillzTotals.push(Math.floor(lavaLog(portalKills)));
    }
  }

  // Count completed tasks for each world (account.tasks[3][worldIndex])
  // account.tasks[3] is the task completion array where 1 = completed
  let totalCompletedTasks = 0;
  for (let worldIndex = 0; worldIndex < 4; worldIndex++) {
    const worldTasks = account?.tasks?.[3]?.[worldIndex] || [];
    const completedTasks = worldTasks.filter(task => task === 1).length;
    totalCompletedTasks += completedTasks;
  }
  vaultKillzTotals.push(totalCompletedTasks);

  // Sum cauldron info for each world (alchemy bubbles, min 100 each)
  // CauldronInfo[worldIndex] contains bubble levels, capped at 100 each
  let totalCauldronLevels = 0;
  for (let worldIndex = 0; worldIndex < 4; worldIndex++) {
    const worldBubbles = account?.alchemy?.bubbles?.[worldIndex] || [];
    const bubbleSum = worldBubbles.reduce((sum, bubble) => {
      return sum + Math.min(100, bubble?.level || 0);
    }, 0);
    totalCauldronLevels = Math.round(totalCauldronLevels + bubbleSum);
  }
  vaultKillzTotals.push(totalCauldronLevels);

  // Calculate kills for map 101
  const world5PortalMapIndex = 101;
  let totalMap101Kills = 0;

  // Sum kills from all characters for map 101
  for (let charIndex = 0; charIndex < characters?.length; charIndex++) {
    totalMap101Kills += parseFloat(characters[charIndex]?.kills?.[world5PortalMapIndex] || 0);
  }

  vaultKillzTotals.push(totalMap101Kills);
  vaultKillzTotals.push(Math.floor(lavaLog(totalMap101Kills)));

  return vaultKillzTotals;
}