import { cleanUnderscore, tryToParse } from "../utility/helpers";
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
  return inventoryArr.reduce((res, itemName, index) => {
    const description = [1, 2, 3, 4, 5, 6, 7,
      8].reduce((res, num) => items?.[itemName]?.[`desc_line${num}`] ? res + `${items?.[itemName]?.[`desc_line${num}`]} ` : res, '')
    let misc = '';
    if (items?.[itemName]?.UQ1txt) {
      misc += items?.[itemName]?.UQ1txt;
    } else if (items?.[itemName]?.UQ2txt) {
      misc += ` ${items?.[itemName]?.UQ2txt}`;
    }
    return itemName !== 'LockedInvSpace' && itemName !== 'Blank' ? [
      ...res, {
        owner,
        name: items?.[itemName]?.displayName,
        type: items?.[itemName]?.itemType,
        subType: items?.[itemName]?.Type,
        rawName: itemName,
        amount: parseInt(inventoryQuantityArr?.[index]),
        misc: cleanUnderscore(misc.trim()),
        description: cleanUnderscore(description.trim())
      }
    ] : res
  }, []);
};