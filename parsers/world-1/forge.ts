import { items } from '@website-data';
import { formatNum, growth, notateNumber, tryToParse } from '@utility/helpers';
import { getCardLevel } from '@parsers/cards';
import { getBribeBonus } from '@parsers/world-1/bribes';
import { getStampNode, getStampsBonusByStat } from '@parsers/world-1/stamps';
import { getArcadeBonus } from '@parsers/world-2/arcade';
import { getCosmoBonus } from '@parsers/world-5/hole';
import { getUpgradeVaultBonus } from '@parsers/misc/upgradeVault';
import { getAchievementStatus } from '@parsers/achievements';
import { isMasteryBonusUnlocked } from '@parsers/misc';
import { getMenagerieBoost } from '@parsers/world-7/menagerie';
import { calculateItemTotalAmount } from '@parsers/items';
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

// Lab[16] holds the storage refill switches; [0] is the forge's
const LAB_REFILL_ROW = 16;

export const getForge = (idleonData: IdleonData, account: Account) => {
  const forgeOrderRaw = idleonData?.ForgeItemOrder;
  const forgeQuantityRaw = (idleonData as any)?.ForgeItemQuantity || idleonData?.ForgeItemQty;
  const forgeLevels = (idleonData as any)?.FurnaceLevels || idleonData?.ForgeLV;
  const lab = tryToParse((idleonData as any)?.Lab) || (idleonData as any)?.Lab;
  const refillOn = Number(lab?.[LAB_REFILL_ROW]?.[0]) === 1;
  return parseForge(forgeOrderRaw, forgeQuantityRaw, forgeLevels, account, refillOn);
}

const BASE_FORGE_SPEED = 100;
const FORGE_SPEED_PER_LEVEL = 5;
const GODSHARD_CARD_SPEED = 30;
const MENAGERIE_FORGE_SPEED = 11;
const BRIMSTONE_MULTI = 1.5;
// ForgeStats(5) = 2 * the Puff Puff Go level
const PUFF_PUFF_CARD_CHANCE = 2;
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
    description: 'Increased chance for a card drop while AFK',
    costMulti: 1.33
  }
];

