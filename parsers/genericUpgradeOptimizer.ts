// Generic Upgrade Optimizer
// Consolidates the simulation logic for Compass, Grimoire, and Tesseract optimizers

function isUpgradeAffordable(upgrade: any, cost: any, simulatedResources: any, resourceNames: any, resourceType: any) {
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
    }
    else if (upgrade.name && simulatedResources[upgrade.name] !== undefined) {
      key = upgrade.name;
    }
    if (key) {
      return (simulatedResources[key] ?? 0) >= cost;
    }
    // fallback: check all keys, pass if any is sufficient
    return Object.values(simulatedResources).some((val: any) => val >= cost);
  }
  // Single number
  if (typeof simulatedResources === 'number') {
    return simulatedResources >= cost;
  }
  // Unknown shape, be safe
  return false;
}

// Several masterclass upgrades (Singulon Hoarding and friends) scale with the amount of resource
// you're currently holding, so spending lowers them. heldResourceOptionBase is the accountOptions
// index of the first resource color, letting the simulation deplete the held amounts as it buys.
function buildSimulatedAccount(account: any, spentByResource: any, heldResourceOptionBase: any) {
  if (heldResourceOptionBase === undefined || heldResourceOptionBase === null) return account;
  const entries = Object.entries(spentByResource).filter(([, spent]: any) => spent > 0);
  if (entries.length === 0) return account;
  const accountOptions = [...(account?.accountOptions || [])];
  entries.forEach(([resourceKey, spent]: any) => {
    const optionIndex = heldResourceOptionBase + Number(resourceKey);
    if (!Number.isFinite(optionIndex)) return;
    accountOptions[optionIndex] = Math.max(0, (account?.accountOptions?.[optionIndex] ?? 0) - spent);
  });
  return { ...account, accountOptions };
}

