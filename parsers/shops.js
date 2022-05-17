import { tryToParse } from "../utility/helpers";
import { shops } from "../data/website-data";

export const getShops = (idleonData) => {
  const shopsRaw = idleonData?.ShopStock || tryToParse(idleonData?.ShopStock);
  return parseShops(shopsRaw);
}

export const parseShops = (shopsRaw) => {
  return shopsRaw.reduce((res, shopObject, shopIndex) => {
    const realShopStock = shopObject;
    const shopName = shopMapping?.[shopIndex]?.name;
    const mapped = Object.values(realShopStock)?.reduce((res, item, itemIndex) => {
      const isIncluded = shopMapping?.[shopIndex]?.included?.[itemIndex];
      const amount = parseInt(item) || 0;
      return amount > 0 && isIncluded ? [...res, { amount: item, ...shops[shopName][itemIndex] }] : res;
    }, [])
    return [...res, mapped]
  }, []);
}

// TODO: check if can make this less ugly
// TODO: possibly reverse to exclude instead of include
export const shopMapping = {
  0: {
    included: {
      0: true, 1: true, 4: true, 5: true, 6: true, 7: true, 13: true, 18: true, 23: true, 24: true
    }, name: 'Blunder_Hills'
  },
  1: {
    included: {
      0: true, 3: true, 4: true, 8: true, 9: true, 12: true, 13: true
    }, name: 'Encroaching_Forest_Villas'
  },
  2: {
    included: {
      0: true, 1: true, 2: true, 3: true, 4: true, 8: true, 9: true, 10: true, 11: true, 17: true, 18: true
    }, name: 'YumYum_Grotto'
  },
  3: {
    included: {
      12: true
    }, name: 'Faraway_Piers'
  },
  4: {
    included: {
      0: true, 1: true, 2: true, 5: true, 6: true, 7: true, 8: true, 9: true, 10: true, 11: true, 18: true, 19: true
    }, name: 'Frostbite_Towndra'
  },
  5: {
    included: {
      0: true,
      1: true,
      2: true,
      3: true,
      4: true,
      5: true,
      6: true,
      7: true,
      8: true,
      9: true,
      10: true,
      11: true,
      12: true,
      13: true,
      14: true
    }, name: 'Hyperion_Nebula'
  }
};