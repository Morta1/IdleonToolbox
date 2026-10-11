import { cleanUnderscore, tryToParse } from '@utility/helpers';
import { invStorage, items } from '@website-data';
import { addStoneDataToEquip } from './items';
import { getEventShopBonus, isBundlePurchased } from '@parsers/misc';
import { getUpgradeVaultBonus } from '@parsers/misc/upgradeVault';
import type { IdleonData, Account } from './types';
import { createBreakdown, flat, info, sumGroup } from '@parsers/breakdown';
import type { StatBreakdown } from '@parsers/breakdown';

export interface StorageItem {
  owner: string;
  name: string;
  type: string;
  subType: string;
  rawName: string;
  slot: number;
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
  breakdown: StatBreakdown;
}

export interface StorageData {
  list: StorageItem[];
  slots: StorageSlots;
  storageChests: StorageChest[];
  // Persistent greenstack registry (rawNames). Greenstacks became permanent in 2.3.508:
  // once an item hits 10M+ in the Storage Chest it stays registered even if the count later drops.
  greenStacks: string[];
}

export const getStorage = (idleonData: IdleonData, name = 'storage', account: Account): StorageData => {
  const chestOrderRaw = tryToParse(idleonData?.ChestOrder);
  const chestQuantityRaw = tryToParse(idleonData?.ChestQuantity);
  const chestStoneData = tryToParse(idleonData?.CMm);
  const storageChests = tryToParse((idleonData as any)?.InvStorageUsed);
  const greenStacks = tryToParse((idleonData as any)?.GreenStacks) || (idleonData as any)?.GreenStacks || [];
  return { ...parseStorage(chestOrderRaw, chestQuantityRaw, name, chestStoneData, storageChests, account), greenStacks };
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
    storageChests,
    greenStacks: []
  }
}

// No unit, so a source still at 0 stays listed with what it can reach
const ownedOfMax = (name: string, owned: number, max: number) => info(name, owned, { formatted: `${owned} / ${max}` });

export const getStorageSlots = (storageChests: any[], account: Account): StorageSlots => {
  const baseStorageSlots = 54;
  const towerStorageSlots = 2 * ((account as any)?.towers?.data?.[4]?.level ?? 0);
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

  const storageChestSlots = 12 * getEventShopBonus(account, 10);
  const storageVaultSlots = 16 * getEventShopBonus(account, 11);
  const upgradeVaultSlots = getUpgradeVaultBonus((account?.upgradeVault as any)?.upgrades, 33);

  return {
    value,
    breakdown: createBreakdown('Storage Slots', value, [
      flat('Base', baseStorageSlots),
      sumGroup('Bundles', [
        ownedOfMax('AutoLoot', bundleIBonus, 8),
        ownedOfMax('Starter Pack', bundleCBonus, 16),
        ownedOfMax('Storage Ram', bundleABonus, 20)
      ]),
      sumGroup('Event shop', [
        ownedOfMax('Storage Chest', storageChestSlots, 12),
        ownedOfMax('Storage Vault', storageVaultSlots, 16)
      ]),
      sumGroup('Gem shop', [
        ownedOfMax('More Storage Space', moreSpaceSlots, 90)
      ]),
      sumGroup('Other', [
        ownedOfMax('Tower Storage', towerStorageSlots, 50),
        ownedOfMax('Chests', chestsSlots, 336),
        ownedOfMax('Upgrade Vault', upgradeVaultSlots, 24),
        flat('Rounded', extraSlots - storageChestSlots - storageVaultSlots - upgradeVaultSlots)
      ])
    ])
  };
}

export const getInventoryList = (chestOrderRaw: any[] | undefined, chestQuantityRaw: any[], name: string, chestStoneData: any): StorageItem[] => {
  return (chestOrderRaw ?? []).reduce((res: StorageItem[], itemName: string, index: number) => {
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
        // The raw index, not the position in this list - blanks and locked slots are dropped, so
        // only this survives as the item's actual place in the bag or chest.
        slot: index,
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

// game: "_ItemsAndStorageOWNED" - the chest plus the logged-in character's InventoryOrder. There is
// no logged-in character here, so every character's inventory counts; on an account-wide view that
// is the total the player owns, and it only differs from the in-game figure when the same item sits
// on more than one character at once.
export const calcTotalItemOwned = (storage: { list?: StorageItem[] } | undefined, characters: { inventory?: StorageItem[] }[] | undefined, itemName: string): number => {
  const inChest = calcTotalItemInStorage(storage?.list, itemName);
  const inInventories = characters?.reduce((sum, { inventory } = {}) => sum + calcTotalItemInStorage(inventory, itemName), 0) ?? 0;
  return inChest + inInventories;
}
