import { tryToParse } from '@utility/helpers';
import { calculateItemTotalAmount } from '@parsers/items';
import { items, prayers } from '@website-data';
import { isSuperbitUnlocked } from '@parsers/world-5/gaming';
import { liveEntries } from '@parsers/catalog';
import type { IdleonData, Account } from '../types';

export const getPrayers = (idleonData: IdleonData, storage: any[]) => {
  const prayersRaw = idleonData?.PrayersUnlocked || tryToParse(idleonData?.PrayOwned);
  return parsePrayers(prayersRaw, storage);
}

const parsePrayers = (prayersRaw: any[] | undefined, storage: any[]) => {
  return liveEntries<any>(prayers).map(({ entry, index }) => {
    const reqItem = entry?.soul;
    const totalAmount = calculateItemTotalAmount(storage, items?.[reqItem]?.displayName, true);
    return {
      ...entry,
      totalAmount,
      level: prayersRaw?.[index] ?? 0
    };
  });
}

export const getPrayerBonusAndCurse = (prayers: any[], prayerName: string, account?: Account, forcePrayer: boolean = false) => {
  // _customBlock_prayersReal gates the no-prayers-equipped path on superbit 9 or 39, then adds a
  // fifth of the bonus for each of the three superbits, so all three stack to 3/5ths.
  const superbit9 = isSuperbitUnlocked(account, 'No_more_Praying') ? 1 : 0;
  const superbit39 = isSuperbitUnlocked(account, 'Prayers_Begone') ? 1 : 0;
  const superbit53 = isSuperbitUnlocked(account, 'Prayers_Aint_Meta') ? 1 : 0;
  let prayer;
  const useSuperbit = (superbit9 || superbit39) && (!prayers || prayers?.length === 0);

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

  if (useSuperbit) {
    // prayerIndex 5 never gets the superbit bonus, and the prayer has to be levelled at all
    const eligible = prayer.prayerIndex !== 5 && prayer.level > 0.5;
    const superbitMulti = .2 * superbit9 + .2 * superbit39 + .2 * superbit53;
    return { bonus: eligible ? Math.round(superbitMulti * bonus) : 0, curse: 0 };
  }

  return {
    bonus: Math.round(bonus),
    curse: Math.round(isForcedPrayer ? 0 : curse)
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