import { cleanUnderscore, tryToParse } from '../utility/helpers';
import { invStorage, items } from '../data/website-data';
import { addStoneDataToEquip } from './items';
import { getEventShopBonus, isBundlePurchased } from '@parsers/misc';
import { getUpgradeVaultBonus } from '@parsers/misc/upgradeVault';

export const getStorage = (idleonData, name = 'storage', account) => {
  const chestOrderRaw = tryToParse(idleonData?.ChestOrder);
  const chestQuantityRaw = tryToParse(idleonData?.ChestQuantity);
  const chestStoneData = tryToParse(idleonData?.CMm);
  const storageChests = tryToParse(idleonData.InvStorageUsed);
  return parseStorage(chestOrderRaw, chestQuantityRaw, name, chestStoneData, storageChests, account);
}

export const parseStorage = (chestOrderRaw, chestQuantityRaw, name, chestStoneData, rawStorageChests, account) => {
  const list = getInventoryList(chestOrderRaw, chestQuantityRaw, name, chestStoneData);
  const storageChests = Object.entries(invStorage).map(([rawName, data]) => {
    return {
      rawName,
      ...data,
      amount: parseFloat(rawStorageChests?.[data?.ID] ?? 0),
      unlocked: Object.prototype.hasOwnProperty.call(rawStorageChests ?? {}, data?.ID)
    }
  });
  const slots = getStorageSlots(storageChests, account);
  return {
    list,
    slots,
    storageChests
  }
}

export const getStorageSlots = (storageChests, account) => {
  const baseStorageSlots = 54;
  const towerStorageSlots = 2 * account?.towers?.data?.[4]?.level;
  const bundleIBonus = isBundlePurchased(account?.bundles, 'bun_i') ? 8 : 0;
  const bundleCBonus = isBundlePurchased(account?.bundles, 'bun_c') ? 16 : 0;
  const bundleABonus = isBundlePurchased(account?.bundles, 'bon_a') ? 20 : 0;
  const chestsSlots = storageChests.reduce((res, { unlocked, amount }) => unlocked
    ? res + amount
    : res, 0);
  const gemshopMoreSpace = account?.gemShopPurchases?.find((_, index) => index === 109);
  const moreSpaceSlots = 9 * (gemshopMoreSpace ?? 0);
  const extraSlots = Math.round(12 * getEventShopBonus(account, 10)
    + 16 * getEventShopBonus(account, 11)
    + getUpgradeVaultBonus(account?.upgradeVault?.upgrades, 33));

  return {
    value: baseStorageSlots
      + towerStorageSlots
      + chestsSlots
      + bundleIBonus
      + bundleCBonus
      + bundleABonus
      + moreSpaceSlots
      + extraSlots,
    breakdown: [
      { name: 'Base', value: baseStorageSlots },
      { title: 'Bundles' },
      { name: 'AutoLoot', value: `${bundleIBonus} / 8` },
      { name: 'Starter Pack', value: `${bundleCBonus} / 16` },
      { name: 'Storage Ram', value: `${bundleABonus} / 20` },
      { title: 'Event shop' },
      { name: 'Storage Chest', value: `${12 * getEventShopBonus(account, 10)} / 12` },
      { name: 'Storage Vault', value: `${16 * getEventShopBonus(account, 11)} / 16` },
      { title: 'Gem shop' },
      { name: 'More Storage Space', value: `${moreSpaceSlots} / 90` },
      { title: 'Other' },
      { name: 'Tower Storage', value: `${towerStorageSlots} / 50` },
      { name: 'Chests', value: `${chestsSlots} / 336` },
      { name: 'Upgrade Vault', value: `${getUpgradeVaultBonus(account?.upgradeVault?.upgrades, 33)} / 24` }
    ]
  };
}


export const getInventoryList = (chestOrderRaw, chestQuantityRaw, name, chestStoneData) => {
  return chestOrderRaw.reduce((res, itemName, index) => {
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
        owner: name,
        name: it?.displayName,
        type: it?.itemType,
        subType: it?.Type,
        rawName: itemName,
        amount: parseInt(chestQuantityRaw?.[index]),
        misc: cleanUnderscore(misc.trim()),
        description: cleanUnderscore(description.trim())
      }
    ] : res
  }, [])
}

export const calcTotalItemInStorage = (storage, itemName) => {
  return storage?.reduce((sum, { rawName, amount }) => rawName === itemName ? sum + amount : sum, 0);
}