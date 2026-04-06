import { tryToParse, commaNotation, notateNumber } from '@utility/helpers';
import { mineheadUpgrades, upgradeVault, research as researchData, items } from '@website-data';
import { getAtomBonus } from '@parsers/world-3/atomCollider';
import { getMealsBonusByEffectOrStat } from '@parsers/world-4/cooking';
import { isCompanionBonusActive, getEventShopBonus } from '@parsers/misc';
import { getResearchGridBonus } from '@parsers/world-7/research';
import { getSushiBonus } from '@parsers/world-7/sushiStation';
import { getButtonBonus } from '@parsers/world-7/button';
import { isArtifactAcquired } from '@parsers/world-5/sailing';

const getRawMinehead = (idleonData: any) => {
  const raw = tryToParse(idleonData?.Research) || idleonData?.Research;
  return Array.isArray(raw) ? raw : [];
};

export const getMinehead = (idleonData: any, account: any, serverVars: any) => {
  const raw = getRawMinehead(idleonData);

  // raw[7] = minehead game-state array:
  //   [4] = opponents beaten, [5] = mine currency, [6] = best hit ever, [8] = daily tries left
  const mineheadState = raw[7] ?? [];
  const opponentsBeat = Number(mineheadState[4]) || 0;
  const mineCurrency = Number(mineheadState[5]) || 0;
  const bestHit = Number(mineheadState[6]) || 0;
  const dailyTriesLeft = Number(mineheadState[8]) || 0;

  // raw[8] = upgrade levels, one entry per upgrade index
  const upgradeLevels = raw[8] ?? [];

  // raw[12] = glimbo trade counts per item
  const glimboRaw = raw[12] ?? [];

  // Server vars — only affect high-index upgrades/opponents (index > 9). Default 1 if absent.
  const A_MineCost = Math.max(1, serverVars?.A_MineCost ?? 1);
  const A_MineHP = Math.max(1, serverVars?.A_MineHP ?? 1);

  // researchData[20] = per-opponent bonus values (array, 32 entries)
  const opponentBonusValues = researchData?.[20] ?? [];

  // researchData[19] = per-opponent bonus descriptions (array, 32 entries)
  // NOTE: These use underscores instead of spaces inside each description.
  const opponentBonusDescs = researchData?.[19] ?? [];

  // researchData[11] = opponent names (array, 32 entries) — NOT in opponent order
  // researchData[10] = name index per opponent slot (array, 32 entries)
  const opponentNamePool = researchData?.[11] ?? [];
  const opponentNameOrder = (researchData?.[10] ?? []).map(Number);
  const opponentNames = opponentNameOrder.map((i: any) => opponentNamePool[i] ?? '');

  // researchData[15] = ordinal strings ("first second third ... permanent")
  const ordinals = researchData?.[15] ?? [];

  // researchData[16] = title strings ("the_honorable ... the_never_ending")
  const titles = researchData?.[16] ?? [];

  // researchData[9] = grid expansion sizes "cols,rows" pairs (array)
  const gridSizes = researchData?.[9] ?? [];

  // researchData[27] = Glimbo item raw names (array, 13 items)
  const glimboItemNames = researchData?.[27] ?? [];

  // researchData[28] = Glimbo cost base values (array, 13 items)
  const glimboCostBases = researchData?.[28] ?? [];

  // researchData[26] = upgradeVault index per glimbo trade (array, 13 items)
  const glimboVaultIndices = (researchData?.[26] ?? []).map(Number);

  // researchData[29] = flag per glimbo trade: '1' means Grid_Bonus[169] multiplies extra levels
  const glimboFlags = researchData?.[29] ?? [];

  // Grid square 169 level — each level adds +1 to the per-trade multiplier for flagged glimbo trades
  // Formula: extraLevels = (1 + level) * (trades + 1). Uses mode 1 (level), NOT mode 0 (bonus)
  const grid169Level = getResearchGridBonus(account, 169, 1);

  // --- Upgrade QTY helper ---
  // handleUpgradeQTY: MineheadUPG[idx].levelReq * Research[8][idx]
  // Note: `levelReq` in website-data is the per-level effect value (misleadingly named).
  const getUpgradeQTY = (idx: any) => {
    const upgrade = mineheadUpgrades?.[idx];
    if (!upgrade) return 0;
    const bonusPerLevel = Number(upgrade.levelReq) || 0;
    const level = Number(upgradeLevels[idx]) || 0;
    return bonusPerLevel * level;
  };

  // --- Opponent bonus reward helper ---
  // handleBonusQTY: returns researchData[20][t] if opponentsBeat > t, else 0
  const getBonusQTY = (opponentIdx: any) => {
    if (opponentsBeat > opponentIdx) {
      return Number(opponentBonusValues[opponentIdx]) || 0;
    }
    return 0;
  };

  // --- Research level (from account, populated by previous pass via research.js) ---
  const researchLevel = account?.research?.researchLevel ?? 0;

  // --- Upgrade cost ---
  // handleUpgCost: base formula using upgrade index + per-level exponent scaling
  const getUpgradeCost = (idx: any) => {
    const upgrade = mineheadUpgrades?.[idx];
    if (!upgrade) return 0;
    const level = Number(upgradeLevels[idx]) || 0;
    const costExponent = Number(upgrade.exponent) || 1;
    const base = (5 + idx + Math.pow(Math.max(0, idx - 2), 1.3))
      * Math.pow(2, Math.max(0, idx - 4))
      * Math.pow(A_MineCost, Math.max(0, idx - 9));
    const costReductionDiscount = 1 / (1 + getUpgradeQTY(26) / 100);
    return base * costReductionDiscount * Math.pow(costExponent, level) * Math.max(0.1, 1 - Math.max(getSushiBonus(account, 1), getSushiBonus(account, 16)) / 100);
  };

  // --- Research level requirement per upgrade index ---
  // handleUpgLvREQ: 1 + (3*t + floor(t/3) + floor(t/11))
  const getResearchLvReq = (idx: any) =>
    1 + (3 * idx + (Math.floor(idx / 3) + Math.floor(idx / 11)));

  // --- Opponent max HP ---
  // handleMaxHP_Opp
  const getMaxHPOpp = (t: any) =>
    (5 + (2 * t + t * t))
    * Math.pow(1.8, t)
    * Math.pow(1.85, Math.floor(Math.max(0, t - 4) / 3))
    * Math.pow(4, Math.floor(Math.max(0, t - 5) / 7))
    * Math.pow(A_MineHP, Math.max(0, t - 9));

  // --- Opponent mine count (depth charges) ---
  // handleMines_Opp
  const getMinesOpp = (t: any) =>
    Math.round(Math.min(40, 1 + (
      Math.floor(t / 3) + Math.floor(t / 7) + Math.floor(t / 13)
      + Math.min(1, Math.floor(t / 15)) + Math.floor(t / 17)
    )));

  // --- Computed stats ---

  // Daily tries max: 3 + Grid_Bonus(147, 1) — game uses mode 1 (level) here
  const grid147Level = getResearchGridBonus(account, 147, 1);
  const dailyTriesMax = Math.round(3 + grid147Level);

  // Max HP for player: 3 + upgradeQTY(6)
  const maxHP_You = Math.round(3 + getUpgradeQTY(6));

  // Base DMG:
  //   (1 + QTY(0) + QTY(7) + QTY(25)) * (1 + (QTY(4)+QTY(21)+QTY(27)) / 100)
  //   * (1 + grid167 / 100)
  const grid167Bonus = getResearchGridBonus(account, 167, 0);
  const nomenclatureAcquired = isArtifactAcquired(account?.sailing?.artifacts, 'Nomenclature')?.acquired ?? 0;
  const baseDMG =
    (1 + getUpgradeQTY(0) + getUpgradeQTY(7) + getUpgradeQTY(25))
    * (1 + (getUpgradeQTY(4) + getUpgradeQTY(21) + getUpgradeQTY(27)) / 100)
    * (1 + grid167Bonus / 100)
    * (1 + (50 * nomenclatureAcquired) / 100);

  // Currency gain per hour:
  //   grid129 * (1+grid148/100) * companionMulti * min(3, 1+BonusQTY(6)/100)
  //   * (1 + (QTY(5)+QTY(22)+QTY(28)*log10(bestHit)+arcade62) / 100)
  //   * (1 + atom13 / 100)
  //   * (1 + (grid147 + mealMineCurr) / 100)
  const grid129Bonus = getResearchGridBonus(account, 129, 0);
  const grid148Bonus = getResearchGridBonus(account, 148, 0);
  const grid147Bonus = getResearchGridBonus(account, 147, 0); // CurrencyGain uses mode 0
  const grid166Bonus = getResearchGridBonus(account, 166, 0);
  const arcade62Bonus = account?.arcade?.shop?.[62]?.bonus ?? 0;
  const atom13Bonus = getAtomBonus(account, 'Silicon_-_Minehead_Money_Printer') ?? 0;
  const mealMineCurrBonus = getMealsBonusByEffectOrStat(account, null, 'MineCurr') ?? 0;

  // a max 2x multiplier to mine currency gain. The companion at toolbox index 143 is
  // "Rift_Jocund" (2x kills for portals/deathnote), which does not appear to be minehead-related.
  // This mapping may be incorrect. Verify against actual companion data before shipping.
  const companionMulti = Math.max(1, Math.min(2, isCompanionBonusActive(account, 143) ? 2 : 1));

  const currencyGain =
    grid129Bonus
    * (1 + grid148Bonus / 100)
    * companionMulti
    * Math.min(3, 1 + getBonusQTY(6) / 100)
    * (1 + (
        getUpgradeQTY(5)
        + getUpgradeQTY(22)
        + getUpgradeQTY(28) * Math.log10(Math.max(1, bestHit))
        + arcade62Bonus
      ) / 100)
    * (1 + atom13Bonus / 100)
    * (1 + (grid147Bonus + grid166Bonus + mealMineCurrBonus) / 100)
    * (1 + getSushiBonus(account, 12) / 100)
    * (1 + getButtonBonus(account, 1) / 100);

  // Bluecrown multiplier — used in description for upgrade 14
  const getBluecrownMulti = () => 1.5 + getUpgradeQTY(14) / 100;

  // Jackpot odds — used in description for upgrade 23
  const getJackpotOdds = () =>
    getUpgradeQTY(23) === 0 ? 0 : 0.01 * (1 + getUpgradeQTY(23) / 100);

  // --- Upgrades ---
  const upgrades = (mineheadUpgrades ?? []).map((upgrade, idx) => {
    const level = Number(upgradeLevels[idx]) || 0;
    // `baseCost` field in website-data = max level cap in game (misleadingly named)
    const maxLevel = Number(upgrade.baseCost);
    const isMaxed = maxLevel < 999 && level >= maxLevel;
    const bonusPerLevel = Number(upgrade.levelReq) || 0;
    const upgradeQTY = bonusPerLevel * level;
    const researchLvReq = getResearchLvReq(idx);
    const isLocked = researchLevel < researchLvReq;
    const cost = getUpgradeCost(idx);
    const canAfford = !isMaxed && !isLocked && mineCurrency >= cost;

    const description = formatUpgradeDescription(
      upgrade.description ?? '',
      idx,
      upgradeQTY,
      level,
      getUpgradeQTY,
      getBluecrownMulti,
      getJackpotOdds,
      gridSizes,
      bestHit
    );

    return {
      index: idx,
      name: upgrade.name ?? '',
      level,
      maxLevel,
      isMaxed,
      researchLvReq,
      isLocked,
      bonusPerLevel,
      upgradeQTY,
      cost,
      canAfford,
      description,
    };
  });

  // --- Opponents (32 total) ---
  const opponents = Array.from({ length: 32 }, (_, idx) => {
    const name = opponentNames[idx] ?? '';
    const ordinal = ordinals[idx] ?? '';
    const title = titles[idx] ?? '';
    const maxHP = getMaxHPOpp(idx);
    const minesCount = getMinesOpp(idx);
    const bonusValue = Number(opponentBonusValues[idx]) || 0;
    const bonusDescription = formatOpponentDescription(opponentBonusDescs[idx] ?? '', bonusValue);
    const beaten = idx < opponentsBeat;

    return {
      index: idx,
      name: name.replace(/_/g, ' '),
      ordinal: ordinal.replace(/_/g, ' '),
      title: title.replace(/_/g, ' '),
      maxHP,
      minesCount,
      bonusValue,
      bonusDescription,
      beaten,
    };
  });

  // --- Glimbo trades (13 items) ---
  const glimbo = glimboItemNames.map((itemName: any, idx: any) => {
    const trades = Number(glimboRaw[idx]) || 0;
    const costBase = Number(glimboCostBases[idx]) || 1;
    // handleGlimbo_Cost: (1 + trades + 1.5*trades) * base^trades * eventDiscount, floored if < 1e9
    const eventDiscount = Math.max(0.1, 1 - (25 * getEventShopBonus(account, 38)) / 100);
    const rawCost = (1 + trades + 1.5 * trades) * Math.pow(costBase, trades) * eventDiscount;
    const cost = rawCost < 1e9 ? Math.floor(Math.max(1, rawCost)) : rawCost;

    const vaultIdx = glimboVaultIndices[idx] ?? -1;
    const vaultEntry = upgradeVault?.[vaultIdx];
    const upgradeName = vaultEntry?.name ?? '';
    const baseMaxLevel = Number(vaultEntry?.maxLevel) || 0;

    // Extra max levels from trades:
    //   flag='1': (1 + grid169Bonus) * (trades + 1)
    //   flag='0': (trades + 1)
    const flag = glimboFlags[idx] === '1';
    const multiplier = flag ? (1 + grid169Level) : 1;
    const extraLevels = Math.round(multiplier * (trades + 1));
    const currentMaxLevel = baseMaxLevel + extraLevels;
    const nextExtraLevels = Math.round(multiplier * (trades + 2));
    const nextMaxLevel = baseMaxLevel + nextExtraLevels;
    const nextBonusGain = nextMaxLevel - currentMaxLevel;

    return {
      index: idx,
      rawItemName: itemName,
      itemName: items?.[itemName]?.displayName,
      trades,
      cost,
      vaultIdx,
      upgradeName,
      baseMaxLevel,
      currentMaxLevel,
      nextMaxLevel,
      nextBonusGain,
      flag,
    };
  });

  const glimboTotalTrades = glimboRaw.reduce((sum: any, v: any) => sum + (Number(v) || 0), 0);

  // NOTE: handleCurrentOutgoingDMG cannot be computed statically — it depends on the live
  // game board state (which tiles have been revealed during an active Minehead game session).
  // This value is only meaningful in real-time during gameplay.

  // NOTE: handleWepPowDmgPCT depends on equipped weapon data (Weapon_Power) which is not
  // available in the parser context. Skipped.

  return {
    opponentsBeat,
    mineCurrency,
    bestHit,
    dailyTriesLeft,
    dailyTriesMax,
    maxHP_You,
    baseDMG,
    currencyGain,
    upgrades,
    opponents,
    glimbo,
    glimboTotalTrades,
  };
};

