import { commaNotation, notateNumber, tryToParse, lavaLog } from '@utility/helpers';
import { upgradeVault } from '@website-data';
import { isBundlePurchased, getEventShopBonus, isCompanionBonusActive } from '@parsers/misc';
import { getResearchGridBonus } from '@parsers/world-7/research';
import { getSushiBonus } from '@parsers/world-7/sushiStation';

export const getUpgradeVault = (idleonData: any, accountData: any, charactersData: any[]) => {
  const upgradeVaultRaw = idleonData?.UpgVault || tryToParse(idleonData?.UpgVault);
  return parseUpgradeVault(upgradeVaultRaw, accountData, charactersData);
}

export const parseUpgradeVault = (upgradeVaultRaw: any, accountData: any, charactersData: any) => {
  const totalUpgradeLevels = upgradeVaultRaw?.reduce((sum: any, level: any) => sum + level, 0);
  const vaultTotalKills = getVaultTotalKills({ characters: charactersData, account: accountData });
  const descriptionContext = {
    vaultKills: vaultTotalKills,
    cardsCollected: Object.values(accountData?.cards || {}).filter((card: any) => card?.amount > 0).length,
    oresMined: accountData?.accountOptions?.[340] ?? 0,
    fishCaught: accountData?.accountOptions?.[345] ?? 0,
    bugsCaught: accountData?.accountOptions?.[346] ?? 0,
    knockoutProgress: accountData?.accountOptions?.[338] ?? 0
  };
  let upgrades = upgradeVault.map((upgrade, index) => {
    return {
      ...upgrade,
      level: upgradeVaultRaw?.[index],
      maxLevel: getVaultUpgMaxLevel(index, upgrade?.maxLevel, accountData),
      unlocked: totalUpgradeLevels >= upgrade?.unlockLevel
    }
  })
  upgrades = upgrades.map((upgrade, index) => {
    const bonus = calcUpgradeVaultBonus(upgrades, index);
    const description = resolveVaultDescription(upgrade?.description, index, bonus, descriptionContext);
    return {
      ...upgrade,
      cost: getUpgradeCost(upgrades, index, accountData),
      costToMax: getCostToMax(upgrades, index, accountData),
      bonus,
      description
    }
  })
  // The "Next upgrade" tooltip always previews a level-0 (unpurchased) upgrade, so every
  // computed value would be 0. Strip the placeholders instead to show a bare "+%" teaser.
  const nextUnlockIndex = upgrades?.findIndex(({ unlocked }: any) => !unlocked) ?? -1;
  const nextUnlock = nextUnlockIndex >= 0
    ? { ...upgrades[nextUnlockIndex], description: (upgradeVault[nextUnlockIndex]?.description as string)?.replace(/[{}$^~&]/g, '') }
    : undefined;

  return {
    upgrades,
    totalUpgradeLevels,
    nextUnlock,
    vaultTotalKills,
    costReduction: getVaultCostReduction(accountData)
  };
}

// The "All Vault upgrades are N.NNx Cheaper!" headline factor. Mirrors the common
// multiplier applied to every upgrade in getUpgradeCost (darts x companion99 x sushi).
// The idx<33-only vault-13 factor is deliberately excluded so this matches the game text.
export const getVaultCostReduction = (accountData: any) => {
  const dartsBonusReduction = 1 / (1 + (accountData?.accountOptions?.[437] || 0) / 100);
  const companionBonus99 = isCompanionBonusActive(accountData, 99) ? accountData?.companions?.list?.at(99)?.bonus : 0;
  const companionMulti = Math.max(0.1, 1 - companionBonus99 / 100);
  const sushiDiscount = Math.max(0.1, 1 - Math.max(getSushiBonus(accountData, 38), getSushiBonus(accountData, 47)) / 100);
  const totalMulti = dartsBonusReduction * companionMulti * sushiDiscount; // < 1 means cheaper
  const cheaperFactor = totalMulti > 0 ? 1 / totalMulti : 1; // the "N.NNx" number shown in-game

  // Per-source "cheaper" contribution = reciprocal of that source's cost multiplier.
  const sources = [
    { name: 'Darts', value: 1 / dartsBonusReduction },
    { name: 'Companion (Sushi Roll)', value: companionMulti > 0 ? 1 / companionMulti : 1 },
    { name: 'Sushi Station', value: sushiDiscount > 0 ? 1 / sushiDiscount : 1 }
  ];

  return {
    totalMulti,
    cheaperFactor,
    breakdown: {
      statName: 'Vault cost reduction',
      totalValue: notateNumber(cheaperFactor, 'MultiplierInfo'),
      categories: [{ name: 'Multiplicative', sources }]
    }
  };
}

