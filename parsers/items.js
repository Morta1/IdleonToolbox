import { bonuses, items, itemsArray } from '@website-data';
import { cleanUnderscore } from '@utility/helpers';
import { getGalleryBonus } from './world-7/gallery';
import { getHatRackBonus } from './world-3/hatRack';

export const addStoneDataToEquip = (baseItem, stoneData) => {
  if (!baseItem || !stoneData) return {};

  // Initialize an array to track stat changes
  const changes = [];

  const result = Object.keys(stoneData)?.reduce((res, statName) => {
    if (statName === 'UQ1txt' || statName === 'UQ2txt') {
      return { ...res, [statName]: baseItem?.[statName] || stoneData?.[statName] };
    }

    const baseItemStat = baseItem?.Type === 'KEYCHAIN' ? 0 : baseItem?.[statName];
    const stoneStat = stoneData?.[statName];
    let sum = baseItemStat;

    if (isNaN(stoneStat)) return { ...res, [statName]: stoneStat };

    const shouldIgnore = (stoneData?.['UQ1txt'] && baseItem?.Type !== 'KEYCHAIN' && baseItem?.['UQ1txt'] !== stoneData?.['UQ1txt']);
    const stoneEffect = shouldIgnore ? 0 : stoneStat;

    // Track the change if the stone is actually modifying a stat (ignoring UQ1txt and UQ2txt)
    if (stoneEffect !== 0 && statName !== 'UQ1txt' && statName !== 'UQ2txt') {
      changes.push({ [statName]: stoneEffect });
    }

    sum = (baseItemStat || 0) + stoneEffect;
    return { ...res, [statName]: parseFloat(sum) };
  }, {});

  // Add the changes array to the result
  return { ...result, changes };

}

export const calculateItemTotalAmount = (array, itemName, exact, isRawName = false) => {
  return array?.reduce((result, item) => {
    if (exact) {
      if (itemName === (isRawName ? item?.rawName : item?.name)) {
        result += item?.amount;
      }
    }
    else {
      if ((isRawName ? item?.rawName?.includes(itemName) : item?.name?.includes(itemName))) {
        result += item?.amount;
      }
    }
    return result;
  }, 0);
}

export const getStatsFromGear = (character, bonusIndex, account) => {
  if (!character) return { value: 0, breakdown: [] };
  const { equipment, tools } = character || {};

  // Chip bonuses for equipment slots
  const silkroadMotherboard = account?.lab?.playersChips?.[character?.playerId]?.find((chip) => chip.index === 16) ?? 0;
  const silkroadSoftware = account?.lab?.playersChips?.[character?.playerId]?.find((chip) => chip.index === 17) ?? 0;
  const silkroadProcessor = account?.lab?.playersChips?.[character?.playerId]?.find((chip) => chip.index === 18) ?? 0;

  // Resolve bonus name from index if needed
  const bonusName = isNaN(bonusIndex) ? bonusIndex : bonuses?.etcBonuses?.[bonusIndex];

  // Items tracked in gallery (TROPHY, NAMETAG) or hatRack (PREMIUM_HELMET) should be skipped
  // Their bonuses come from getGalleryBonus/getHatRackBonus instead
  const isGalleryOrHatRackItem = (item) => {
    const type = item?.Type;
    return type === 'TROPHY' || type === 'NAMETAG' || type === 'PREMIUM_HELMET' || type === 'REPLICA_TROPHY' || type === 'REPLICA_NAMETAG';
  };

  // Calculate from equipment
  const equipmentTotal = equipment?.reduce((total, item, index) => {
    if (isGalleryOrHatRackItem(item)) {
      return total; // Skip - bonus comes from gallery/hatRack
    }
    const statValue = getStatFromEquipment(item, bonusName);
    const chipMultiplier = ((index === 3 && silkroadProcessor) || (index === 10 && silkroadMotherboard) || (index === 9 && silkroadSoftware)) ? 2 : 1;
    return total + (statValue * chipMultiplier);
  }, 0) || 0;

  // Calculate from tools (no chip multipliers for tools)
  const toolsTotal = tools?.reduce((total, item) => {
    if (isGalleryOrHatRackItem(item)) {
      return total; // Skip - bonus comes from gallery/hatRack
    }
    return total + getStatFromEquipment(item, bonusName);
  }, 0) || 0;

  // Get gallery and hatRack bonuses for tracked item types
  const galleryBonus = getGalleryBonus(account, bonusName) || 0;
  const hatRackBonus = getHatRackBonus(account, bonusName) || 0;

  const gearTotal = equipmentTotal + toolsTotal;
  const value = gearTotal + galleryBonus + hatRackBonus;

  return {
    value,
    breakdown: [
      { name: '' },
      { title: cleanUnderscore(bonusName)?.toLowerCase()?.capitalizeAllWords() },
      { name: '' },
      { name: 'Equipment', value: gearTotal },
      { name: 'Gallery', value: galleryBonus },
      { name: 'Hat Rack', value: hatRackBonus },
      { name: '' }
    ],
    newBreakdown: {
      name: cleanUnderscore(bonusName)?.toLowerCase()?.capitalizeAllWords(),
      sources: [
        { name: 'Equipment', value: gearTotal },
        { name: 'Gallery', value: galleryBonus },
        { name: 'Hat Rack', value: hatRackBonus },
      ]
    }
  };
}

