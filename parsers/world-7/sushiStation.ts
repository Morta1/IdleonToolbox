import { tryToParse, commaNotation, notateNumber } from '@utility/helpers';
import { research as researchData, superbitsUpgrades, sushiUpgrades as sushiUpgradesData } from '@website-data';
import { getArcadeBonus } from '@parsers/world-2/arcade';
import { getResearchGridBonus } from '@parsers/world-7/research';
import { getMineheadBonusQTY } from '@parsers/world-7/minehead';
import { getAtomBonus } from '@parsers/world-3/atomCollider';
import { isSuperbitUnlocked } from '@parsers/world-5/gaming';
import { isBundlePurchased } from '@parsers/misc';
import { getButtonBonus } from '@parsers/world-7/button';

const MAX_TIER = 53;

const getRawSushi = (idleonData: any) => {
  const raw = tryToParse(idleonData?.Sushi) || idleonData?.Sushi;
  return Array.isArray(raw) ? raw : [];
};

const log2 = (x: number) => x > 0 ? Math.log(x) / Math.log(2) : 0;
const getLOG = (x: number) => x > 0 ? Math.log(Math.max(x, 1)) / 2.302585 : 0;

const getUpgradeQTY = (upgradeLevels: number[], idx: number) => {
  const upgrade = (sushiUpgradesData as any)?.[idx];
  if (!upgrade) return 0;
  const bonusPerLevel = Number(upgrade?.[3]) || 0;
  const level = Number(upgradeLevels?.[idx]) || 0;
  return bonusPerLevel * level;
};

const getUpgLvREQ = (t: number) => {
  return Math.floor(1 + (Math.min(2, t) + Math.min(4, t) + (3 * t
    - Math.max(0, t - 4) - Math.max(0, t - 8)
    + (Math.floor(t / 6) + Math.floor(t / 17)))));
};

