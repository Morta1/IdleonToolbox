import { groupByKey, growth, tryToParse } from '@utility/helpers';
import { crafts, items, stamps } from '../data/website-data';
import { getTalentBonus } from '@parsers/talents';
import { calculateItemTotalAmount, flattenCraftObject } from '@parsers/items';
import { getHighestCapacityCharacter } from '@parsers/misc';
import { getSigilBonus, getVialsBonusByEffect } from '@parsers/alchemy';
import { getCharmBonus, isJadeBonusUnlocked } from '@parsers/world-6/sneaking';
import { getUpgradeVaultBonus } from '@parsers/misc/upgradeVault';

const stampsMapping = { 0: 'combat', 1: 'skills', 2: 'misc' };

export const getStamps = (idleonData, account) => {
  const stampLevelsRaw = tryToParse(idleonData?.StampLv) || idleonData?.StampLevel;
  const stampMaxLevelsRaw = tryToParse(idleonData?.StampLvM) || idleonData?.StampLevelMAX;
  return parseStamps(stampLevelsRaw, stampMaxLevelsRaw, account);
}

export const parseStamps = (stampLevelsRaw, stampMaxLevelsRaw, account) => {
  const stampsObject = stampLevelsRaw?.reduce((result, item, index) => ({
    ...result,
    [stampsMapping?.[index]]: Object.keys(item).reduce((res, key, stampIndex) => (key !== 'length' ? [
        ...res,
        { level: parseFloat(item[key]), maxLevel: stampMaxLevelsRaw?.[index]?.[stampIndex] }
      ]
      : res), [])
  }), {});
  return Object.entries(stampsObject)?.reduce((acc, [category, stampsLevels]) => {
    const stampList = stampsLevels?.map((stamp, index) => {
      const stampDetails = stamps[category][index];
      const requiredItem = stampDetails?.itemReq?.[0];
      const materials = flattenCraftObject(crafts[requiredItem?.name]);
      const ownedMats = account?.storage?.reduce((sum, { rawName: storageRawName, amount }) => {
        if (storageRawName !== requiredItem?.rawName) return sum;
        return sum + (amount || 0);
      }, 0);
      const greenStackOwnedMats = Math.max(0, ownedMats - 1e7);
      return { ...stampDetails, ...stamp, materials, ownedMats, greenStackOwnedMats, itemReq: requiredItem, category }
    })
    return { ...acc, [category]: stampList };
  }, {});
}

export const evaluateStamp = (stamp, account, characters, gildedStamp = true, forcedStampReducer, forceMaxCapacity = false) => {
  const stampReducer = forcedStampReducer ?? account?.atoms?.stampReducer;
  const bestCharacter = getHighestCapacityCharacter(items?.[stamp?.itemReq?.rawName], characters, account, forceMaxCapacity);
  const goldCost = getGoldCost(stamp?.level, stamp, account);
  const hasMoney = account?.currencies?.rawMoney >= goldCost;
  const materialCost = getMaterialCost(stamp?.level, stamp, account, stampReducer, gildedStamp);

  let hasMaterials, greenStackHasMaterials;
  if (stamp?.materials?.length > 0) {
    hasMaterials = checkHasMaterials(stamp?.materials, materialCost, account);
    greenStackHasMaterials = checkHasMaterials(stamp?.materials, materialCost, account, true);
  }
  else {
    hasMaterials = stamp?.ownedMats >= materialCost;
    greenStackHasMaterials = Math.max(0, stamp?.ownedMats - 1e7) >= materialCost;
  }

  const enoughPlayerStorage = bestCharacter?.maxCapacity >= materialCost;

  const newStampData = {
    ...stamp,
    bestCharacter,
    goldCost,
    materialCost,
    enoughPlayerStorage,
    greenStackHasMaterials,
    hasMaterials,
    hasMoney
  };

  const futureCosts = getFutureCosts(newStampData, account, stampReducer, gildedStamp);
  return { ...newStampData, futureCosts };
}

// Updated version of updateStamps that uses the new evaluateStamp function
export const updateStamps = (account, characters, gildedStamp = true, forcedStampReducer) => {
  const flatten = Object.values(account?.stamps || {}).flat().map(stamp =>
    evaluateStamp(stamp, account, characters, gildedStamp, forcedStampReducer)
  );

  return groupByKey(flatten, ({ category }) => category);
}

const checkHasMaterials = (materials, materialCost, account, subtractGreenStacks) => {
  return materials?.every(({ itemName, type, itemQuantity }) => {
    if (type === 'Equip') return true;
    let ownedMats = calculateItemTotalAmount(account?.storage, itemName, true);
    return subtractGreenStacks ? Math.max(0, ownedMats - 1e7) : ownedMats >= itemQuantity * materialCost;
  })
}

