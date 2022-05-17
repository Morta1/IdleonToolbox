import { growth } from "../utility/helpers";
import { postOffice } from "../data/website-data";

export const getPlayerPostOffice = (playerPostOffice, account) => {
  let totalPointsSpent = 0;
  const boxes = postOffice?.map((box, index) => {
    const points = playerPostOffice?.[index]?.[0] ?? playerPostOffice?.[index];
    totalPointsSpent += points;
    return { ...box, level: points || 0 }
  });
  const totalOrders = account?.currencies?.DeliveryBoxComplete + account?.currencies?.DeliveryBoxStreak + account?.currencies?.DeliveryBoxMisc;
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
  const updatedLevel = bonusIndex === 0 ? box?.level : bonusIndex === 1 ? box?.level - 25 : box?.level - 100;
  const upgrade = box?.upgrades?.[bonusIndex];
  return growth(upgrade?.func, updatedLevel > 0 ? updatedLevel : 0, upgrade?.x1, upgrade?.x2, false) ?? 0;
}