/**
 * Formats a per-opponent bonus description, resolving game placeholders using the opponent's
 * flat bonusValue (from researchData[20]):
 *   { → bonusValue (flat number)
 *   } → multiplier string (1 + bonusValue/100), e.g. "1.10" so "}x" becomes "1.10x"
 *   $ → requires live game state (weapon power, AFK rate, etc.) — left as-is
 *   @ → stripped (in-game annotation marker)
 * Underscores are replaced with spaces.
 */
function formatOpponentDescription(template: any, bonusValue: any) {
  let desc = template;

  // Replace { with flat bonus value
  desc = desc.split('{').join(commaNotation(bonusValue));

  // Replace } with multiplier notation (no x — the template appends x where needed)
  const multStr = (notateNumber(1 + bonusValue / 100, 'MultiplierInfo') as string).replace(/#/g, '');
  desc = desc.split('}').join(multStr);

  // $ requires game-state not available here (e.g. weapon power, current AFK rate) — leave as-is

  // Strip @ annotation markers
  desc = desc.split('@').join('');

  // Replace underscores with spaces
  desc = desc.replace(/_/g, ' ').trim();

  return desc;
}

/**
 * Formats a minehead upgrade description, resolving game placeholders:
 *   { → commaNotation(upgradeQTY)
 *   } → multiplier string (1 + upgradeQTY/100)
 *   $ → upgrade-specific special value (handled per index)
 *   @ → stripped (in-game annotation marker)
 * Underscores are replaced with spaces.
 */
function formatUpgradeDescription(
  template: any,
  idx: any,
  upgradeQTY: any,
  level: any,
  getUpgradeQTY: any,
  getBluecrownMulti: any,
  getJackpotOdds: any,
  gridSizes: any,
  bestHit: any
) {
  let desc = template;

  // Replace { with current upgrade qty
  desc = desc.split('{').join(commaNotation(upgradeQTY));

  // Replace } with multiplier notation
  const multStr = (notateNumber(1 + upgradeQTY / 100, 'MultiplierInfo') as string).replace(/#/g, '');
  desc = desc.split('}').join(multStr);

  // Replace $ with upgrade-specific value
  const dollarValue = getDollarValue(idx, getUpgradeQTY, getBluecrownMulti, getJackpotOdds, gridSizes, bestHit, level);
  if (dollarValue !== null) {
    desc = desc.split('$').join(String(dollarValue));
  }

  // Strip @ markers (in-game annotation/reference notation)
  desc = desc.split('@').join('');

  // Replace underscores with spaces for display
  desc = desc.replace(/_/g, ' ');

  return desc.trim();
}

/**
 * Returns the $ replacement value for upgrades that have special descriptions.
 * Returns null if no special handling needed.
 */
function getDollarValue(idx: any, getUpgradeQTY: any, getBluecrownMulti: any, getJackpotOdds: any, gridSizes: any, bestHit: any, level: any) {
  switch (idx) {
    case 1: {
      // Numbahs: max tile number = round(1 + (QTY(1) + 1 + min(1, floor((QTY(1)+1)/9))))
      const qty1 = getUpgradeQTY(1);
      if (level >= 17) return 'the MAXIMUM max number there is!!!';
      return Math.round(1 + (qty1 + 1 + Math.min(1, Math.floor((qty1 + 1) / 9))));
    }

    case 2: {
      // Grid_Expansion: shows next grid size
      // gridSizes[level] = "cols,rows" for next expansion; current is gridSizes[level]
      const nextSize = gridSizes[level + 1];
      if (!nextSize) return 'max grid size reached!';
      const [cols, rows] = nextSize.split(',').map(Number);
      const currentSize = gridSizes[level] ?? '0,0';
      const [curCols, curRows] = currentSize.split(',').map(Number);
      return `${cols}x${rows} tiles (${cols * rows} total, up from your current ${curCols}x${curRows} grid)`;
    }

    case 12: {
      // Multiplier_Madness: shows current tile multiplier
      const qty12 = getUpgradeQTY(12);
      if (qty12 === 0) return null; // description handles the 0 case with a fallback text
      const multiplierTable = '1.0 1.2 1.4 1.6 2 3 4 5 6 7 8 8 8 8'.split(' ');
      return (multiplierTable[qty12] ?? '8') + 'x';
    }

    case 14: {
      // Bluecrown upgrade: shows current bluecrown multiplier
      const multi = getBluecrownMulti();
      return (notateNumber(multi, 'MultiplierInfo') as string).replace(/#/g, '') + 'x';
    }

    case 17: {
      // Additive tiles: shows current additive %
      const qty17 = getUpgradeQTY(17);
      if (qty17 === 0) return null;
      const additiveTable = '0 10 20 50 100 200 500 1000 2000 5000 10000'.split(' ');
      return (additiveTable[qty17] ?? '10000') + '%';
    }

    case 23: {
      // Jackpot odds: shows 1-in-N chance
      const odds = getJackpotOdds();
      if (odds === 0) return null;
      return Math.ceil(1 / odds);
    }

    case 24: {
      // Jackpot tiles: shows tile count
      return Math.round(3 + getUpgradeQTY(24));
    }

    case 26: {
      // Cost reduction: shows effective % reduction
      const qty26 = getUpgradeQTY(26);
      return Math.round(10000 * (1 - 1 / (1 + qty26 / 100))) / 100;
    }

    case 28: {
      // Miney_Farmey_III: shows per-power-10 bonus and current total
      const qty28 = getUpgradeQTY(28);
      const logBestHit = Math.log10(Math.max(1, bestHit));
      return `+${commaNotation(qty28)}% Mine Currency per POW 10 of your best ever hit, so +${notateNumber(qty28 * logBestHit, 'Big')}% total`;
    }

    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Exported helpers used by research.js to replace its internal stubs
// ---------------------------------------------------------------------------

/**
 * Returns the opponent-defeat bonus for a given minehead index.
 * Game logic: BonusQTY(t) = opponentsBeat > t ? researchData[20][t] : 0
 * This is NOT the same as upgradeQTY (bonusPerLevel * level).
 */
export const getMineheadBonusQTY = (account: any, upgradeIndex: any) => {
  const opponentsBeat = account?.minehead?.opponentsBeat ?? 0;
  if (opponentsBeat <= upgradeIndex) return 0;
  return account?.minehead?.opponents?.[upgradeIndex]?.bonusValue ?? 0;
};

/**
 * Returns the total number of Glimbo trades made across all items.
 * Used by research.js for grid square 168 (Glimbo DR multiplier).
 */
export const getMineheadGlimboTotalTrades = (account: any) =>
  account?.minehead?.glimboTotalTrades ?? 0;