export const getStatFromEquipment = (item, statName) => {
  const misc1 = item?.UQ1txt === statName ? item?.UQ1val : 0;
  const misc2 = item?.UQ2txt === statName ? item?.UQ2val : 0;
  if (item?.[statName]) {
    return item?.[statName]
  }
  return (misc1 ?? 0) + (misc2 ?? 0);
}

export const createItemsWithUpgrades = (charItems, stoneData, owner) => {

  return Array.from(Object.values(charItems)).reduce((res, item, itemIndex) => {
    const stoneResult = addStoneDataToEquip(items?.[item], stoneData?.[itemIndex]);
    let misc = '';
    const maxUpgradeSlots = Math.max(stoneResult?.Upgrade_Slots_Left, items?.[item]?.Upgrade_Slots_Left);
    const it = { ...items?.[item], ...stoneResult, maxUpgradeSlots };
    if (it?.UQ1txt) {
      misc += it?.UQ1txt;
    }
    if (it?.UQ2txt) {
      misc += ` ${it?.UQ2txt}`;
    }
    const resultItem = {
      name: items?.[item]?.displayName, rawName: item,
      owner,
      ...(item === 'Blank' ? {} : it),
      misc
    };
    if (resultItem?.Premiumified) {
      if (!resultItem.UQ1txt) {
        delete resultItem.UQ1val;
      }
      if (!resultItem.UQ2txt) {
        delete resultItem.UQ2val;
      }
      // delete resultItem.UQ1txt;
      // delete resultItem.UQ2txt;
      delete resultItem.Defence;
      delete resultItem.Weapon_Power;
      delete resultItem.Reach;
    }
    return item ? [...res, resultItem] : res
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
      }
      else {
        return { ...res, [owner]: { amount } };
      }
    }
    return res;
  }, {});
};

export const findItemByDescriptionInInventory = (arr, desc) => {
  if (!desc) return {};
  const relevantItems = arr.filter(({
    misc,
    description
  }) => cleanUnderscore(description)?.toLowerCase()?.includes(desc?.toLowerCase()) || cleanUnderscore(misc)?.toLowerCase()?.includes(desc?.toLowerCase()), []);
  return relevantItems?.reduce((res, item) => {
    const itemExistsIndex = res?.findIndex((i) => i?.rawName === item?.rawName);
    const itemExists = res?.[itemExistsIndex];
    if (itemExists) {
      const ownerExist = itemExists?.owners?.includes(item?.owner);
      const owners = ownerExist ? itemExists?.owners : [...itemExists?.owners,
      item?.owner]
      if (itemExists?.misc === item?.misc) {
        res?.splice(itemExistsIndex, 1);
      }
      res = [...res, { ...item, owners: owners }]
    }
    else {
      res = [...res, { ...item, owners: [item?.owner] }]
    }
    return res;
  }, []);
};

