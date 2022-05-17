import { tryToParse } from "../utility/helpers";

export const getGemShop = (idleonData) => {
  const gemShopRaw = tryToParse(idleonData?.GemItemsPurchased) || idleonData?.GemItemsPurchased;
  return parseGemShop(gemShopRaw);
}

export const parseGemShop = (gemShopRaw) => {
  return gemShopRaw;
}