/**
 * Resolves the placeholders in an upgrade vault description, mirroring the game's
 * display logic (N.js): `{`/`}` are the upgrade's own bonus, `^` and `$` are the
 * "Total Bonus" values that depend on per-upgrade game stats (kills, ores, cards, ...).
 */
const resolveVaultDescription = (description: any, index: number, bonus: number, ctx: any): any => {
  if (!description) return description;
  let resolved = (description as string)
    .replace('{', '' + commaNotation(bonus))
    .replace('}', '' + notateNumber(1 + bonus / 100, 'MultiplierInfo'))
    .replace('^', '' + commaNotation(bonus * lavaLog(ctx.oresMined)));
  const dollar = getVaultDollarValue(index, bonus, ctx);
  if (dollar != null) {
    resolved = resolved.replace('$', dollar);
  }
  // Monster Tax (2) ends with a "Total Coin Bonus from@all@sources;~x" clause whose `~`
  // (MonsterCash total) we don't compute — drop the dangling clause rather than show it raw.
  if (index === 2) {
    resolved = resolved.split('_Total_Coin_Bonus')[0];
  }
  return resolved.replace('.00', '');
}

/**
 * The `$` "Total Bonus" value for upgrades that have one. Index-specific, matching N.js.
 * Returns null for upgrades without a `$` placeholder (or whose `$` formula isn't replicated).
 */
const getVaultDollarValue = (index: number, bonus: number, ctx: any): string | null => {
  const { vaultKills, cardsCollected, fishCaught, bugsCaught, knockoutProgress } = ctx;
  // Indices whose `$` shows "Current Kills + Total Bonus", keyed to their VaultKillzTOT slots.
  const killsByIndex: Record<number, number> = { 14: 0, 20: 1, 27: 2, 31: 3 };

  const formatKills = (rawKills: number, logBonusSlot: number, totalLabel = '\nTotal_Bonus:+') => {
    const totalBonus = Math.round(bonus * (vaultKills?.[logBonusSlot] ?? 0));
    return rawKills < 1e8
      ? `Current_Kills:${commaNotation(rawKills)}\nTotal_Bonus:+${totalBonus}`
      : `Current_Kills:${commaNotation(rawKills / 1e6)}million${totalLabel}${totalBonus}`;
  };

  if (index in killsByIndex) {
    const slot = killsByIndex[index];
    return formatKills(vaultKills?.[slot] ?? 0, 4 + slot);
  }
  switch (index) {
    case 13:
      return '' + Math.round(1e4 * (1 - 1 / (1 + bonus / 100))) / 100;
    case 15:
      return '' + Math.round(knockoutProgress * bonus);
    case 34:
      return '' + Math.round((vaultKills?.[8] ?? 0) * bonus);
    case 35:
      return '' + commaNotation(bonus * lavaLog(fishCaught));
    case 37:
      return '' + commaNotation((vaultKills?.[9] ?? 0) * bonus);
    case 41:
      return '' + commaNotation(bonus * lavaLog(bugsCaught));
    case 48:
      return formatKills(vaultKills?.[10] ?? 0, 11, '\nTotal:+');
    case 70:
      return '' + commaNotation(bonus * cardsCollected);
    default:
      return null;
  }
}


const getVaultUpgMaxLevel = (index: any, baseMaxLevel: any, accountData: any) => {
  const base = Number(baseMaxLevel) || 0;
  const bundlePurchased = isBundlePurchased(accountData?.bundles, 'bon_u') ? 1 : 0;
  const bundleBonus = Math.max(0, Math.min(10, 10 * bundlePurchased));

  const glimboEntry = accountData?.minehead?.glimbo?.find((g: any) => g.vaultIdx === index);
  if (glimboEntry) {
    const trades = glimboEntry.trades;
    if (glimboEntry.flag) {
      const grid169Level = getResearchGridBonus(accountData, 169, 1);
      const eventShop40 = getEventShopBonus(accountData, 40);
      return base + bundleBonus + Math.round((1 + grid169Level + eventShop40) * trades);
    }
    return base + bundleBonus + trades;
  }

  if (base >= 2) {
    return base + bundleBonus;
  }
  return base;
}

