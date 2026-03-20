import { tryToParse } from '@utility/helpers';
import { calculateItemTotalAmount } from '@parsers/items';
import { items, prayers } from '@website-data';
import { isSuperbitUnlocked } from '@parsers/world-5/gaming';
import type { IdleonData, Account } from '../types';

export const getPrayers = (idleonData: IdleonData, storage: any[]) => {
  const prayersRaw = idleonData?.PrayersUnlocked || tryToParse(idleonData?.PrayOwned);
  return parsePrayers(prayersRaw, storage);
}

const parsePrayers = (prayersRaw: any[], storage: any[]) => {
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

export const getPrayerBonusAndCurse = (prayers: any[], prayerName: string, account?: Account, forcePrayer: boolean = false) => {
  const superbitUnlocked = isSuperbitUnlocked(account, 'No_more_Praying');
  let prayer;
  const useSuperbit = superbitUnlocked && (!prayers || prayers?.length === 0);

  if (useSuperbit) {
    prayer = (account?.prayers as any[])?.find(({ name }: any) => name === prayerName);
  } else {
    prayer = prayers?.find(({ name }) => name === prayerName);

    // If prayer is not found in active prayers but forcePrayer is true, look in account prayers
    if (!prayer && forcePrayer) {
      prayer = (account?.prayers as any[])?.find(({ name }: any) => name === prayerName);
    }
  }

  if (!prayer) return { bonus: 0, curse: 0 };

  const bonus = prayer.x1 + (prayer.x1 * (prayer.level - 1)) / 10;
  const curse = prayer.x2 + (prayer.x2 * (prayer.level - 1)) / 10;

  // If the prayer is being forced, treat it as if it's active (not using superbit rules)
  const isForcedPrayer = forcePrayer && !prayers?.find(({ name }) => name === prayerName);

  return {
    bonus: Math.round(useSuperbit ? bonus / 5 : bonus),
    curse: Math.round(useSuperbit || isForcedPrayer ? 0 : curse)
  }
}

export const calcPrayerCost = (prayer: any) => {
  const { level, costMulti, prayerIndex } = prayer
  if (level < 6) {
    return Math.round(costMulti * (1 + (4 + prayerIndex / 25) * level));
  }
  return Math.round(Math.min(2e9, costMulti * (1 + (1 + prayerIndex / 20) * level) * Math.pow(prayerIndex === 9
    ? 1.3
    : 1.12, level - 5)))
}

export const calcTotalPrayersLevel = (prayers: any[]) => {
  return prayers?.reduce((res, { level }) => res + level, 0)
}