export const getSushiStation = (idleonData: any, account: any) => {
  const raw = getRawSushi(idleonData);
  if (!raw.length) return null;

  const slotTiers: number[] = raw[0] ?? [];
  const slotEffects: number[] = raw[1] ?? [];
  const upgradeLevels: number[] = raw[2] ?? [];
  const fireplaceTypes: number[] = raw[3] ?? [];
  const miscState: number[] = raw[4] ?? [];
  const uniqueSushiTracking: number[] = raw[5] ?? [];
  const knowledgeXP: number[] = raw[6] ?? [];
  const knowledgeLevels: number[] = raw[7] ?? [];

  // Misc state
  const fuel = Number(miscState[0]) || 0;
  const overtunedValue = Number(miscState[1]) || 0;
  const sparks = Number(miscState[2]) || 0;
  const bucks = Number(miscState[3]) || 0;
  const shakerUses = [
    Number(miscState[5]) || 0,
    Number(miscState[6]) || 0,
    Number(miscState[7]) || 0
  ];

  // Unique sushi count (consecutive discovered types)
  let uniqueSushi = 0;
  for (let i = 0; i <= MAX_TIER; i++) {
    if ((uniqueSushiTracking[i] ?? -1) >= 0) {
      uniqueSushi = i + 1;
    } else {
      break;
    }
  }

  // Static data references
  const sushiNames: string[] = (researchData as any)?.[30] ?? [];
  const upgradeOrdering: number[] = (researchData as any)?.[32] ?? [];
  const knowledgeCategories: number[] = (researchData as any)?.[33] ?? [];
  const knowledgeCategoryDescriptions: string[] = (researchData as any)?.[34] ?? [];
  const knowledgeBonusValues: number[] = (researchData as any)?.[35] ?? [];
  const rogDescriptions: string[] = (researchData as any)?.[36] ?? [];
  const rogValues: number[] = (researchData as any)?.[37] ?? [];

  // Bundle bonus
  const bonVBundle = isBundlePurchased(account?.bundles, 'bon_v') ? 1 : 0;

  // --- Knowledge ---
  const getKnowledgeBonusSpecific = (sushiIdx: number) => {
    const categoryIdx = Number(knowledgeCategories?.[sushiIdx]) || 0;
    const bonusVal = Number(knowledgeBonusValues?.[categoryIdx]) || 0;
    const knowledgeLv = Number(knowledgeLevels?.[sushiIdx]) || 0;
    const uniqueTrack = Number(uniqueSushiTracking?.[sushiIdx]) || 0;
    return Math.max(0, bonusVal * knowledgeLv * Math.min(2, 1 + uniqueTrack) * (1 + sushiIdx / 30));
  };

  // Knowledge totals by category
  const numCategories = (researchData as any)?.[34]?.length ?? 0;
  const knowledgeTotals: number[] = new Array(Math.max(numCategories, 11)).fill(0);
  for (let i = 0; i <= MAX_TIER; i++) {
    const cat = Number(knowledgeCategories?.[i]) || 0;
    knowledgeTotals[cat] += getKnowledgeBonusSpecific(i);
  }

  // --- Upgrades ---
  const upgrades = upgradeOrdering?.map((upgIdx: any, visualPos: number) => {
    const idx = Number(upgIdx) || 0;
    const upgrade = (sushiUpgradesData as any)?.[idx];
    if (!upgrade) return null;
    const level = Number(upgradeLevels?.[idx]) || 0;
    const maxLevel = Number(upgrade?.[1]) || 0;
    const costExponent = Number(upgrade?.[2]) || 1;
    const bonusPerLevel = Number(upgrade?.[3]) || 0;
    const costDN = Number(upgrade?.[4]) || 0;
    const name = String(upgrade?.[0] ?? `Upgrade_${visualPos}`).replace(/_/g, ' ');
    const upgradeQTY = bonusPerLevel * level;
    const rawDesc = upgrade?.slice?.(5)?.join?.(' ') ?? '';
    const desc = rawDesc
      .replace(/_/g, ' ')
      .replace(/\{/g, '' + commaNotation(upgradeQTY))
      .replace(/\}/g, '' + notateNumber(1 + upgradeQTY / 100, 'MultiplierInfo'))
      .replace(/@/g, '\n');

    // UpgCost calculation
    const upgQTY36 = getUpgradeQTY(upgradeLevels, 36);
    const rogDiscount = Math.max(getSushiBonus(account, 26), getSushiBonus(account, 44));
    const knowledgeDiscount = knowledgeTotals[6] ?? 0;
    const cost = Math.max(0.1, costDN || 1)
      * (5 + visualPos + Math.pow(Math.max(0, visualPos - 1), 2))
      * Math.pow(1.5 + Math.max(0, visualPos - 3) / 16, Math.max(0, visualPos - 4))
      * Math.pow(1.3, Math.max(0, visualPos - 20))
      * (1 / (1 + upgQTY36 / 100))
      * Math.max(0.1, 1 - rogDiscount / 100)
      * (1 / (1 + knowledgeDiscount / 100))
      * Math.pow(costExponent, level);

    return {
      name,
      description: desc,
      level,
      maxLevel: maxLevel > 998 ? Infinity : maxLevel,
      cost,
      bonusPerLevel,
      upgradeQTY,
      lvReq: getUpgLvREQ(visualPos),
      visualIndex: visualPos,
      upgradeIndex: idx
    };
  }).filter(Boolean) ?? [];

  // --- Fuel ---
  const fuelCap = (200 + (knowledgeTotals[3] ?? 0))
    * (1 + Math.min(1, bonVBundle))
    * (1 + (getUpgradeQTY(upgradeLevels, 1) + getUpgradeQTY(upgradeLevels, 2)
      + getUpgradeQTY(upgradeLevels, 3) + getUpgradeQTY(upgradeLevels, 4)
      + getUpgradeQTY(upgradeLevels, 5)) / 100)
    * (1 + (Number(upgradeLevels?.[2]) || 0) / 100)
    * (1 + (Number(upgradeLevels?.[3]) || 0) / 100)
    * (1 + (Number(upgradeLevels?.[4]) || 0) / 100)
    * (1 + (Number(upgradeLevels?.[5]) || 0) / 100);

  // Fireplace spark multi
  const fireplaceSparkMulti = sparks > 0
    ? 0.2 * log2(sparks) + getLOG(sparks)
    : 0;

  // Orange fire sum (for fuel gen)
  let orangeFireSum = 0;
  for (let i = 0; i < 120; i++) {
    if ((slotTiers[i] ?? -1) >= 0 && fireplaceTypes[i % 15] === 0) {
      const fireplaceEffBase = (1 + (knowledgeTotals[9] ?? 0) / 100)
        * (1 + fireplaceSparkMulti / 100);
      orangeFireSum += ((slotTiers[i] ?? 0) + 1) * fireplaceEffBase;
    }
  }

  const fuelGen = 50
    * (1 + Math.min(1, bonVBundle))
    * (1 + (getUpgradeQTY(upgradeLevels, 8) + getUpgradeQTY(upgradeLevels, 9)
      + getUpgradeQTY(upgradeLevels, 10) + getUpgradeQTY(upgradeLevels, 11)
      + getUpgradeQTY(upgradeLevels, 12)) / 100)
    * (1 + orangeFireSum / 100)
    * (1 + (knowledgeTotals[4] ?? 0) / 100)
    * (1 + getKnowledgeBonusSpecific(27) / 100)
    * (1 + getKnowledgeBonusSpecific(36) / 100)
    * (1 + getKnowledgeBonusSpecific(45) / 100)
    * (1 + (Number(upgradeLevels?.[9]) || 0) / 100)
    * (1 + (Number(upgradeLevels?.[10]) || 0) / 100)
    * (1 + (Number(upgradeLevels?.[11]) || 0) / 100)
    * (1 + (Number(upgradeLevels?.[12]) || 0) / 100);

  // --- Currency ---
  const overtunedMulti = overtunedValue > 1e6
    ? 5 * log2(overtunedValue / 1e6) + 10 * getLOG(overtunedValue / 1e6)
    : 0;

  // Currency multiplier — full formula matching game's customBlock_SushiStuff("CurrencyMulti")
  const arcadeBonus67 = getArcadeBonus(account?.arcade?.shop, 'Sushi_Bucks')?.bonus ?? 0;
  const superbit67 = isSuperbitUnlocked(account, (superbitsUpgrades as any)?.[67]?.name) ? 1 : 0;
  const researchGrid189 = getResearchGridBonus(account, 189, 0) ?? 0;
  const mineheadBonus11 = getMineheadBonusQTY(account, 11) ?? 0;
  const atomBonus14 = getAtomBonus(account, 'Phosphorus_-_Sushi_Bucks_Generator') ?? 0;
  const sailingArt39 = Number(account?.sailing?.artifacts?.[39]?.acquired) || 0;

  const currencyMulti = (1 + arcadeBonus67 / 100)
    * Math.pow(1.1, uniqueSushi)
    * (1 + Math.min(1, bonVBundle))
    * (1 + (getUpgradeQTY(upgradeLevels, 30) + getUpgradeQTY(upgradeLevels, 31)
      + getUpgradeQTY(upgradeLevels, 32) + getUpgradeQTY(upgradeLevels, 33)
      + getUpgradeQTY(upgradeLevels, 34) + 100 * superbit67) / 100)
    * (1 + (knowledgeTotals[0] ?? 0) / 100)
    * (1 + researchGrid189 / 100)
    * (1 + getUpgradeQTY(upgradeLevels, 40) / 100)
    * Math.max(1, Math.min(1.25, 1 + mineheadBonus11 / 100))
    * (1 + (getUpgradeQTY(upgradeLevels, 41) + getUpgradeQTY(upgradeLevels, 43)) / 100)
    * (1 + overtunedMulti / 100)
    * (1 + atomBonus14 / 100)
    * (1 + getButtonBonus(account, 2) / 100)
    * (1 + (100 * sailingArt39) / 100);

  // Currency per tier
  const getCurrencyPerTier = (tier: number) => {
    if (tier < 0) return 0;
    if (tier < 10) {
      return Number('1 3 8 20 50 115 250 560 1220 2650'.split(' ')[tier]) || 0;
    }
    if (tier < 16) return Math.pow(2.46 - tier / 100, tier) + (5 * tier + Math.pow(tier, 2));
    return Math.pow(2.31, tier);
  };

  // Slot effect & fireplace effect helpers
  const slotEffectBase = 1 + (knowledgeTotals[8] ?? 0) / 100;
  const fireplaceEffectBase = (1 + (knowledgeTotals[9] ?? 0) / 100)
    * (1 + fireplaceSparkMulti / 100);

  // Currency per slot
  const getCurrencyPerSlot = (slotIdx: number) => {
    const tier = slotTiers[slotIdx] ?? -1;
    if (tier < 0) return 0;
    let multi = 1;
    if ((slotEffects[slotIdx] ?? -1) === 1) {
      multi *= (1 + 50 * slotEffectBase / 100);
    }
    if ((fireplaceTypes[slotIdx % 15] ?? -1) === 1) {
      multi *= (1 + 150 * fireplaceEffectBase / 100);
    }
    return multi * currencyMulti * getCurrencyPerTier(tier);
  };

  // Total currency per hour
  let currencyPerHR = 0;
  for (let i = 0; i < 120; i++) {
    if ((slotTiers[i] ?? -1) >= 0) {
      currencyPerHR += getCurrencyPerSlot(i);
    }
  }

  // --- Slots ---
  const slots = slotTiers.slice(0, 120).map((tier: number, i: number) => ({
    tier,
    slotEffect: slotEffects[i] ?? -1,
    fireplaceType: fireplaceTypes[i % 15] ?? -1,
    currencyPerSlot: tier >= 0 ? getCurrencyPerSlot(i) : 0
  }));

  // --- Cooking ---
  const maxCookTier = Math.round(getUpgradeQTY(upgradeLevels, 6));
  const bonusCookTierPCT = getUpgradeQTY(upgradeLevels, 7) + (knowledgeTotals[2] ?? 0);
  const perfectOdds = (idx: number) =>
    ((0.6 * Math.pow(0.81, idx)) / (1 + idx / 8))
    * (1 + (knowledgeTotals[10] ?? 0) / 100);

  // --- Knowledge per sushi type ---
  const knowledge = sushiNames.map((name: string, i: number) => {
    const cat = Number(knowledgeCategories?.[i]) || 0;
    const bonus = getKnowledgeBonusSpecific(i);
    const catDesc = String(knowledgeCategoryDescriptions?.[cat] ?? '')
      .replace(/_/g, ' ')
      .replace(/\{/g, '' + commaNotation(bonus))
      .replace(/\}/g, '' + notateNumber(1 + bonus / 100, 'MultiplierInfo'))
      .replace(/\^/g, '' + commaNotation(bonus));
    return {
      name: String(name ?? '').replace(/_/g, ' '),
      rawName: name,
      level: Number(knowledgeLevels?.[i]) || 0,
      xp: Number(knowledgeXP?.[i]) || 0,
      xpReq: (() => { const lv = Number(knowledgeLevels?.[i]) || 0; return (3 + (lv + Math.pow(lv, 1.5))) * Math.pow(1.5, Math.max(0, lv - 2)); })(),
      bonusSpecific: bonus,
      bonusDescription: catDesc,
      category: cat,
      discovered: (uniqueSushiTracking[i] ?? -1) >= 0,
      perfecto: (uniqueSushiTracking[i] ?? 0) >= 1,
      highestTier: uniqueSushiTracking[i] ?? -1
    };
  });

  // --- Knowledge summary (aggregate bonuses per category) ---
  const knowledgeSummary = knowledgeCategoryDescriptions.map((desc: string, i: number) => {
    const total = knowledgeTotals[i] ?? 0;
    const label = String(desc ?? '')
      .replace(/_/g, ' ')
      .replace(/\{/g, '' + commaNotation(total))
      .replace(/\}/g, '' + notateNumber(1 + total / 100, 'MultiplierInfo'))
      .replace(/\^/g, '' + commaNotation(total));
    const sources: { index: number; name: string; bonus: number; level: number; perfecto: boolean }[] = [];
    for (let s = 0; s <= MAX_TIER; s++) {
      if ((Number(knowledgeCategories?.[s]) || 0) === i && (uniqueSushiTracking[s] ?? -1) >= 0) {
        sources.push({
          index: s,
          name: String(sushiNames[s] ?? '').replace(/_/g, ' '),
          bonus: getKnowledgeBonusSpecific(s),
          level: Number(knowledgeLevels?.[s]) || 0,
          perfecto: (uniqueSushiTracking[s] ?? 0) >= 1
        });
      }
    }
    return { label, value: total, category: i, sources };
  });

  // --- Rest of game bonuses ---
  const rogBonuses = rogDescriptions?.map((desc: string, i: number) => {
    const rawVal = Number(rogValues?.[i]) || 0;
    const bonusDesc = String(desc ?? '')
      .replace(/_/g, ' ')
      .replace(/\{/g, '' + commaNotation(rawVal))
      .replace(/\}/g, '' + notateNumber(1 + rawVal / 100, 'MultiplierInfo'))
      .replace(/@/g, '\n');
    return {
      index: i,
      name: String(sushiNames[i] ?? '').replace(/_/g, ' '),
      description: bonusDesc,
      value: uniqueSushi > i ? rawVal : 0,
      rawValue: rawVal,
      unlocked: uniqueSushi > i
    };
  }) ?? [];

  // --- Fireplaces ---
  const fireplaces = fireplaceTypes.map((type: number, i: number) => ({
    index: i,
    type,
    active: type >= 0
  }));

  return {
    uniqueSushi,
    fuel: { current: fuel, cap: fuelCap, generation: fuelGen },
    currency: { bucks, currencyMulti, currencyPerHR, overtunedMulti },
    sparks,
    slots,
    upgrades,
    knowledge,
    knowledgeTotals,
    rogBonuses,
    fireplaces,
    sushiCooking: { maxCookTier, bonusCookTierPCT, perfectOdds: perfectOdds(0) },
    knowledgeSummary,
    shakerUses,
    slotsOwned: 10,
  };
};

/**
 * Returns the Rest of game (sushi) bonus value for a given index.
 * Game: customBlock_SushiStuff("RoG_BonusQTY", index, 0)
 * If uniqueSushi > index, returns research[37][index]; else 0.
 */
export const getSushiBonus = (account: any, index: number): number => {
  const uniqueSushi = account?.sushiStation?.uniqueSushi ?? 0;
  if (uniqueSushi <= index) return 0;
  return Number((researchData as any)?.[37]?.[index]) || 0;
};
