import { tryToParse } from "../utility/helpers";
import { items } from "../data/website-data";

export const getStorage = (idleonData, name = 'storage') => {
  const chestOrderRaw = idleonData?.ChestOrder || tryToParse(idleonData?.ChestOrder);
  const chestQuantityRaw = idleonData?.ChestQuantity || tryToParse(idleonData?.ChestQuantity);
  return parseStorage(chestOrderRaw, chestQuantityRaw, name);
}

export const parseStorage = (chestOrderRaw, chestQuantityRaw, name) => {
  return getInventory(chestOrderRaw, chestQuantityRaw, name);
}


export const getInventory = (inventoryArr, inventoryQuantityArr, owner) => {
  return inventoryArr.reduce((res, itemName, index) => (itemName !== 'LockedInvSpace' && itemName !== 'Blank' ? [
    ...res, {
      owner,
      name: items?.[itemName]?.displayName,
      type: items?.[itemName]?.itemType,
      subType: items?.[itemName]?.Type,
      rawName: itemName,
      amount: parseInt(inventoryQuantityArr?.[index]),
    }
  ] : res), []);
};