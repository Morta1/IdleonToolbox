import { items } from '@website-data';
import type { IdleonData, Account } from '../types';

interface ForgeUpgradeData {
  name: string;
  maxLevel: number;
  description: string;
  costMulti: number | undefined;
}

interface ForgeUpgrade extends ForgeUpgradeData {
  level: number;
}

export const getForge = (idleonData: IdleonData, account: Account) => {
  const forgeOrderRaw = idleonData?.ForgeItemOrder;
  const forgeQuantityRaw = (idleonData as any)?.ForgeItemQuantity || idleonData?.ForgeItemQty;
  const forgeLevels = (idleonData as any)?.FurnaceLevels || idleonData?.ForgeLV;
  return parseForge(forgeOrderRaw, forgeQuantityRaw, forgeLevels, account);
}

const upgradesData: ForgeUpgradeData[] = [
  {
    name: 'New Forge Slot',
    maxLevel: 16,
    description: 'extra slots to smelt ores',
    costMulti: undefined
  },
  {
    name: 'Ore Capacity Boost',
    maxLevel: 50,
    description: 'Increases max ores per slot',
    costMulti: 1.41
  },
  {
    name: 'Forge Speed',
    maxLevel: 90,
    description: 'Ores are turned into bars faster',
    costMulti: 1.2
  },
  {
    name: 'Forge EXP Gain',
    maxLevel: 85,
    description: 'Increased EXP gain from using the forge',
    costMulti: 1.21
  },
  {
    name: 'Bar Bonanza',
    maxLevel: 75,
    description: 'Increased chance to make an extra bar',
    costMulti: 1.25
  },
  {
    name: 'Puff Puff Go',
    maxLevel: 60,
    description: 'Increased chance for a card drop while afk',
    costMulti: 1.33
  }
];

const parseForge = (forgeOrderRaw: any, forgeQuantityRaw: any, forgeLevels: any, account: Account) => {
  const upgrades: ForgeUpgrade[] = upgradesData?.map((upgrade, index) => ({ ...upgrade, level: forgeLevels[index] }));
  const brimestoneSlots = (account?.gemShopPurchases as any)?.find((value: any, index: number) => index === 104) ?? 0;
  const forgeRowItems = 3;
  let forge: any[] = [];
  let index = 0;
  for (let row = 0; row < forgeOrderRaw?.length; row += 3) {
    const [ore, barrel, bar] = forgeOrderRaw?.slice(
      row,
      row + forgeRowItems
    );
    const [oreQuantity, barrelQuantity, barQuantity] = forgeQuantityRaw.slice(
      row,
      row + forgeRowItems
    );
    const barrelItem = items?.[barrel];
    const oreItem = items?.[ore];
    const isBrimestone = index < brimestoneSlots;
    const forgeSpeed = Math.round(100 + 5 * upgrades?.[2]?.level);
    const slotSpeed = getSpeed(forgeSpeed, barrelItem, isBrimestone);
    const timeTillEmpty = Math.round(oreQuantity / (oreItem?.Amount ?? 1)) * ((oreItem?.Cooldown ?? 0) / (4 * slotSpeed));
    forge = [...forge, {
      isBrimestone,
      ore: {
        ...oreItem,
        name: oreItem?.displayName,
        rawName: ore,
        amount: oreQuantity,
        quantity: oreQuantity,
        timeTillEmpty: timeTillEmpty * 1000,
        owner: 'forge'
      },
      barrel: {
        ...barrelItem,
        name: barrelItem?.displayName,
        rawName: barrel, amount: barrelQuantity, quantity: barrelQuantity, owner: 'forge'
      },
      bar: {
        ...items?.[bar],
        name: items?.[bar]?.displayName,
        rawName: bar, amount: barQuantity, quantity: barQuantity, owner: 'forge'
      }
    }]
    index++;
  }
  return {
    list: forge,
    upgrades
  };
}

const getSpeed = (forgeSpeed: number, barrel: any, isBrimestone: boolean): number => {
  let t = Math.round(forgeSpeed) / 100;
  t *= barrel?.Effect === 'SpeedForge' ? barrel?.Amount : 1;
  if (isBrimestone) {
    t *= 1.5;
  }
  return t * .25;
}
