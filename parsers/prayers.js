import { tryToParse } from "../utility/helpers";
import { calculateItemTotalAmount } from "./items";
import { items, prayers } from "../data/website-data";

export const getPrayers = (idleonData, storage) => {
  const prayersRaw = idleonData?.PrayersUnlocked || tryToParse(idleonData?.PrayOwned);
  return parsePrayers(prayersRaw, storage);
}

const parsePrayers = (prayersRaw, storage) => {
  return prayersRaw?.reduce((res, prayerLevel, prayerIndex) => {
    const reqItem = prayers?.[prayerIndex]?.soul;
    const totalAmount = calculateItemTotalAmount(storage, items?.[reqItem]?.displayName, true);
    return prayerIndex < 19 ? [...res, {
      ...prayers?.[prayerIndex],
      prayerIndex,
      totalAmount,
      level: prayerLevel
    }] : res
  }, []);
}

export const getPrayerBonusAndCurse = (prayers, prayerName) => {
  const prayer = prayers?.find(({ name }) => name === prayerName);
  if (!prayer) return { bonus: 0, curse: 0 };
  const bonus = prayer.x1 + (prayer.x1 * (prayer.level - 1)) / 10;
  const curse = prayer.x2 + (prayer.x2 * (prayer.level - 1)) / 10;
  return { bonus: Math.round(bonus), curse: Math.round(curse) }
}

export const calcPrayerCost = (prayer) => {
  const { level, costMulti, prayerIndex } = prayer
  if (level < 6) {
    return Math.round(costMulti * (1 + (4 + prayerIndex / 25) * level));
  }
  return Math.round(Math.min(2e9, costMulti * (1 + (1 + prayerIndex / 20) * level) * Math.pow(prayerIndex === 9 ? 1.3 : 1.12, level - 5)))
}
