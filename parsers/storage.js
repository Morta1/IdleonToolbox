import { cleanUnderscore, tryToParse } from '../utility/helpers';
import { items } from '../data/website-data';
import { addStoneDataToEquip } from './items';

export const getStorage = (idleonData, name = 'storage') => {
  const chestOrderRaw = tryToParse(idleonData?.ChestOrder);
  const chestQuantityRaw = tryToParse(idleonData?.ChestQuantity);
  const chestStoneData = tryToParse(idleonData?.CMm);
  return parseStorage(chestOrderRaw, chestQuantityRaw, name, chestStoneData);
}

export const parseStorage = (chestOrderRaw, chestQuantityRaw, name, chestStoneData) => {
  return getInventory(chestOrderRaw, chestQuantityRaw, name, chestStoneData);
}

export const getInventory = (inventoryArr, inventoryQuantityArr, owner, chestStoneData) => {
  return inventoryArr.reduce((res, itemName, index) => {
    const data = addStoneDataToEquip(items?.[itemName], chestStoneData?.[index]);
    const description = [1, 2, 3, 4, 5, 6, 7,
      8].reduce((res, num) => items?.[itemName]?.[`desc_line${num}`]
      ? res + `${items?.[itemName]?.[`desc_line${num}`]} `
      : res, '')
    const maxUpgradeSlots = Math.max(data?.Upgrade_Slots_Left, items?.[itemName]?.Upgrade_Slots_Left);
    const it = { ...items?.[itemName], ...data, maxUpgradeSlots };
    let misc = '';
    if (it?.UQ1txt) {
      misc += it?.UQ1txt;
    }
    if (it?.UQ2txt) {
      misc += ` ${it?.UQ2txt}`;
    }
    return itemName !== 'LockedInvSpace' && itemName !== 'Blank' ? [
      ...res, {
        ...it,
        owner,
        name: it?.displayName,
        type: it?.itemType,
        subType: it?.Type,
        rawName: itemName,
        amount: parseInt(inventoryQuantityArr?.[index]),
        misc: cleanUnderscore(misc.trim()),
        description: cleanUnderscore(description.trim())
      }
    ] : res
  }, []);
};

export const calcTotalItemInStorage = (storage, itemName) => {
  return storage?.reduce((sum, { rawName, amount }) => rawName === itemName ? sum + amount : sum, 0);
}