const getFutureCosts = (stamp, account, stampReducer, gildedStamp) => {
  let maxCarryLevel = stamp?.maxLevel;
  while (getMaterialCost(maxCarryLevel, stamp, account, stampReducer, gildedStamp) < stamp?.bestCharacter?.maxCapacity) {
    maxCarryLevel += stamp?.reqItemMultiplicationLevel;
  }
  const reductionIncrement = account?.atoms?.atoms?.[0]?.baseBonus * account?.atoms?.atoms?.[0]?.level;
  const topTier = stamp?.level + stamp?.reqItemMultiplicationLevel * 3;
  const futureCosts = [];
  for (let tier = stamp?.level + stamp?.reqItemMultiplicationLevel; tier <= topTier; tier += stamp?.reqItemMultiplicationLevel) {
    for (let j = tier === stamp?.level + stamp?.reqItemMultiplicationLevel
      ? stampReducer
      : 0; j <= 90; j = Math.min(90, j + reductionIncrement)) {
      let materialCost, goldCost;
      const futureCost = getMaterialCost(tier - stamp?.reqItemMultiplicationLevel, stamp, account, j, gildedStamp);
      if (j === 90) {
        if (futureCost < stamp?.bestCharacter?.maxCapacity) {
          materialCost = (tier - stamp?.reqItemMultiplicationLevel === stamp?.level
            ? futureCost
            : getMaterialCostToLevel(stamp?.level, tier, stamp, account, j, gildedStamp));
          goldCost = getGoldCostToLevel(stamp?.level, tier, stamp, account);
          futureCosts.push({
            ...stamp?.itemReq,
            level: tier,
            goldCost,
            materialCost,
            reduction: j
          });
        }
        break;
      }
      if (futureCost < stamp?.bestCharacter?.maxCapacity) {
        materialCost = (tier - stamp?.reqItemMultiplicationLevel === stamp?.level
          ? futureCost
          : getMaterialCostToLevel(stamp?.level, tier, stamp, account, j, gildedStamp));
        goldCost = getGoldCostToLevel(stamp?.level, tier, stamp, account);
        futureCosts.push({
          ...stamp?.itemReq,
          level: tier,
          goldCost,
          materialCost,
          reduction: j
        });
        break;
      }
      if (reductionIncrement === 0) {
        break;
      }
    }
  }
  if (futureCosts.length === 0) {
    const materialCost = getMaterialCost(maxCarryLevel, stamp, account, stampReducer, gildedStamp);
    const goldCost = getGoldCost(maxCarryLevel, stamp, account);
    futureCosts.push({ ...stamp?.itemReq, level: maxCarryLevel, goldCost, materialCost, reduction: stampReducer });
  }
  return futureCosts;
}

const getGoldCostToLevel = (level, maxLevel, stamp, account) => {
  let total = getGoldCost(level, stamp, account);
  for (let i = level; i < maxLevel; i++) {
    total += getGoldCost(i, stamp, account);
  }
  return total
}

const getGoldCost = (level, stamp, account) => {
  const reductionVal = getVialsBonusByEffect(account?.alchemy?.vials, 'material_cost_for_stamps');
  const reductionBribe = account?.bribes?.[0];
  const realBaseCost = reductionBribe?.done
    ? stamp?.baseCoinCost * (1 - (reductionBribe?.value / 100))
    : stamp?.baseCoinCost;
  const cost = (realBaseCost * Math.pow(stamp?.powCoinBase - (level / (level + 5 * stamp?.reqItemMultiplicationLevel)) * 0.25, level * (10 / stamp?.reqItemMultiplicationLevel))) * Math.max(0.1, 1 - (reductionVal / 100));
  return Math.floor(cost);
}

const getMaterialCostToLevel = (level, maxLevel, stamp, account, reduction = 0, gildedStamp) => {
  let total = 0;
  for (let i = level; i < maxLevel; i += stamp?.reqItemMultiplicationLevel) {
    total += getMaterialCost(i, stamp, account, reduction, gildedStamp);
  }
  return total
}

