import { cleanUnderscore, tryToParse } from '@utility/helpers';
import { invStorage, items } from '@website-data';
import { addStoneDataToEquip } from './items';
import { getEventShopBonus, isBundlePurchased } from '@parsers/misc';
import { getUpgradeVaultBonus } from '@parsers/misc/upgradeVault';
import type { IdleonData, Account } from './types';

export interface StorageItem {
  owner: string;
  name: string;
  type: string;
  subType: string;
  rawName: string;
  amount: number;
  misc: string;
  description: string;
  maxUpgradeSlots: number;
  [key: string]: unknown;
}

export interface StorageChest {
  rawName: string;
  amount: number;
  unlocked: boolean;
  [key: string]: unknown;
}

export interface StorageSlots {
  value: number;
  breakdown: {
    statName: string;
    totalValue: number;
    categories: {
      name: string;
      sources: { name: string; value: string | number }[];
    }[];
  };
}

export interface StorageData {
  list: StorageItem[];
  slots: StorageSlots;
  storageChests: StorageChest[];
}

export const getStorage = (idleonData: IdleonData, name = 'storage', account: Account): StorageData => {
  const chestOrderRaw = tryToParse(idleonData?.ChestOrder);
  const chestQuantityRaw = tryToParse(idleonData?.ChestQuantity);
  const chestStoneData = tryToParse(idleonData?.CMm);
  const storageChests = tryToParse((idleonData as any).InvStorageUsed);
  return parseStorage(chestOrderRaw, chestQuantityRaw, name, chestStoneData, storageChests, account);
}

export const parseStorage = (chestOrderRaw: any, chestQuantityRaw: any, name: string, chestStoneData: any, rawStorageChests: any, account: Account): StorageData => {
  const list = getInventoryList(chestOrderRaw, chestQuantityRaw, name, chestStoneData);
  const storageChests = Object.entries(invStorage as Record<string, any>).map(([rawName, data]) => {
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

export const getStorageSlots = (storageChests: any[], account: Account): StorageSlots => {
  const baseStorageSlots = 54;
  const towerStorageSlots = 2 * (account as any)?.towers?.data?.[4]?.level;
  const bundleIBonus = isBundlePurchased(account?.bundles, 'bun_i') ? 8 : 0;
  const bundleCBonus = isBundlePurchased(account?.bundles, 'bun_c') ? 16 : 0;
  const bundleABonus = isBundlePurchased(account?.bundles, 'bon_a') ? 20 : 0;
  const chestsSlots = storageChests.reduce((res: number, { unlocked, amount }: any) => unlocked
    ? res + amount
    : res, 0);
  const gemshopMoreSpace = (account?.gemShopPurchases as any)?.find((_: any, index: number) => index === 109);
  const moreSpaceSlots = 9 * (gemshopMoreSpace ?? 0);
  const extraSlots = Math.round(12 * getEventShopBonus(account, 10)
    + 16 * getEventShopBonus(account, 11)
    + getUpgradeVaultBonus((account?.upgradeVault as any)?.upgrades, 33));

  const value = baseStorageSlots
    + towerStorageSlots
    + chestsSlots
    + bundleIBonus
    + bundleCBonus
    + bundleABonus
    + moreSpaceSlots
    + extraSlots;

  return {
    value,
    breakdown: {
      statName: "Storage Slots",
      totalValue: value,
      categories: [
        {
          name: "Base",
          sources: [
            { name: "Base", value: baseStorageSlots },
          ],
        },
        {
          name: "Bundles",
          sources: [
            { name: "AutoLoot", value: `${bundleIBonus} / 8` },
            { name: "Starter Pack", value: `${bundleCBonus} / 16` },
            { name: "Storage Ram", value: `${bundleABonus} / 20` },
          ],
        },
        {
          name: "Event shop",
          sources: [
            { name: "Storage Chest", value: `${12 * getEventShopBonus(account, 10)} / 12` },
            { name: "Storage Vault", value: `${16 * getEventShopBonus(account, 11)} / 16` },
          ],
        },
        {
          name: "Gem shop",
          sources: [
            { name: "More Storage Space", value: `${moreSpaceSlots} / 90` },
          ],
        },
        {
          name: "Other",
          sources: [
            { name: "Tower Storage", value: `${towerStorageSlots} / 50` },
            { name: "Chests", value: `${chestsSlots} / 336` },
            { name: "Upgrade Vault", value: `${getUpgradeVaultBonus((account?.upgradeVault as any)?.upgrades, 33)} / 24` },
          ],
        },
      ],
    }
  };
}

export const getInventoryList = (chestOrderRaw: any[], chestQuantityRaw: any[], name: string, chestStoneData: any): StorageItem[] => {
  return chestOrderRaw.reduce((res: StorageItem[], itemName: string, index: number) => {
    const data: any = addStoneDataToEquip(items?.[itemName], chestStoneData?.[index]);
    const description = [1, 2, 3, 4, 5, 6, 7,
      8].reduce((res: string, num: number) => (items?.[itemName] as Record<string, any>)?.[`desc_line${num}`]
        ? res + `${(items?.[itemName] as Record<string, any>)?.[`desc_line${num}`]} `
        : res, '')
    const maxUpgradeSlots = Math.max(data?.Upgrade_Slots_Left ?? 0, items?.[itemName]?.Upgrade_Slots_Left ?? 0);
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

export const calcTotalItemInStorage = (storage: StorageItem[] | undefined, itemName: string): number => {
  return storage?.reduce((sum, { rawName, amount }) => rawName === itemName ? sum + amount : sum, 0) ?? 0;
}
