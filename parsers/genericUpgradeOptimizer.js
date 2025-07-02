// Generic Upgrade Optimizer
// Consolidates the simulation logic for Compass, Grimoire, and Tesseract optimizers

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
        if (onlyAffordable && (upgrade.cost > simulatedResources[upgrade.x3]?.value)) return false;
        return true;
      });
      console.log('availableUpgrades', availableUpgrades)
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
        if (Array.isArray(simulatedResources)) {
          // If array of objects with value property (e.g., [{ value, name }]), match resource type
          if (simulatedResources.length > 0 && typeof simulatedResources[0] === 'object' && simulatedResources[0] !== null && 'value' in simulatedResources[0]) {
            // Try to match by resource name or index
            let resourceObj = null;
            if (upgrade.x3 !== undefined) {
              // Try to match by x3 (resource type index)
              resourceObj = simulatedResources[upgrade.x3];
            }
            if (!resourceObj && upgrade.name) {
              // Try to match by name
              resourceObj = simulatedResources.find(r => r.name === upgrade.name);
            }
            // Fallback: just use first resource
            if (!resourceObj) resourceObj = simulatedResources[0];
            if (!resourceObj || resourceObj.value < cost) return false;
          } else {
            // If array of numbers
            if (simulatedResources.some(r => r < cost)) return false;
          }
        } else if (typeof simulatedResources === 'object' && simulatedResources !== null) {
          // If object, check all resourceNames (if provided) or all keys
          const keys = resourceNames ? Object.values(resourceNames) : Object.keys(simulatedResources);
          for (const key of keys) {
            if ((simulatedResources[key] ?? 0) < cost) return false;
          }
        } else {
          // If number
          if (simulatedResources < cost) return false;
        }
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