const getMaterialCost = (level, stamp, account, reduction = 0, gildedStamp) => {
  const reductionVial = getVialsBonusByEffect(account?.alchemy?.vials, 'material_cost_for_stamps');
  const sigilBonus = getSigilBonus(account?.alchemy?.p2w?.sigils, 'ENVELOPE_PILE');
  const sigilReduction = (1 / (1 + sigilBonus / 100)) ?? 1;
  const stampReducerVal = Math.max(0.1, 1 - reduction / 100);
  return Math.max(1, (stamp?.baseMatCost * (gildedStamp ? 0.05 : 1)
      * stampReducerVal
      * sigilReduction
      * Math.pow(stamp?.powMatBase, Math.pow(Math.round(level / stamp?.reqItemMultiplicationLevel) - 1, 0.8)))
    * Math.max(0.1, 1 - (reductionVial / 100)));
}

export const getStampsBonusByEffect = (account, effectName, character) => {
  return account?.stamps && Object.entries(account?.stamps)?.reduce((final, [stampTreeName, stampTree]) => {
    const foundStamps = stampTree?.filter(({ effect }) => effect?.includes(effectName));
    const sum = foundStamps?.reduce((stampsSum, { rawName }) => stampsSum + getStampBonus(account, stampTreeName, rawName, character), 0);
    return final + sum;
  }, 0);
}

export const getStampBonus = (account, stampTree, stampName, character) => {
  const stamp = account?.stamps?.[stampTree]?.find(({ rawName }) => rawName === stampName);
  if (!stamp) return 0;
  let toiletPaperPostage = 1, charmBonus = 0;
  if (stamp?.stat?.includes('Eff')) {
    toiletPaperPostage = getTalentBonus(character?.starTalents, null, 'TOILET_PAPER_POSTAGE')
  }
  if (stampTree !== 'misc'){
    charmBonus = getCharmBonus(account, 'Liqorice_Rolle')
  }
  const removeLevelReduction = isJadeBonusUnlocked(account, 'Level_Exemption');
  if (stamp?.skillIndex > 0 && !removeLevelReduction) {
    if (stamp?.reqItemMultiplicationLevel > 1) {
      const deficitEff = 3;
      let stampLevel = stamp?.level * (200 / (20 * stamp?.reqItemMultiplicationLevel));
      if (stampLevel > deficitEff) {
        const charSkillLevel = character?.skillsInfoArray?.[stamp?.skillIndex]?.level;
        let lvlDiff = deficitEff + (stampLevel - deficitEff) * Math.pow(charSkillLevel / (stampLevel - deficitEff), 0.75);
        lvlDiff *= 20 * stamp?.reqItemMultiplicationLevel / 200;
        const reducedLevel = Math.floor(Math.min(lvlDiff, stampLevel));
        const finalLevel = Math.min(reducedLevel, stamp?.level);
        return (growth(stamp?.func, finalLevel, stamp?.x1, stamp?.x2, false) ?? 0) * (stamp?.multiplier || 1) * (toiletPaperPostage || 1) * (1 + charmBonus / 100);
      }
    }
  }
  let upgradeVaultMulti = 0;
  if (stamp?.stat === "BaseDmg" || stamp?.stat === "BaseHp" || stamp?.stat === "BaseAcc" || stamp?.stat === "BaseDef"){
    upgradeVaultMulti = getUpgradeVaultBonus(account?.upgradeVault?.upgrades, 16);
  }
  return (growth(stamp?.func, stamp?.level, stamp?.x1, stamp?.x2, false) ?? 0) * (stamp?.multiplier || 1) * (toiletPaperPostage || 1) * (1 + charmBonus / 100) * (1 + upgradeVaultMulti / 100);
}

export const applyStampsMulti = (stamps, multiplier) => {
  return Object.entries(stamps).reduce((res, [stampCategory, stamps]) => {
    let updatedStamps = stamps;
    if (stampCategory !== 'misc') {
      updatedStamps = stamps?.map((stamp) => ({ ...stamp, multiplier }));
    }
    return { ...res, [stampCategory]: updatedStamps };
  }, {});
}

export const calcStampLevels = (allStamps) => {
  if (!allStamps) return 0;
  return Object.values(allStamps)?.reduce((res, stamps) => res + stamps?.reduce((stampsLevels, { level }) => stampsLevels + level, 0), 0);
};

export const calcStampCollected = (allStamps) => {
  if (!allStamps) return 0;
  return Object.values(allStamps)?.reduce((res, stamps) => res + stamps?.reduce((stampsCollected, { level }) => stampsCollected + (level > 0
    ? 1
    : 0), 0), 0)
}

export const unobtainableStamps = ['Stat_Wallstree_Stamp', 'SpoOoky_Stamp', 'Prayday_Stamp', 'Shiny_Crab_Stamp','Talent_I_Stamp', 'Talent_V_Stamp', 'Gear_Stamp'].toSimpleObject();