import { items } from "../data/website-data";

export const addStoneDataToEquip = (baseItem, stoneData) => {
  if (!baseItem || !stoneData) return {};
  return Object.keys(stoneData)?.reduce((res, statName) => {
    if (statName === 'UQ1txt' || statName === 'UQ2txt') {
      return { ...res, [statName]: baseItem?.[statName] || stoneData?.[statName] };
    }
    const baseItemStat = baseItem?.[statName];
    const stoneStat = stoneData?.[statName];
    let sum = baseItemStat;
    if (isNaN(stoneStat) || stoneStat < 0) return { ...res, [statName]: stoneStat };
    sum = (baseItemStat || 0) + stoneStat;
    return { ...res, [statName]: parseFloat(sum) };
  }, {});
}

export const calculateItemTotalAmount = (array, itemName, exact) => {
  return array?.reduce((result, item) => {
    if (exact) {
      if (itemName === item?.name) {
        result += item?.amount;
      }
    } else {
      if (item?.name?.includes(itemName)) {
        result += item?.amount;
      }
    }
    return result;
  }, 0);
}

export const getStatFromEquipment = (item, statName) => {
  // %_SKILL_EXP
  const misc1 = item?.UQ1txt === statName ? item?.UQ1val : 0;
  const misc2 = item?.UQ2txt === statName ? item?.UQ2val : 0;
  return misc1 + misc2;
}

export const createItemsWithUpgrades = (charItems, stoneData, owner) => {
  return Array.from(Object.values(charItems)).reduce((res, item, itemIndex) => {
    const stoneResult = addStoneDataToEquip(items?.[item], stoneData?.[itemIndex]);
    return item ? [...res, {
      name: items?.[item]?.displayName, rawName: item,
      owner,
      ...(item === 'Blank' ? {} : { ...items?.[item], ...stoneResult })
    }] : res
  }, []);
}


export const getTotalStatFromEquipment = (arr, statKey, statName) => {
  return arr?.reduce((sum, item) => {
    if (item?.[statKey] && item?.[statKey] === statName) {
      return sum + item?.Amount;
    }
    return sum;
  }, 0);
}

export const findItemInInventory = (arr, itemName) => {
  if (!itemName) return {};
  return arr.reduce((res, item) => {
    const { name, owner, amount } = item;
    if (name === itemName) {
      if (res?.[owner]) {
        return { ...res, [owner]: { amount: res?.[owner]?.amount + 1 } };
      } else {
        return { ...res, [owner]: { amount } };
      }
    }
    return res;
  }, {});
};

export const flattenCraftObject = (craft) => {
  const uniques = {};
  const tempCraft = JSON.parse(JSON.stringify(craft));

  const flatten = (innerCraft, unique) => {
    return innerCraft?.reduce((result, nextCraft) => {
      result.push(nextCraft);
      if (nextCraft.materials) {
        result = result.concat(flatten(nextCraft?.materials, unique));
        nextCraft.materials = [];
      }
      if (uniques[nextCraft?.itemName]) {
        uniques[nextCraft?.itemName].itemQuantity += nextCraft?.itemQuantity;
      } else {
        uniques[nextCraft?.itemName] = nextCraft;
      }
      return result;
    }, []);
  }

  flatten(tempCraft?.materials, uniques);
  return Object.values(uniques);
};

export const findQuantityOwned = (items, itemName) => {
  const inventoryItem = findItemInInventory(items, itemName);
  return Object.entries(inventoryItem)?.reduce((res, [owner, { amount }]) => {
    return {
      amount: res?.amount + amount,
      owner: [...res?.owner, owner]
    };
  }, { amount: 0, owner: [] });
}