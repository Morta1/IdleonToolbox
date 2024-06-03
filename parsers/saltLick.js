import { calculateItemTotalAmount } from './items';
import { saltLicks } from '../data/website-data';
import { round, tryToParse } from '../utility/helpers';

export const getSaltLick = (idleonData, storage) => {
  const saltLickRaw = tryToParse(idleonData?.SaltLick) || idleonData?.SaltLick;
  return saltLicks?.map((bonus, index) => {
    const level = saltLickRaw?.[index];
    const totalAmount = calculateItemTotalAmount(storage, bonus?.name, true);
    return {
      ...bonus,
      totalAmount,
      level
    }
  })
}

export const getSaltLickBonus = (saltLicks, saltIndex, shouldRound = false) => {
  const saltLick = saltLicks?.[saltIndex];
  if (!saltLick || saltLick === 0) return 0;
  const bonus = saltLick.baseBonus * (saltLick.level ?? 0) ?? 0;
  if (shouldRound) return round(bonus) ?? 0;
  return bonus;
}