import { items } from "../data/website-data";

export const getForge = (idleonData, account) => {
  const forgeOrderRaw = idleonData?.ForgeItemOrder;
  const forgeQuantityRaw = idleonData?.ForgeItemQuantity || idleonData?.ForgeItemQty;
  const forgeLevels = idleonData?.FurnaceLevels || idleonData?.ForgeLV;
  return parseForge(forgeOrderRaw, forgeQuantityRaw, forgeLevels, account);
}

const upgradesData = [
  {
    name: "New Forge Slot",
    maxLevel: 16,
    description: "extra slots to smelt ores",
    costMulti: undefined
  },
  {
    name: "Ore Capacity Boost",
    maxLevel: 50,
    description: "Increases max ores per slot",
    costMulti: 1.41
  },
  {
    name: "Forge Speed",
    maxLevel: 90,
    description: "Ores are turned into bars faster",
    costMulti: 1.2
  },
  {
    name: "Forge EXP Gain",
    maxLevel: 85,
    description: "Increased EXP gain from using the forge",
    costMulti: 1.21
  },
  {
    name: "Bar Bonanza",
    maxLevel: 75,
    description: "Increased chance to make an extra bar",
    costMulti: 1.25
  },
  {
    name: "Puff Puff Go",
    maxLevel: 60,
    description: "Increased chance for a card drop while afk",
    costMulti: 1.33
  }
];

const parseForge = (forgeOrderRaw, forgeQuantityRaw, forgeLevels, account) => {
  const upgrades = upgradesData?.map((upgrade, index) => ({ ...upgrade, level: forgeLevels[index] }));
  const brimestoneSlots = account?.gemShopPurchases?.find((value, index) => index === 104) ?? 0;
  const forgeRowItems = 3;
  let forge = [];
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
    forge = [...forge, {
      isBrimestone: index < brimestoneSlots,
      ore: { ...items?.[ore], rawName: ore, quantity: oreQuantity },
      barrel: { ...items?.[barrel], rawName: barrel, quantity: barrelQuantity },
      bar: { ...items?.[bar], rawName: bar, quantity: barQuantity }
    }]
    index++;
  }
  return {
    list: forge,
    upgrades
  };
}