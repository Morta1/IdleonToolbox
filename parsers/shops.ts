import { tryToParse } from '@utility/helpers';
import { shops } from '@website-data';
import type { IdleonData } from './types';

export const getShops = (idleonData: IdleonData): any[][] => {
  const shopsRaw = idleonData?.ShopStock || tryToParse(idleonData?.ShopStock);
  return parseShops(shopsRaw);
}

export const parseShops = (shopsRaw: any[]): any[][] => {
  return shopsRaw.reduce((res: any[][], shopObject: any, shopIndex: number) => {
    const mapped = Object.values(shopObject)?.reduce((res: any[], item: any, itemIndex: number) => {
      const isIncluded = (shopMapping as any)?.[shopIndex]?.[itemIndex];
      const amount = parseInt(item) || 0;
      return amount > 0 && isIncluded ? [...res,
      {
        amount: item, ...shops[shopIndex]?.items?.[itemIndex],
        shopName: shops[shopIndex]?.name
      }] : res;
    }, [])
    return [...res, mapped]
  }, []);
}

export const getRawShopItems = (): Record<string, boolean> => {
  return (Object.entries(shops)?.reduce((res: any[], [key, { items }]: [string, any]) => {
    const filtered = items?.filter((_: any, index: number) => (shopMapping as any)?.[key]?.[index])?.map(({ rawName }: any) => rawName);
    return [...res, ...filtered]
  }, []) as any).toSimpleObject();
}

export const shopMapping: Record<number, Record<number, boolean>> = {
  0: ([3, 8, 13, 14, 17, 23] as any).toSimpleObject(), // 'Blunder_Hills'
  1: ([2, 8, 9, 13] as any).toSimpleObject(), // 'Encroaching_Forest_Villas'
  2: ([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 18, 19] as any).toSimpleObject(), // 'YumYum_Grotto'
  3: ([12] as any).toSimpleObject(), // 'Faraway_Piers'
  4: ([0, 1, 2, 8, 9, 10, 19, 22] as any).toSimpleObject(), // 'Frostbite_Towndra'
  5: ([2, 3, 4, 8, 9, 10, 11] as any).toSimpleObject(), // 'Hyperion_Nebula'
  6: ([0, 1, 2, 3, 4, 5] as any).toSimpleObject(), // 'Smolderin\'_Plateau',
  7: ([0, 1, 2, 3, 4, 5, 6, 7] as any).toSimpleObject(), // 'Spirited_Valley',
  8: ([2, 3, 5, 6, 7] as any).toSimpleObject() //'Shimmerfin_Deep'
};

export const shopNameMapping: Record<number, string> = {
  0: 'Blunder_Hills',
  1: 'Encroaching_Forest_Villas',
  2: 'YumYum_Grotto',
  3: 'Faraway_Piers',
  4: 'Frostbite_Towndra',
  5: 'Hyperion_Nebula',
  6: 'Smolderin\'_Plateau',
  7: 'Spirited_Valley',
  8: 'Shimmerfin_Deep'
}
