import { items } from '@website-data';
import { getCardLevel } from '@parsers/cards';
import { getBribeBonus } from '@parsers/world-1/bribes';
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

const BASE_FORGE_SPEED = 100;
const FORGE_SPEED_PER_LEVEL = 5;
const GODSHARD_CARD_SPEED = 30;
const BRIMSTONE_MULTI = 1.5;
// AFKcode advances the progress by 4 * ForgeSpeeed per second, the active tick by ForgeSpeeed every quarter second
const SPEED_TICK_SHARE = 0.25;
const OIL_BRIBE = 'Fossil_Fuel_Legislation';

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
  const upgrades: ForgeUpgrade[] = upgradesData?.map((upgrade, index) => ({ ...upgrade, level: forgeLevels?.[index] ?? 0 }));
  const brimestoneSlots = (account?.gemShopPurchases as any)?.find((value: any, index: number) => index === 104) ?? 0;
  // game: ForgeStats(2) = 5 * speed level + 30 * CardLv(Godshard) + 100
  const forgeSpeed = Math.round(BASE_FORGE_SPEED + FORGE_SPEED_PER_LEVEL * upgrades?.[2]?.level
    + GODSHARD_CARD_SPEED * getCardLevel(account?.cards, 'Godshard'));
  // game: FoodBonuses("<Effect>ForgeCooldownBonus") = 1 - GetBribeBonus("9") / 100
  const barrelUsePerCycle = 1 - getBribeBonus(account?.bribes, OIL_BRIBE) / 100;
  const forgeRowItems = 3;
  const forgeSlots = upgradesData[0].maxLevel;
  let forge: any[] = [];
  for (let index = 0; index < forgeSlots; index++) {
    const row = index * forgeRowItems;
    const [ore = 'Blank', barrel = 'Blank', bar = 'Blank'] = forgeOrderRaw?.slice(
      row,
      row + forgeRowItems
    ) ?? [];
    const [oreQuantity = 0, barrelQuantity = 0, barQuantity = 0] = forgeQuantityRaw?.slice(
      row,
      row + forgeRowItems
    ) ?? [];
    const barrelItem = items?.[barrel];
    const oreItem = items?.[ore];
    const isBrimestone = index < brimestoneSlots;
    const slotSpeed = getSpeed(forgeSpeed, barrelItem, isBrimestone);
    const timeTillEmpty = getTimeTillEmpty({
      oreItem,
      oreQuantity,
      barrelItem,
      barrelQuantity,
      barrelUsePerCycle,
      slotSpeed,
      baseSlotSpeed: getSpeed(forgeSpeed, null, isBrimestone)
    });
    forge = [...forge, {
      isBrimestone,
      speed: slotSpeed,
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
  }
  return {
    list: forge,
    upgrades
  };
}

// game: ForgeSpeeed(slot). A speed barrel adds its Amount as a percent (FoodBonuses("SpeedForgeEffectBonus") is 1).
const getSpeed = (forgeSpeed: number, barrel: any, isBrimestone: boolean): number => {
  let t = Math.round(forgeSpeed) / 100;
  if (barrel?.Effect === 'SpeedForge') {
    t *= 1 + (barrel?.Amount ?? 0) / 100;
  }
  if (isBrimestone) {
    t *= BRIMSTONE_MULTI;
  }
  return t * SPEED_TICK_SHARE;
}

// Seconds until the slot stops smelting. A cycle takes ForgeInterval / (4 * ForgeSpeeed) seconds and eats a
// whole Amount of ore, so a leftover below Amount never smelts. A speed barrel only lasts
// quantity / (Cooldown * use) cycles (AFKcode "Forge"); the rest run at the barrel-less speed.
const getTimeTillEmpty = ({ oreItem, oreQuantity, barrelItem, barrelQuantity, barrelUsePerCycle, slotSpeed, baseSlotSpeed }: any): number => {
  const cycles = Math.floor(oreQuantity / Math.max(oreItem?.Amount ?? 1, 1));
  const interval = oreItem?.Cooldown ?? 0;
  const cycleTime = (speed: number) => interval / (4 * speed);
  if (barrelItem?.Effect !== 'SpeedForge' || !barrelItem?.Cooldown) {
    return cycles * cycleTime(slotSpeed);
  }
  const barrelCycles = Math.min(cycles, barrelQuantity / (barrelItem.Cooldown * barrelUsePerCycle / 100));
  return barrelCycles * cycleTime(slotSpeed) + (cycles - barrelCycles) * cycleTime(baseSlotSpeed);
}
