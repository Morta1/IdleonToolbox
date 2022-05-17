import { tryToParse } from "../utility/helpers";
import { items, randomList, refinery } from "../data/website-data";
import { calculateItemTotalAmount } from "./items";

export const getRefinery = (idleonData, storage, tasks) => {
  const refineryRaw = tryToParse(idleonData?.Refinery) || idleonData?.Refinery;
  return parseRefinery(refineryRaw, storage, tasks);
}

const parseRefinery = (refineryRaw, storage, tasks) => {
  const refineryStorageRaw = refineryRaw?.[1];
  const refineryStorageQuantityRaw = refineryRaw?.[2];
  const refineryStorage = refineryStorageRaw?.reduce((res, saltName, index) => saltName !== 'Blank' ? [...res, {
    rawName: saltName,
    name: items[saltName]?.displayName,
    amount: refineryStorageQuantityRaw?.[index],
    owner: 'refinery'
  }] : res, []);
  const combinedStorage = [...storage, ...refineryStorage];
  const powerCap = randomList[18]?.split(' ');
  const refinerySaltTaskLevel = tasks?.[2]?.[2]?.[6];
  const salts = refineryRaw?.slice(3, 3 + refineryRaw?.[0]?.[0]);
  const saltsArray = salts?.reduce((res, salt, index) => {
    const name = `Refinery${index + 1}`
    const [refined, rank, , active, autoRefinePercentage] = salt;
    const { saltName, cost } = refinery?.[name];
    const componentsWithTotalAmount = cost?.map((item) => {
      let amount = calculateItemTotalAmount(combinedStorage, item?.name, true);
      return {
        ...item,
        totalAmount: amount
      }
    })
    return [
      ...res,
      {
        saltName,
        cost: componentsWithTotalAmount,
        rawName: name,
        powerCap: parseFloat(powerCap?.[rank]),
        refined,
        rank,
        active,
        autoRefinePercentage
      }
    ];
  }, []);

  return {
    salts: saltsArray,
    refinerySaltTaskLevel,
    timePastCombustion: refineryRaw?.[0]?.[1],
    timePastSynthesis: refineryRaw?.[0]?.[2]
  }
}