const parseForge = (forgeOrderRaw: any, forgeQuantityRaw: any, forgeLevels: any, account: Account, refillOn: boolean) => {
  const upgrades: ForgeUpgrade[] = upgradesData?.map((upgrade, index) => ({ ...upgrade, level: forgeLevels?.[index] ?? 0 }));
  const level = (index: number) => Number(upgrades?.[index]?.level) || 0;
  const brimestoneSlots = (account?.gemShopPurchases as any)?.find((value: any, index: number) => index === 104) ?? 0;
  const speed = getForgeSpeed(account, level(2));
  // game: FoodBonuses("<Effect>ForgeCooldownBonus") = 1 - GetBribeBonus("9") / 100
  const barrelUsePerCycle = 1 - getBribeBonus(account?.bribes, OIL_BRIBE) / 100;
  // game: ForgeEtcDetails("BarsMade") starts at 1 + ForgeStats(4) / 100, the Bar Bonanza level
  const barBonanza = 1 + level(4) / 100;
  const forgeRowItems = 3;
  const forgeSlots = upgradesData[0].maxLevel;
  const unlockedSlots = level(0);
  const storageList = (account as any)?.storage?.list;
  const inStorage = (rawName: string) => refillOn && rawName !== 'Blank' ? calculateItemTotalAmount(storageList, rawName, true, true) ?? 0 : 0;
  const slots = Array.from({ length: forgeSlots }, (_, index) => {
    const row = index * forgeRowItems;
    const [ore = 'Blank', barrel = 'Blank', bar = 'Blank'] = forgeOrderRaw?.slice(row, row + forgeRowItems) ?? [];
    const [oreQuantity = 0, barrelQuantity = 0, barQuantity = 0] = forgeQuantityRaw?.slice(row, row + forgeRowItems) ?? [];
    const oreItem = items?.[ore];
    const barrelItem = items?.[barrel];
    const isBrimestone = index < brimestoneSlots;
    const slotSpeed = getSpeed(speed.value, barrelItem, isBrimestone);
    const smelting = ore !== 'Blank' && Number(oreItem?.Cooldown) > 0 && index < unlockedSlots;
    // A cycle takes ForgeInterval / (4 * ForgeSpeeed) seconds; FoodBonuses("OreSmithTime") is 1
    const cyclesPerHour = smelting ? 3600 / (Number(oreItem?.Cooldown) / (4 * slotSpeed)) : 0;
    const hasBarrel = barrel !== 'Blank' && Number(barrelItem?.Cooldown) > 0;
    return {
      index, ore, barrel, bar, oreQuantity, barrelQuantity, barQuantity, oreItem, barrelItem, isBrimestone, slotSpeed,
      baseSlotSpeed: getSpeed(speed.value, null, isBrimestone),
      barsPerCycle: getBarsPerCycle(barBonanza, barrelItem, isBrimestone),
      cyclesPerHour,
      orePerHour: cyclesPerHour * Math.max(oreItem?.Amount ?? 1, 1),
      barrelPerHour: hasBarrel ? cyclesPerHour * Number(barrelItem?.Cooldown) * barrelUsePerCycle / 100 : 0
    };
  });
  // With the refill on, a slot that runs dry reloads that ore or barrel from storage (AFKcode "Forge"), so the slots
  // using the same item share what storage holds, each by how fast it uses it
  const storageShare = (rawName: string, perHour: number, key: 'ore' | 'barrel') => {
    if (!perHour) return 0;
    const rateKey = key === 'ore' ? 'orePerHour' : 'barrelPerHour';
    const total = slots.filter((slot) => slot[key] === rawName).reduce((sum, slot) => sum + slot[rateKey], 0);
    return total ? inStorage(rawName) * perHour / total : 0;
  };
  const list = slots.map((slot) => {
    const { index, ore, barrel, bar, oreQuantity, barrelQuantity, barQuantity, oreItem, barrelItem } = slot;
    const oreStorage = storageShare(ore, slot.orePerHour, 'ore');
    const barrelStorage = storageShare(barrel, slot.barrelPerHour, 'barrel');
    const timeTillEmpty = getTimeTillEmpty({
      oreItem,
      oreQuantity: oreQuantity + oreStorage,
      barrelItem,
      barrelQuantity: barrelQuantity + barrelStorage,
      barrelUsePerCycle,
      slotSpeed: slot.slotSpeed,
      baseSlotSpeed: slot.baseSlotSpeed
    });
    const barrelEffect = ['SpeedForge', 'DoubleBarsForge'].includes(String(barrelItem?.Effect)) ? barrelItem.Effect : null;
    const barrelLasts = slot.barrelPerHour && oreQuantity > 0 ? (barrelQuantity + barrelStorage) / slot.barrelPerHour * 3600 : 0;
    return {
      isBrimestone: slot.isBrimestone,
      locked: index >= unlockedSlots,
      speed: slot.slotSpeed,
      barsPerCycle: slot.barsPerCycle,
      barsPerHour: slot.cyclesPerHour * slot.barsPerCycle,
      orePerHour: slot.orePerHour,
      ore: {
        ...oreItem,
        name: oreItem?.displayName,
        rawName: ore,
        amount: oreQuantity,
        quantity: oreQuantity,
        inStorage: inStorage(ore),
        timeTillEmpty: timeTillEmpty * 1000,
        owner: 'forge'
      },
      barrel: {
        ...barrelItem,
        name: barrelItem?.displayName,
        rawName: barrel, amount: barrelQuantity, quantity: barrelQuantity, owner: 'forge',
        effect: barrelEffect,
        bonus: barrelEffect ? Number(barrelItem?.Amount) || 0 : 0,
        timeTillEmpty: barrelLasts * 1000
      },
      bar: {
        ...items?.[bar],
        name: items?.[bar]?.displayName,
        rawName: bar, amount: barQuantity, quantity: barQuantity, owner: 'forge'
      }
    };
  });
  const capacityUpgrade = growth('add', Math.round(level(1)), ORE_CAPACITY_GROWTH, ORE_CAPACITY_GROWTH, false);
  // What each upgrade gives now, as the game's forge screen words it
  const bonuses = [
    `${unlockedSlots} of ${forgeSlots} slots`,
    `+${formatNum(capacityUpgrade, 'whole')} base ore capacity`,
    `+${FORGE_SPEED_PER_LEVEL * level(2)}% forge speed`,
    `+${level(3)}% forge EXP`,
    `${level(4)}% chance for multi bars`,
    `+${PUFF_PUFF_CARD_CHANCE * level(5)}% card drop chance`
  ];
  const withCosts = upgrades.map((upgrade, index) => ({
    ...upgrade,
    bonus: bonuses[index],
    nextCost: getForgeUpgradeCost(upgrade.level, upgrade.costMulti),
    costToMax: getForgeCostToMax(upgrade.level, upgrade.maxLevel, upgrade.costMulti),
    totalCost: getForgeCostToMax(0, upgrade.maxLevel, upgrade.costMulti)
  }));
  return {
    list,
    upgrades: withCosts,
    refillOn,
    costToMaxAll: withCosts.reduce((sum, { costToMax }) => sum + costToMax, 0),
    stats: {
      slots: unlockedSlots,
      maxSlots: forgeSlots,
      speed,
      expGain: level(3),
      multiBarChance: level(4),
      cardChance: PUFF_PUFF_CARD_CHANCE * level(5)
    },
    oreCapacity: getForgeOreCapacity(account, level(1))
  };
}

