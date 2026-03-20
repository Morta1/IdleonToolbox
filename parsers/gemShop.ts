import { tryToParse } from '@utility/helpers';
import type { IdleonData } from './types';

export const getGemShop = (idleonData: IdleonData) => {
  const gemShopRaw = tryToParse(idleonData?.GemItemsPurchased) || idleonData?.GemItemsPurchased;
  return parseGemShop(gemShopRaw);
}

export const parseGemShop = (gemShopRaw: unknown) => {
  return gemShopRaw;
}
