import { createArrayOfArrays, growth, tryToParse } from '@utility/helpers';
import { postOffice } from '@website-data';
import { getVialsBonusByStat } from '@parsers/world-2/alchemy';

const EXTRA_BOXES_OPTION_INDEX = 131;
const BONUS_BOXES_OPTION_INDEX = 347;

// game: PostOfficeINFO("AvailablePoints"). The saved DeliveryBoxMisc is only refreshed when the post office
// is opened, so it is rebuilt here the way the game does on opening it: the Box points vial plus
// OptionsListAccount[131].
export const getPlayerPostOffice = (playerPostOffice: any, account: any) => {
  let totalPointsSpent = 0;
  const boxes = postOffice?.map((box, index) => {
    const points = playerPostOffice?.[index]?.[0] ?? playerPostOffice?.[index];
    totalPointsSpent += points || 0;
    return { ...box, level: points || 0 }
  });
  const miscBoxes = (getVialsBonusByStat(account?.alchemy?.vials, 'BoxPoints') ?? 0)
    + (account?.accountOptions?.[EXTRA_BOXES_OPTION_INDEX] ?? 0);
  const totalOrders = (account?.currencies?.DeliveryBoxComplete ?? 0) + (account?.currencies?.DeliveryBoxStreak ?? 0)
    + (account?.accountOptions?.[BONUS_BOXES_OPTION_INDEX] ?? 0) + miscBoxes;
  return {
    boxes,
    totalOrders,
    totalPointsSpent,
    unspentPoints: Math.round(totalOrders - totalPointsSpent) || 0
  }
}

export const getPostOfficeBonus = (postOffice: any, boxName: any, bonusIndex: any) => {
  const box = postOffice?.boxes?.find(({ name }: any) => name === boxName);
  if (!box) return 0;
  const updatedLevel = Math.round(bonusIndex === 0 ? box?.level : bonusIndex === 1
    ? box?.level - box?.upgradeLevels?.[0]
    : box?.level - box?.upgradeLevels?.[1]);
  const upgrade = box?.upgrades?.[bonusIndex];
  return growth(upgrade?.func, updatedLevel > 0 ? updatedLevel : 0, upgrade?.x1, upgrade?.x2, false) ?? 0;
}

export const getPostOfficeBoxLevel = (postOffice: any, boxName: any) => {
  const box = postOffice?.boxes?.find(({ name }: any) => name === boxName);
  if (!box) return 0;
  return box?.level;
}

export const getPostOfficeShipments = (idleonData: any) => {
  const ordersRaw = tryToParse(idleonData?.PostOfficeInfo0) || idleonData?.PostOfficeInfo0;
  const ordersArrays = createArrayOfArrays(ordersRaw)
  const shipmentsRaw = tryToParse(idleonData?.PostOfficeInfo1) || idleonData?.PostOfficeInfo1;
  const postOfficeArrays = createArrayOfArrays(shipmentsRaw)
  return postOfficeArrays?.map((shipment: any, index: any) => {
    const [totalShipments, streak, shield] = shipment;
    return {
      index,
      totalShipments,
      streak,
      completedAnOrder: ordersArrays?.[index]?.[2],
      shield
    }
  })
}