const getCostToMax = (upgrades: any, index: any, accountData: any) => {
  const localUpgrades = structuredClone(upgrades);
  const { level, maxLevel } = localUpgrades?.[index];
  let costToMax = 0;
  for (let i = level; i < maxLevel; i++) {
    localUpgrades[index].level = i;
    costToMax += getUpgradeCost(localUpgrades, index, accountData)
  }
  return costToMax ?? 0;
}

const getUpgradeCost = (upgrades: any, index: any, accountData: any) => {
  const { level, x1, x2 } = upgrades?.[index];
  const baseCost = level + (x1 + level) * Math.pow(x2, level);
  const dartsBonusReduction = 1 / (1 + (accountData?.accountOptions?.[437] || 0) / 100);
  const companionBonus99 = isCompanionBonusActive(accountData, 99) ? accountData?.companions?.list?.at(99)?.bonus : 0;
  const companionMulti = Math.max(0.1, 1 - companionBonus99 / 100);
  const sushiDiscount = Math.max(0.1, 1 - Math.max(getSushiBonus(accountData, 38), getSushiBonus(accountData, 47)) / 100);

  return 33 > index
    ? Math.max(0.001, (1 / (1 + calcUpgradeVaultBonus(upgrades, 13) / 100)) * dartsBonusReduction) * companionMulti * sushiDiscount * baseCost
    : Math.max(0.01, dartsBonusReduction) * companionMulti * sushiDiscount * Math.pow(1.1, Math.max(0, index - 61)) * baseCost;
}

export const getUpgradeVaultBonus = (upgrades: any, index: any) => {
  return upgrades?.[index]?.bonus || 0;
}

const calcUpgradeVaultBonus = (upgrades: any, index: any): any => {
  const { level, x5 } = upgrades?.[index] ?? {};
  const higherBonuses = upgrades?.[60];
  const isSimple = 32 === index || 1 === index || 6 === index
    || 7 === index || 8 === index || 9 === index
    || 13 === index || 999 === index
    || 33 === index || 36 === index || 40 === index
    || 42 === index || 43 === index || 44 === index
    || 49 === index || 51 === index || 52 === index
    || 53 === index || 57 === index || 61 === index
    || 89 === index || 64 === index || 70 === index
    || 73 === index || 74 === index || 76 === index
    || 79 === index || 85 === index || 86 === index
    || 88 === index;

  return isSimple
    ? level * x5
    : 0 === index
      ? (level
        * x5
        + (Math.max(0, level - 25)
          + (Math.max(0, level - 50)
            + Math.max(0, level - 100))))
      * (1 + calcUpgradeVaultBonus(upgrades, 32) / 100)
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
        * (1 + calcUpgradeVaultBonus(upgrades, 61) / 100)
        : 32 > index
          ? level * x5 * (1 + calcUpgradeVaultBonus(upgrades, 32) / 100)
          : 61 > index
            ? level * x5 * (1 + calcUpgradeVaultBonus(upgrades, 61) / 100)
            : 89 > index
              ? level * x5 * (1 + calcUpgradeVaultBonus(upgrades, 89) / 100)
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
export const getVaultTotalKills = ({ characters, account }: any) => {
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
    const portalKills: any = vaultKillzTotals[worldIndex];
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
    const completedTasks = worldTasks.filter((task: any) => task === 1).length;
    totalCompletedTasks += completedTasks;
  }
  vaultKillzTotals.push(totalCompletedTasks);

  // Sum cauldron info for each world (alchemy bubbles, min 100 each)
  // CauldronInfo[worldIndex] contains bubble levels, capped at 100 each
  let totalCauldronLevels = 0;
  for (let worldIndex = 0; worldIndex < 4; worldIndex++) {
    const worldBubbles = account?.alchemy?.bubbles?.[worldIndex] || [];
    const bubbleSum = worldBubbles.reduce((sum: any, bubble: any) => {
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