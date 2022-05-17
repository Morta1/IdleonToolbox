import { items } from "../data/website-data";

export const getForge = (idleonData, account) => {
  const forgeOrderRaw = idleonData?.ForgeItemOrder;
  const forgeQuantityRaw = idleonData?.ForgeItemQuantity || idleonData?.ForgeItemQty;
  return parseForge(forgeOrderRaw, forgeQuantityRaw, account);
}

const parseForge = (forgeOrderRaw, forgeQuantityRaw, account) => {
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
  return forge;
}