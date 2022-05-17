import { growth } from "../utility/helpers";

export const getFamilyBonusBonus = (bonuses, bonusName, level) => {
  const bonus = bonuses?.find(({ name }) => name?.includes(bonusName));
  if (!bonus) return 0;
  return growth(bonus?.func, Math.max(0, Math.round(level - bonus?.x3)), bonus?.x1, bonus?.x2, false);
}