// game: ForgeStats(2) = (5 * speed level + 30 * CardLv(Godshard) + 100) * (1 + Menagerie boost 11 / 100), a percent
export const getForgeSpeed = (account: Account, speedLevel: number): { value: number, breakdown: StatBreakdown } => {
  const upgrade = FORGE_SPEED_PER_LEVEL * speedLevel;
  const godshard = GODSHARD_CARD_SPEED * getCardLevel(account?.cards, 'Godshard');
  const menagerie = getMenagerieBoost(account, MENAGERIE_FORGE_SPEED);
  const value = Math.round((BASE_FORGE_SPEED + upgrade + godshard) * (1 + menagerie / 100));
  const tree = [
    sumGroup('Base speed', [
      flat('Base', BASE_FORGE_SPEED),
      flat('Forge Speed', upgrade),
      flat('Godshard card', godshard)
    ]),
    multiplier('Menagerie', 1 + menagerie / 100)
  ];
  return { value, breakdown: createBreakdown('Forge speed', `${value}%`, tree) };
}

// game: ForgeUpdateCosts(index); New Forge Slot (no costMulti) has its own curve
export const getForgeUpgradeCost = (level: number, costMulti?: number) => {
  if (!costMulti) return Math.round(200 * Math.pow(5.4, Math.pow(level, 0.83)));
  if (level < 5) return Math.round(50 * Math.pow(2.5, Math.pow(level, 0.51)));
  return Math.round(400 * Math.pow(costMulti, level - 5));
}

export const getForgeCostToMax = (level: number, maxLevel: number, costMulti?: number) => {
  let total = 0;
  for (let i = level; i < maxLevel; i++) total += getForgeUpgradeCost(i, costMulti);
  return total;
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
    additiveGroup(NUMBERED_GROUP, [getStampNode(account, { stat: 'ForgeCap' }, stamps)]),
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

// game: ForgeEtcDetails("BarsMade", slot): a double bars barrel adds its Amount as a percent, a brimstone slot x1.5
const getBarsPerCycle = (barBonanza: number, barrel: any, isBrimestone: boolean): number => {
  let bars = barBonanza;
  if (barrel?.Effect === 'DoubleBarsForge') {
    bars *= 1 + (barrel?.Amount ?? 0) / 100;
  }
  return isBrimestone ? bars * BRIMSTONE_MULTI : bars;
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
