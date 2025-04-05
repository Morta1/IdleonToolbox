import { createArrayOfArrays, growth, tryToParse } from '../utility/helpers';
import { postOffice } from '../data/website-data';

export const getPlayerPostOffice = (playerPostOffice, account) => {
  let totalPointsSpent = 0;
  const boxes = postOffice?.map((box, index) => {
    const points = playerPostOffice?.[index]?.[0] ?? playerPostOffice?.[index];
    totalPointsSpent += points;
    return { ...box, level: points || 0 }
  });
  const totalOrders = account?.currencies?.DeliveryBoxComplete + account?.currencies?.DeliveryBoxStreak + account?.currencies?.DeliveryBoxMisc + (account?.accountOptions?.[347] ?? 0);
  return {
    boxes,
    totalOrders,
    totalPointsSpent,
    unspentPoints: (totalOrders - totalPointsSpent) || 0
  }
}

export const getPostOfficeBonus = (postOffice, boxName, bonusIndex) => {
  const box = postOffice?.boxes?.find(({ name }) => name === boxName);
  if (!box) return 0;
  const updatedLevel = Math.round(bonusIndex === 0 ? box?.level : bonusIndex === 1
    ? box?.level - box?.upgradeLevels?.[0]
    : box?.level - box?.upgradeLevels?.[1]);
  const upgrade = box?.upgrades?.[bonusIndex];
  return growth(upgrade?.func, updatedLevel > 0 ? updatedLevel : 0, upgrade?.x1, upgrade?.x2, false) ?? 0;
}

export const getPostOfficeBoxLevel = (postOffice, boxName) => {
  const box = postOffice?.boxes?.find(({ name }) => name === boxName);
  if (!box) return 0;
  return box?.level;
}

export const getPostOfficeShipments = (idleonData) => {
  const ordersRaw = tryToParse(idleonData?.PostOfficeInfo0) || idleonData?.PostOfficeInfo0;
  const ordersArrays = createArrayOfArrays(ordersRaw)
  const shipmentsRaw = tryToParse(idleonData?.PostOfficeInfo1) || idleonData?.PostOfficeInfo1;
  const postOfficeArrays = createArrayOfArrays(shipmentsRaw)
  return postOfficeArrays?.map((shipment, index) => {
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