// Generic Upgrade Optimizer
// Consolidates the simulation logic for Compass, Grimoire, and Tesseract optimizers

// Helper function to check if an upgrade is affordable
function isUpgradeAffordable(upgrade, cost, simulatedResources, resourceNames) {
  const resourceType = upgrade?.x3 || upgrade?.boneType;
  // Array of objects with value property
  if (Array.isArray(simulatedResources) && simulatedResources.length > 0 && typeof simulatedResources[0] === 'object' && simulatedResources[0] !== null && 'value' in simulatedResources[0]) {
    let resourceObj = null;
    if (resourceType !== undefined) {
      resourceObj = simulatedResources[resourceType];
    }
    if (!resourceObj && upgrade.name) {
      resourceObj = simulatedResources.find(r => r.name === upgrade.name);
    }
    if (!resourceObj) resourceObj = simulatedResources[0];
    return resourceObj && resourceObj.value >= cost;
  }
  // Array of numbers (assume x3 is the index)
  if (Array.isArray(simulatedResources)) {
    if (resourceType !== undefined && simulatedResources[resourceType] !== undefined) {
      return simulatedResources[resourceType] >= cost;
    }
    // fallback: just use first resource
    return simulatedResources[0] >= cost;
  }
  // Object (resourceNames or keys)
  if (typeof simulatedResources === 'object' && simulatedResources !== null) {
    let key = null;
    if (resourceNames && resourceType !== undefined && resourceNames[resourceType] !== undefined) {
      key = resourceNames[resourceType];
    } else if (upgrade.name && simulatedResources[upgrade.name] !== undefined) {
      key = upgrade.name;
    }
    if (key) {
      return (simulatedResources[key] ?? 0) >= cost;
    }
    // fallback: check all keys, pass if any is sufficient
    return Object.values(simulatedResources).some(val => val >= cost);
  }
  // Single number
  if (typeof simulatedResources === 'number') {
    return simulatedResources >= cost;
  }
  // Unknown shape, be safe
  return false;
}

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
  // Extract onlyAffordable from extraArgs, defaulting to false
  const { onlyAffordable = false } = extraArgs;
  // Deep clone upgrades and resources to avoid mutating input data
  let simulatedUpgrades = JSON.parse(JSON.stringify(getUpgrades(account)));
  let simulatedResources = JSON.parse(JSON.stringify(getResources(account)));

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

  // Refactored 'all' category: simulate sequential cheapest upgrades
  if (category === 'all') {
    for (let step = 0; step < maxUpgrades; step++) {
      // Find all available upgrades (unlocked, not maxed, affordable if needed)
      const availableUpgrades = simulatedUpgrades.filter(upgrade => {
        if (upgrade.level >= upgrade.x4) return false;
        if (!upgrade.unlocked) return false;
        if (onlyAffordable && !isUpgradeAffordable(upgrade, upgrade.cost, simulatedResources, resourceNames)) return false;
        return true;
      });
      if (availableUpgrades.length === 0) break;

      // Find the cheapest upgrade, taking resourcePerHour into account if provided
      let cheapestUpgrade = availableUpgrades[0];
      let minEffectiveCost = Infinity;
      for (const u of availableUpgrades) {
        let effectiveCost = u.cost;
        if (extraArgs.resourcePerHour) {
          // Determine resource type key
          let resourceTypeKey = (extraArgs.getResourceType
            ? extraArgs.getResourceType(u)
            : (u.x3 !== undefined ? u.x3 : (u.name || 0)));
          let rph = 1;
          if (extraArgs.resourcePerHour && resourceTypeKey !== undefined) {
            if (extraArgs.resourcePerHour[resourceTypeKey] !== undefined && extraArgs.resourcePerHour[resourceTypeKey] > 0) {
              rph = extraArgs.resourcePerHour[resourceTypeKey];
            }
          }
          effectiveCost = u.cost / rph;
        }
        if (effectiveCost < minEffectiveCost) {
          minEffectiveCost = effectiveCost;
          cheapestUpgrade = u;
        }
      }

      // Apply the upgrade
      const idx = simulatedUpgrades.findIndex(u => u.index === cheapestUpgrade.index);
      simulatedUpgrades[idx] = { ...simulatedUpgrades[idx], level: simulatedUpgrades[idx].level + 1 };

      // Optionally update resources
      if (updateResourcesAfterUpgrade && resourceNames) {
        let tempResources = JSON.parse(JSON.stringify(simulatedResources));
        updateResourcesAfterUpgrade(tempResources, cheapestUpgrade, resourceNames, cheapestUpgrade.cost);
        simulatedResources = tempResources;
      }

      // Recalculate cost for all upgrades after this purchase
      simulatedUpgrades = simulatedUpgrades.map((upgrade, index) => {
        const cost = getUpgradeCost(upgrade, index, { account, upgrades: simulatedUpgrades, ...extraArgs });
        return { ...upgrade, cost };
      });

      // Add to results
      results.push({
        ...cheapestUpgrade,
        level: cheapestUpgrade.level + 1,
        cost: cheapestUpgrade.cost
      });
    }
    return results;
  }

  for (let step = 0; step < maxUpgrades; step++) {
    let bestUpgrade = null;
    let bestEfficiency = 0;
    let bestStatChanges = null;
    let bestTotalChange = 0;
    let bestNewStats = null;
    let bestNewDustMultiplier = 0;
    let bestTempUpgrades = null;
    let bestTempResources = null;

    // Find available upgrades for this category
    const availableUpgrades = simulatedUpgrades.filter(upgrade => {
      if (!categoryInfo.upgradeIndices.includes(upgrade.index)) return false;
      if (upgrade.level >= upgrade.x4) return false;
      if (!upgrade.unlocked) return false; // Only unlocked upgrades
      // If onlyAffordable is true, check if upgrade is affordable with current simulatedResources
      if (onlyAffordable) {
        const cost = getUpgradeCost(upgrade, upgrade.index, {
          account,
          upgrades: simulatedUpgrades,
          resources: simulatedResources, ...extraArgs
        });
        if (!isUpgradeAffordable(upgrade, cost, simulatedResources, resourceNames)) return false;
      }
      return true;
    });

    for (const upgrade of availableUpgrades) {
      // Deep clone upgrades for simulation
      const tempUpgrades = JSON.parse(JSON.stringify(simulatedUpgrades));
      // Apply upgrade by creating a new object
      const idx = tempUpgrades.findIndex(u => u.index === upgrade.index);
      tempUpgrades[idx] = { ...tempUpgrades[idx], level: tempUpgrades[idx].level + 1 };
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
          const percentChange = currentDustMultiplier > 0
            ? ((newDustMultiplier - currentDustMultiplier) / currentDustMultiplier) * 100
            : 0;
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
      let efficiency;
      if (extraArgs.resourcePerHour) {
        // Use getResourceType if provided for resource type key
        let resourceTypeKey = (extraArgs.getResourceType
          ? extraArgs.getResourceType(upgrade)
          : (upgrade.x3 !== undefined ? upgrade.x3 : (upgrade.name || 0)));
        let rph = 1;
        if (extraArgs.resourcePerHour && resourceTypeKey !== undefined) {
          if (extraArgs.resourcePerHour[resourceTypeKey] !== undefined && extraArgs.resourcePerHour[resourceTypeKey] > 0) {
            rph = extraArgs.resourcePerHour[resourceTypeKey];
          }
        }
        const timeCost = cost / rph;
        efficiency = totalStatChange / timeCost;
      } else {
        efficiency = totalStatChange / cost;
      }

      if (efficiency > bestEfficiency) {
        bestUpgrade = upgrade;
        bestEfficiency = efficiency;
        bestStatChanges = statChanges;
        bestTotalChange = totalStatChange;
        bestNewStats = newStats;
        bestNewDustMultiplier = newDustMultiplier;
        bestTempUpgrades = tempUpgrades;
      }
    }

    if (bestUpgrade && bestEfficiency > 0) {
      // Create a snapshot for the result
      const upgradeSnapshot = { ...bestUpgrade, level: bestUpgrade.level + 1 };
      const cost = getUpgradeCost(bestUpgrade, bestUpgrade.index, {
        account,
        upgrades: simulatedUpgrades, ...extraArgs
      });
      results.push({
        ...upgradeSnapshot,
        efficiency: bestEfficiency,
        statChanges: bestStatChanges,
        totalStatChange: bestTotalChange,
        cost
      });

      // Use the bestTempUpgrades as the new simulatedUpgrades (no mutation)
      simulatedUpgrades = bestTempUpgrades;

      // Optionally update resources (deep clone before passing)
      if (updateResourcesAfterUpgrade && resourceNames) {
        let tempResources = JSON.parse(JSON.stringify(simulatedResources));
        updateResourcesAfterUpgrade(tempResources, bestUpgrade, resourceNames, cost);
        simulatedResources = tempResources;
      }

      // Update current stats for next iteration
      currentStats = bestNewStats;
      if (category === 'dust' && typeof getExtraDust === 'function') {
        currentDustMultiplier = bestNewDustMultiplier;
      }

      // Recalculate all upgrade costs after this purchase (no mutation)
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