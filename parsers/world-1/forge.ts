import { items } from '@website-data';
import { growth, notateNumber } from '@utility/helpers';
import { getCardLevel } from '@parsers/cards';
import { getBribeBonus } from '@parsers/world-1/bribes';
import { getStampsBonusByStat } from '@parsers/world-1/stamps';
import { getArcadeBonus } from '@parsers/world-2/arcade';
import { getCosmoBonus } from '@parsers/world-5/hole';
import { getUpgradeVaultBonus } from '@parsers/misc/upgradeVault';
import { getAchievementStatus } from '@parsers/achievements';
import { isMasteryBonusUnlocked } from '@parsers/misc';
import { additiveGroup, createBreakdown, flat, multiplier, NUMBERED_GROUP, percent, sumGroup } from '@parsers/breakdown';
import type { StatBreakdown } from '@parsers/breakdown';
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

const BASE_ORE_CAPACITY = 20;
// ArbitraryCode5Inputs("add", 10, 10, level) for the Ore Capacity Boost upgrade
const ORE_CAPACITY_GROWTH = 10;
const GODSHARD_CARD_CAPACITY = 30;
const ORE_CAPACITY_CAP = 2e9;
const BEEG_BEEG_FORGE = { t: 2, i: 1 };
const ORE_CAPACITY_ARCADE_BONUS = 26;
const CAPACITY_BRIBE = 'Forge_Cap_Smuggling';
const BEEG_FORGE_VAULT_UPGRADE = 26;
const VITAMIN_D_LICIOUS_ACHIEVEMENT = 281;
const VITAMIN_D_LICIOUS_CAPACITY = 50;
// RiftStuff("RiftSkillBonus,1", 1): smithing's second mastery tier
const SMITHING_MASTERY_TIER = 1;
const SMITHING_MASTERY_CAPACITY = 25;

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
    upgrades,
    oreCapacity: getForgeOreCapacity(account, upgrades?.[1]?.level ?? 0)
  };
}

// game: ForgeStats(1), the MAX_ORE_CAPACITY every slot fills up to (also caps the storage refill)
export const getForgeOreCapacity = (account: Account, capacityLevel: number): { value: number, breakdown: StatBreakdown } => {
  const cosmo = getCosmoBonus({ majik: (account as any)?.hole?.holesObject?.idleonMajiks, ...BEEG_BEEG_FORGE });
  const upgrade = growth('add', Math.round(capacityLevel), ORE_CAPACITY_GROWTH, ORE_CAPACITY_GROWTH, false);
  const arcade = getArcadeBonus((account as any)?.arcade?.shop, ORE_CAPACITY_ARCADE_BONUS)?.bonus ?? 0;
  const godshard = GODSHARD_CARD_CAPACITY * getCardLevel(account?.cards, 'Godshard');
  const stamps = getStampsBonusByStat(account, 'ForgeCap') ?? 0;
  const bribe = getBribeBonus(account?.bribes, CAPACITY_BRIBE);
  const vault = getUpgradeVaultBonus((account as any)?.upgradeVault?.upgrades, BEEG_FORGE_VAULT_UPGRADE);
  const achievement = VITAMIN_D_LICIOUS_CAPACITY * getAchievementStatus(account?.achievements, VITAMIN_D_LICIOUS_ACHIEVEMENT);
  const mastery = SMITHING_MASTERY_CAPACITY * isMasteryBonusUnlocked(account?.rift,
    (account as any)?.totalSkillsLevels?.smithing?.rank, SMITHING_MASTERY_TIER);
  const tree = [
    multiplier('Beeg Beeg Forge', cosmo),
    sumGroup('Base capacity', [
      flat('Base', BASE_ORE_CAPACITY),
      flat('Ore Capacity Boost', upgrade)
    ]),
    additiveGroup(NUMBERED_GROUP, [
      percent('Arcade shop', arcade),
      percent('Godshard card', godshard)
    ]),
    additiveGroup(NUMBERED_GROUP, [percent('Stamps', stamps)]),
    additiveGroup(NUMBERED_GROUP, [
      percent('Bribe', bribe),
      percent('Upgrade vault', vault)
    ]),
    additiveGroup(NUMBERED_GROUP, [
      percent('Achievement', achievement),
      percent('Smithing mastery', mastery)
    ])
  ];
  const value = Math.min(ORE_CAPACITY_CAP, cosmo * (BASE_ORE_CAPACITY + upgrade)
    * (1 + (arcade + godshard) / 100)
    * (1 + stamps / 100)
    * (1 + (bribe + vault) / 100)
    * (1 + (achievement + mastery) / 100));
  return { value, breakdown: createBreakdown('Max ore capacity', notateNumber(value), tree, { max: ORE_CAPACITY_CAP }) };
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