export const flattenCraftObject = (craft) => {
  if (!craft) return [];
  const uniques = {};
  const tempCraft = structuredClone((craft));

  const flatten = (innerCraft, unique) => {
    return innerCraft?.reduce((result, nextCraft) => {
      result.push(nextCraft);
      if (nextCraft.materials) {
        result = result.concat(flatten(nextCraft?.materials, unique));
        nextCraft.materials = [];
      }
      if (uniques[nextCraft?.itemName]) {
        uniques[nextCraft?.itemName].itemQuantity += nextCraft?.itemQuantity;
      }
      else {
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

export const addEquippedItems = (characters, shouldInclude) => {
  return shouldInclude ? characters?.reduce((res, {
    tools,
    equipment,
    food
  }) => [...res, ...(tools || []), ...(equipment || []), ...(food || [])], [])
    .filter(({ rawName }) => rawName !== 'Blank')
    .map((item) => item?.amount ? item : { ...item, amount: 1 }) : [];
};

export const getAllItems = (characters, account) => {
  const charItems = characters?.reduce((res, { inventory = [] }) => [...res, ...inventory], []);
  const fromForge = account?.forge?.list?.reduce((acc, { bar, barrel, ore }) => ([...acc, bar, barrel, ore]), []);
  return [...(charItems || []), ...(account?.storage?.list || []), ...(fromForge || [])];
}

export const mergeItemsByOwner = (items) => {
  const mergedItems = {};

  items.forEach(item => {
    if (!item.displayName) return;
    const key = item.owner + item.displayName;
    if (mergedItems[key]) {
      mergedItems[key].amount += item.amount;
    }
    else {
      mergedItems[key] = { ...item };
    }
  });
  return Object.values(mergedItems);
}

export const getAllTools = () => {
  const pickaxes = itemsArray?.filter(({ rawName }) => rawName?.match(/EquipmentTools[0-9]+/))
    ?.filter(({ rawName }) => rawName !== 'EquipmentTools13' && rawName !== 'EquipmentTools10');
  const hatchets = itemsArray?.filter(({ rawName }) => rawName?.match(/EquipmentToolsHatchet[0-9]+/))
    ?.filter(({ rawName }) => rawName !== 'EquipmentToolsHatchet0' &&
      rawName !== 'EquipmentToolsHatchet3' && rawName !== 'EquipmentToolsHatchet11');
  const fishingRods = itemsArray?.filter(({ rawName }) => rawName?.match(/FishingRod[0-9]+/))
    ?.filter(({ rawName }) => rawName !== 'FishingRod1');
  const catchingNets = itemsArray?.filter(({ rawName }) => rawName?.match(/CatchingNet[0-9]+/))
    ?.filter(({ rawName }) => rawName !== 'CatchingNet1');
  const traps = itemsArray?.filter(({ rawName }) => rawName?.match(/TrapBoxSet[0-9]+/));
  const skulls = itemsArray?.filter(({ rawName }) => rawName?.match(/WorshipSkull[0-9]+/))
    ?.filter(({ rawName }) => rawName !== 'WorshipSkull8');
  const dnaGuns = itemsArray?.filter(({ rawName }) => rawName?.match(/DNAgun[0-9]+/));
  return [pickaxes, hatchets, fishingRods, catchingNets, traps, skulls, dnaGuns]
}

export const calcTrophiesFound = (looty) => {
  return looty?.lootyRaw?.reduce((sum, itemName) => sum + ((String(itemName || '')?.includes('Trophy'))
    ? 1
    : 0), 0)
}
export const calcObolsFound = (looty) => {
  return looty?.lootyRaw?.reduce((sum, itemName) => sum + ((String(itemName || '')?.includes('Obol'))
    ? 1
    : 0), 0)
}

export const calcNametagsFound = (looty) => {
  return looty?.lootyRaw?.reduce((sum, itemName) => sum + ((String(itemName || '')?.includes('EquipmentNametag'))
    ? 1
    : 0), 0)
}