function addSpending(spentByResource: any, resourceKey: any, cost: any) {
  return { ...spentByResource, [resourceKey]: (spentByResource[resourceKey] ?? 0) + cost };
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
                                              updateResourcesAfterUpgrade,
                                              resourceNames,
                                              heldResourceOptionBase,
                                              getUnlockedIndices,
                                              extraArgs = {}
                                            }: any) {
  // Extract onlyAffordable from extraArgs, defaulting to false
  const { onlyAffordable = false, masterClassReduction = 0 } = extraArgs;
  let reductionsRemaining = masterClassReduction;
  // Which resource color an upgrade is paid with. Every UI wrapper supplies getResourceType;
  // the x3/boneType save fields cover direct parser calls that don't.
  const resourceTypeOf = (upgrade: any) => {
    if (extraArgs?.getResourceType) return extraArgs.getResourceType(upgrade);
    if (upgrade?.x3 !== undefined) return upgrade.x3;
    if (upgrade?.boneType !== undefined) return upgrade.boneType;
    return upgrade?.name || 0;
  };
  // Effective resource-per-hour for an upgrade's color; 1 when RPH mode is off or has no entry,
  // so dividing by it is a no-op.
  const resourcePerHourOf = (upgrade: any) => {
    const rph = extraArgs.resourcePerHour?.[resourceTypeOf(upgrade)];
    return rph > 0 ? rph : 1;
  };
  // RPH mode skips colors the player earns none of per hour.
  const isResourceEarnable = (upgrade: any) => (!extraArgs.resourcePerHour
    || extraArgs.resourcePerHour[resourceTypeOf(upgrade)] !== 0);
  // Deep clone upgrades and resources to avoid mutating input data
  let simulatedUpgrades = JSON.parse(JSON.stringify(getUpgrades(account)));
  let simulatedResources = JSON.parse(JSON.stringify(getResources(account)));

  // Unlock gates are driven by levels bought (total levels in the tree for Grimoire/Tesseract, the
  // path's root upgrade for Compass), so buying anything can bring new upgrades in range mid-walk.
  // getUnlockedIndices is re-run every step; without it we fall back to the static `unlocked` flag.
  const resolveUnlocked = (upgrades: any) => (getUnlockedIndices
    ? getUnlockedIndices(upgrades, { account, extraArgs })
    : null);
  let unlockedIndices = resolveUnlocked(simulatedUpgrades);
  const isUpgradeUnlocked = (upgrade: any) => (unlockedIndices
    ? unlockedIndices.has(upgrade.index)
    : !!upgrade.unlocked);
  // Locked right now in game, so the UI can mark the row instead of reading as "buy this today"
  const initiallyLocked = new Set<any>(simulatedUpgrades
    .filter((upgrade: any) => !isUpgradeUnlocked(upgrade))
    .map((upgrade: any) => upgrade.index));
  // index -> number of purchases that had to happen first before it came in range
  const unlockStep: any = {};
  const trackUnlocks = (step: number) => {
    if (initiallyLocked.size === 0) return;
    simulatedUpgrades.forEach((upgrade: any) => {
      if (!initiallyLocked.has(upgrade.index)) return;
      if (unlockStep[upgrade.index] !== undefined) return;
      if (isUpgradeUnlocked(upgrade)) unlockStep[upgrade.index] = step;
    });
  };
  const unlockInfo = (upgrade: any) => (initiallyLocked.has(upgrade.index)
    ? { lockedNow: true, unlocksAfterStep: unlockStep[upgrade.index] ?? null }
    : { lockedNow: false, unlocksAfterStep: null });

  // Resource spent so far in the simulation, per resource type. Feeds the held-resource bonuses.
  let spentByResource: any = {};
  let simAccount = account;

  // Track current stats for comparison
  let currentStats = getCurrentStats(simulatedUpgrades, character, simAccount, extraArgs);

  // The dust/tachyon multiplier itself scales with the upgrade tree being simulated, so every
  // read grafts the candidate levels onto the account it's asked about. null = the category has
  // no such multiplier. The result stat is renamed so the UI can tell it from the raw resource.
  const resourceMultiplierStat = category === 'dust' ? 'extraDust' : category === 'tachyons' ? 'extraTachyon' : null;
  const getResourceMultiplier = (acct: any, upgrades: any) => {
    if (category === 'dust' && typeof extraArgs.getExtraDust === 'function') {
      return extraArgs.getExtraDust(character, { ...acct, compass: { ...acct.compass, upgrades } }).value;
    }
    if (category === 'tachyons' && typeof extraArgs.getExtraTachyon === 'function') {
      return extraArgs.getExtraTachyon(character, { ...acct, tesseract: { ...acct.tesseract, upgrades } }).value;
    }
    return null;
  };
  let currentResourceMultiplier = getResourceMultiplier(simAccount, simulatedUpgrades);

  const results: any = [];
  // Why the walk stopped, so the UI can tell "nothing left to buy" apart from "holding beats buying"
  let stoppedReason = null;

  // Refactored 'all' category: simulate sequential cheapest upgrades
  if (category === 'all') {
    for (let step = 0; step < maxUpgrades; step++) {
      unlockedIndices = resolveUnlocked(simulatedUpgrades);
      trackUnlocks(step);
      // Find all available upgrades (unlocked, not maxed, affordable if needed)
      const availableUpgrades = simulatedUpgrades.filter((upgrade: any) => {
        if (upgrade.level >= upgrade.x4) return false;
        if (!isUpgradeUnlocked(upgrade)) return false;
        if (onlyAffordable) {
          const cost = getUpgradeCost(upgrade, upgrade.index, {
            account: simAccount,
            upgrades: simulatedUpgrades,
            ...extraArgs,
            forceLegendTalent: reductionsRemaining > 0
          });
          if (!isUpgradeAffordable(upgrade, cost, simulatedResources, resourceNames, resourceTypeOf(upgrade))) return false;
        }
        return isResourceEarnable(upgrade);
      });
      if (availableUpgrades.length === 0) {
        stoppedReason = 'no-candidates';
        break;
      }

      // Find the cheapest upgrade, taking resourcePerHour into account if provided
      let cheapestUpgrade = availableUpgrades[0];
      let minEffectiveCost = Infinity;
      for (const u of availableUpgrades) {
        let effectiveCost = getUpgradeCost(u, u.index, {
          account: simAccount,
          upgrades: simulatedUpgrades,
          ...extraArgs,
          forceLegendTalent: reductionsRemaining > 0
        });

        effectiveCost = effectiveCost / resourcePerHourOf(u);
        if (effectiveCost < minEffectiveCost) {
          minEffectiveCost = effectiveCost;
          cheapestUpgrade = u;
        }
      }

      // Get the actual cost BEFORE level increment
      const actualCost = getUpgradeCost(cheapestUpgrade, cheapestUpgrade.index, {
        account: simAccount,
        upgrades: simulatedUpgrades,
        ...extraArgs,
        forceLegendTalent: reductionsRemaining > 0
      });

      // Apply the upgrade
      const idx = simulatedUpgrades.findIndex((u: any) => u.index === cheapestUpgrade.index);
      simulatedUpgrades[idx] = { ...simulatedUpgrades[idx], level: simulatedUpgrades[idx].level + 1 };

      // Optionally update resources
      if (updateResourcesAfterUpgrade && resourceNames) {
        let tempResources = JSON.parse(JSON.stringify(simulatedResources));
        updateResourcesAfterUpgrade(tempResources, cheapestUpgrade, resourceNames, actualCost);
        simulatedResources = tempResources;
      }

      // Deplete the held resource so hoarding-based bonuses (and costs) reflect the purchase
      spentByResource = addSpending(spentByResource, resourceTypeOf(cheapestUpgrade), actualCost);
      simAccount = buildSimulatedAccount(account, spentByResource, heldResourceOptionBase);

      // Recalculate cost for all upgrades after this purchase
      simulatedUpgrades = simulatedUpgrades.map((upgrade: any) => {
        const cost = getUpgradeCost(upgrade, upgrade.index, {
          account: simAccount,
          upgrades: simulatedUpgrades,
          ...extraArgs
        });
        return { ...upgrade, cost };
      });

      // Add to results
      results.push({
        ...cheapestUpgrade,
        ...unlockInfo(cheapestUpgrade),
        level: cheapestUpgrade.level + 1,
        cost: actualCost,
        hadReduction: reductionsRemaining > 0
      });
      reductionsRemaining = Math.max(0, reductionsRemaining - 1);
    }

    results.stoppedReason = stoppedReason;
    return results;
  }

  for (let step = 0; step < maxUpgrades; step++) {
    unlockedIndices = resolveUnlocked(simulatedUpgrades);
    trackUnlocks(step);
    let bestUpgrade = null;
    let bestEfficiency = 0;
    let bestStatChanges = null;
    let bestTotalChange = 0;
    let bestNewStats = null;
    let bestNewResourceMultiplier: any = null;
    let bestTempUpgrades = null;
    let bestCost = 0;
    let leastBadCandidate: any = null;

    // Find available upgrades for this category
    const availableUpgrades = simulatedUpgrades.filter((upgrade: any) => {
      if (!categoryInfo.upgradeIndices.includes(upgrade.index)) return false;
      if (upgrade.level >= upgrade.x4) return false;
      if (!isUpgradeUnlocked(upgrade)) return false; // Only unlocked upgrades
      // If onlyAffordable is true, check if upgrade is affordable with current simulatedResources
      if (onlyAffordable) {
        const cost = getUpgradeCost(upgrade, upgrade.index, {
          account: simAccount,
          upgrades: simulatedUpgrades,
          ...extraArgs,
          forceLegendTalent: reductionsRemaining > 0
        });
        if (!isUpgradeAffordable(upgrade, cost, simulatedResources, resourceNames, resourceTypeOf(upgrade))) return false;
      }
      return isResourceEarnable(upgrade);
    });

    for (const upgrade of availableUpgrades) {
      // Deep clone upgrades for simulation
      const tempUpgrades = JSON.parse(JSON.stringify(simulatedUpgrades));
      // Apply upgrade by creating a new object
      const idx = tempUpgrades.findIndex((u: any) => u.index === upgrade.index);
      tempUpgrades[idx] = { ...tempUpgrades[idx], level: tempUpgrades[idx].level + 1 };

      // Paying for the upgrade lowers the held resource, which lowers the hoarding bonuses,
      // so the stats after the purchase have to be read from a depleted account
      const upgradeCostForStats = getUpgradeCost(upgrade, upgrade.index, {
        account: simAccount,
        upgrades: simulatedUpgrades,
        ...extraArgs,
        forceLegendTalent: reductionsRemaining > 0
      });
      const candidateAccount = buildSimulatedAccount(
        account,
        addSpending(spentByResource, resourceTypeOf(upgrade), upgradeCostForStats),
        heldResourceOptionBase
      );
      const newStats = getCurrentStats(tempUpgrades, character, candidateAccount, extraArgs);
      const newResourceMultiplier = getResourceMultiplier(candidateAccount, tempUpgrades);

      // Calculate stat changes
      const statChanges = categoryInfo.stats.map((stat: any) => {
        if (stat === category && newResourceMultiplier !== null) {
          const change = newResourceMultiplier - currentResourceMultiplier;
          return {
            stat: resourceMultiplierStat,
            change,
            percentChange: currentResourceMultiplier > 0 ? (change / currentResourceMultiplier) * 100 : 0
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

      // Calculate total efficiency with master class reduction
      const totalStatChange = statChanges.reduce((sum: any, change: any) => sum + change.percentChange, 0);
      const cost = upgradeCostForStats;
      const efficiency = totalStatChange / (cost / resourcePerHourOf(upgrade));

      if (efficiency > bestEfficiency) {
        bestUpgrade = upgrade;
        bestEfficiency = efficiency;
        bestStatChanges = statChanges;
        bestTotalChange = totalStatChange;
        bestNewStats = newStats;
        bestNewResourceMultiplier = newResourceMultiplier;
        bestTempUpgrades = tempUpgrades;
        bestCost = cost;
      }
      if (!leastBadCandidate || totalStatChange > leastBadCandidate.totalStatChange) {
        leastBadCandidate = { tempUpgrades, totalStatChange };
      }
    }

    if (bestUpgrade && bestEfficiency > 0) {
      // Create a snapshot for the result
      const upgradeSnapshot = { ...bestUpgrade, level: bestUpgrade.level + 1 };
      const cost = bestCost;

      // The same purchase measured against an untouched stash. The gap between gross and net is
      // the bonus given up by spending down hoarding-scaled upgrades.
      const tracksHeldResource = heldResourceOptionBase !== undefined && heldResourceOptionBase !== null;
      const grossStats = tracksHeldResource
        ? getCurrentStats(bestTempUpgrades, character, simAccount, extraArgs)
        : bestNewStats;
      const grossResourceMultiplier = tracksHeldResource
        ? getResourceMultiplier(simAccount, bestTempUpgrades)
        : bestNewResourceMultiplier;

      const statChangesWithHoarding = (bestStatChanges as any[]).map((statChange: any) => {
        let grossValue;
        let currentValue;
        if (statChange.stat === resourceMultiplierStat) {
          grossValue = grossResourceMultiplier;
          currentValue = currentResourceMultiplier;
        }
        else {
          grossValue = grossStats[statChange.stat] || 0;
          currentValue = currentStats[statChange.stat] || 0;
        }
        const grossChange = grossValue - currentValue;
        const grossPercentChange = currentValue > 0 ? (grossChange / currentValue) * 100 : 0;
        return {
          ...statChange,
          grossChange,
          grossPercentChange,
          hoardingChange: grossChange - statChange.change,
          hoardingPercentChange: grossPercentChange - statChange.percentChange
        };
      });
      const totalHoardingChange = statChangesWithHoarding.reduce((sum: number, change: any) => sum + change.hoardingPercentChange, 0);

      results.push({
        ...upgradeSnapshot,
        ...unlockInfo(bestUpgrade),
        efficiency: bestEfficiency,
        statChanges: statChangesWithHoarding,
        totalStatChange: bestTotalChange,
        totalHoardingChange,
        cost,
        hadReduction: reductionsRemaining > 0
      });
      reductionsRemaining = Math.max(0, reductionsRemaining - 1);

      // Use the bestTempUpgrades as the new simulatedUpgrades (no mutation)
      simulatedUpgrades = bestTempUpgrades;

      // Optionally update resources (deep clone before passing)
      if (updateResourcesAfterUpgrade && resourceNames) {
        let tempResources = JSON.parse(JSON.stringify(simulatedResources));
        updateResourcesAfterUpgrade(tempResources, bestUpgrade, resourceNames, cost);
        simulatedResources = tempResources;
      }

      // Deplete the held resource so hoarding-based bonuses reflect the purchase
      spentByResource = addSpending(spentByResource, resourceTypeOf(bestUpgrade), cost);
      simAccount = buildSimulatedAccount(account, spentByResource, heldResourceOptionBase);

      // Update current stats for next iteration
      currentStats = bestNewStats;
      currentResourceMultiplier = bestNewResourceMultiplier;

      // Recalculate all upgrade costs after this purchase (no mutation)
      simulatedUpgrades = simulatedUpgrades.map((upgrade: any) => {
        const cost = getUpgradeCost(upgrade, upgrade.index, {
          account: simAccount,
          upgrades: simulatedUpgrades,
          ...extraArgs
        });
        return { ...upgrade, cost };
      });
    }
    else {
      // Nothing worth buying. Separate "there is nothing left" from "buying would cost more
      // hoarding bonus than it gains", which is a hold signal rather than a dead end.
      const tracksHeld = heldResourceOptionBase !== undefined && heldResourceOptionBase !== null;
      if (availableUpgrades.length === 0) {
        stoppedReason = 'no-candidates';
      }
      else if (tracksHeld && leastBadCandidate) {
        const grossStats = getCurrentStats(leastBadCandidate.tempUpgrades, character, simAccount, extraArgs);
        const grossResourceMultiplier = getResourceMultiplier(simAccount, leastBadCandidate.tempUpgrades);
        const grossTotal = categoryInfo.stats.reduce((sum: number, stat: any) => {
          let currentValue;
          let grossValue;
          if (stat === category && grossResourceMultiplier !== null) {
            currentValue = currentResourceMultiplier;
            grossValue = grossResourceMultiplier;
          }
          else {
            currentValue = currentStats[stat] || 0;
            grossValue = grossStats[stat] || 0;
          }
          return sum + (currentValue > 0 ? ((grossValue - currentValue) / currentValue) * 100 : 0);
        }, 0);
        // the upgrade would help on its own, so the held-resource loss is what sank it
        stoppedReason = grossTotal > 0 ? 'hoarding' : 'no-gain';
      }
      else {
        stoppedReason = 'no-gain';
      }
      break;
    }
  }

  results.stoppedReason = stoppedReason;
  return results;
}