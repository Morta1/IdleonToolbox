// Generic Upgrade Optimizer
// Consolidates the simulation logic for Compass, Grimoire, and Tesseract optimizers

/**
 * getOptimizedGenericUpgrades
 * @param {Object} params
 * @param {Object} params.character
 * @param {Object} params.account
 * @param {string} params.category
 * @param {number} params.maxUpgrades
 * @param {Object} params.categoryInfo - { upgradeIndices, stats }
 * @param {function} params.getUpgrades - (account) => upgrades[]
 * @param {function} params.getResources - (account) => resources[]
 * @param {function} params.getCurrentStats - (simulatedUpgrades, character, account, extraArgs?) => statsObj
 * @param {function} params.getUpgradeCost - (upgrade, index, context) => cost
 * @param {function} params.applyUpgrade - (upgrade, upgradesArr) => upgradesArr (with upgrade applied)
 * @param {function} [params.updateResourcesAfterUpgrade] - (resources, upgrade, resourceNames) => void (optional)
 * @param {Object} [params.resourceNames] - (optional, for resource deduction)
 * @param {Object} [params.extraArgs] - (optional, for extra context)
 * @returns {Array} Array of recommended upgrades with stat changes and efficiency
 */
export function getOptimizedGenericUpgrades({
  character,
  account,
  category = 'damage',
  maxUpgrades = 100,
  categoryInfo,
  getUpgrades,
  getResources,
  getCurrentStats,
  getUpgradeCost,
  applyUpgrade,
  updateResourcesAfterUpgrade,
  resourceNames,
  extraArgs = {}
}) {
  // Working copies for simulation
  let simulatedUpgrades = getUpgrades(account).map(u => ({ ...u }));
  let simulatedResources = getResources(account);

  // Track current stats for comparison
  let currentStats = getCurrentStats(simulatedUpgrades, character, account, extraArgs);

  // Special handling for dust category
  let getExtraDust = extraArgs.getExtraDust;
  let currentDustMultiplier = (category === 'dust' && typeof getExtraDust === 'function')
    ? getExtraDust(character, {
        ...account,
        compass: { ...account.compass, upgrades: simulatedUpgrades }
      })
    : 0;

  const results = [];

  for (let step = 0; step < maxUpgrades; step++) {
    let bestUpgrade = null;
    let bestEfficiency = 0;
    let bestStatChanges = null;
    let bestTotalChange = 0;
    let bestNewStats = null;
    let bestNewDustMultiplier = 0;

    // Find available upgrades for this category
    const availableUpgrades = simulatedUpgrades.filter(upgrade => {
      if (!categoryInfo.upgradeIndices.includes(upgrade.index)) return false;
      if (upgrade.level >= upgrade.x4) return false;
      if (!upgrade.unlocked) return false; // Only unlocked upgrades
      return true;
    });

    for (const upgrade of availableUpgrades) {
      // Simulate applying this upgrade
      const tempUpgrades = simulatedUpgrades.map(u =>
        u.index === upgrade.index ? { ...u, level: u.level + 1 } : u
      );
      const newStats = getCurrentStats(tempUpgrades, character, account, extraArgs);

      // Special handling for dust
      let newDustMultiplier = currentDustMultiplier;
      if (category === 'dust' && typeof getExtraDust === 'function') {
        newDustMultiplier = getExtraDust(character, {
          ...account,
          compass: { ...account.compass, upgrades: tempUpgrades }
        });
      }

      // Calculate stat changes
      const statChanges = categoryInfo.stats.map(stat => {
        if (category === 'dust' && stat === 'dust' && typeof getExtraDust === 'function') {
          const change = newDustMultiplier - currentDustMultiplier;
          const percentChange = currentDustMultiplier > 0 ? ((newDustMultiplier - currentDustMultiplier) / currentDustMultiplier) * 100 : 0;
          return {
            stat: 'extraDust',
            change,
            percentChange
          };
        }
        const currentValue = currentStats[stat] || 0;
        const newValue = newStats[stat] || 0;
        return {
          stat,
          change: newValue - currentValue,
          percentChange: currentValue > 0 ? ((newValue - currentValue) / currentValue) * 100 : 0
        };
      });

      // Calculate total efficiency
      const totalStatChange = statChanges.reduce((sum, change) => sum + change.percentChange, 0);
      const cost = getUpgradeCost(upgrade, upgrade.index, { account, upgrades: simulatedUpgrades, ...extraArgs });
      const efficiency = totalStatChange / cost;

      if (efficiency > bestEfficiency) {
        bestUpgrade = upgrade;
        bestEfficiency = efficiency;
        bestStatChanges = statChanges;
        bestTotalChange = totalStatChange;
        bestNewStats = newStats;
        bestNewDustMultiplier = newDustMultiplier;
      }
    }

    if (bestUpgrade && bestEfficiency > 0) {
      // Create a snapshot for the result
      const upgradeSnapshot = { ...bestUpgrade, level: bestUpgrade.level + 1 };
      const cost = getUpgradeCost(bestUpgrade, bestUpgrade.index, { account, upgrades: simulatedUpgrades, ...extraArgs });
      results.push({
        ...upgradeSnapshot,
        efficiency: bestEfficiency,
        statChanges: bestStatChanges,
        totalStatChange: bestTotalChange,
        cost
      });

      // Apply the upgrade in our simulation
      const upgradeToUpdate = simulatedUpgrades.find(u => u.index === bestUpgrade.index);
      upgradeToUpdate.level += 1;

      // Optionally update resources
      if (updateResourcesAfterUpgrade && resourceNames) {
        updateResourcesAfterUpgrade(simulatedResources, bestUpgrade, resourceNames, cost);
      }

      // Update current stats for next iteration
      currentStats = bestNewStats;
      if (category === 'dust' && typeof getExtraDust === 'function') {
        currentDustMultiplier = bestNewDustMultiplier;
      }

      // Recalculate all upgrade costs after this purchase
      simulatedUpgrades = simulatedUpgrades.map((upgrade, index) => {
        const cost = getUpgradeCost(upgrade, index, { account, upgrades: simulatedUpgrades, ...extraArgs });
        return { ...upgrade, cost };
      });
    } else {
      // No more efficient upgrades available
      break;
    }
  }

  return results;
} 