import { growth } from '@utility/helpers';
import { checkCharClass } from '@parsers/talents';
import { CLASSES } from '@parsers/classDefinitions';
import { classFamilyBonuses } from '@website-data';

export const getFamilyBonusBonus = (bonuses: any[], bonusName: string, level: number) => {
  const bonus = bonuses?.find(({ name }) => name?.includes(bonusName));
  if (!bonus || level < bonus?.x3) return 0;
  return growth(bonus?.func, Math.max(0, Math.round(level - bonus?.x3)), bonus?.x1, bonus?.x2, false);
}

export const getFamilyBonus = (bonuses: any[], bonusName: string) => {
  return bonuses?.find(({ name }) => name?.includes(bonusName));
}

// The family bonuses that feed drop rate, keyed by the class that grants them: FamBonusQTYs 32, 66 and 68.
const WALKED_FAMILY_BONUSES: Record<string, string> = {
  [CLASSES.Royal_Guardian]: 'DROP_RATE_MULTIPLIER',
  [CLASSES.Shaman]: 'GOLDEN_FOODS',
  [CLASSES.Elemental_Sorcerer]: 'LV_FOR_ALL_TALENTS_ABOVE_LV_1'
};

// game: DNSM.FamBonusQTYs is rebuilt for the played character by walking every character in save order.
// A character only overwrites a bonus when its own raw value beats the stored one, which can already
// carry an earlier character's buff, and THE_FAMILY_GUY multiplies a bonus only when the played
// character is the one setting it. The talent is read mid-walk, so its added levels hold whatever
// Elemental Sorcerer bonus is stored at that point. familyGuy.level must leave that bonus out.
export const getFamilyBonusesSeenBy = (charactersLevels: any[], playerId: number, familyGuy: any) => {
  const stored: Record<string, number> = {};
  const familyGuyBonus = (sorcererBonus: number) => familyGuy?.baseLevel >= 1
    ? growth(familyGuy.funcX, familyGuy.level + Math.floor(sorcererBonus), familyGuy.x1, familyGuy.x2, false) ?? 0
    : 0;
  charactersLevels?.forEach(({ level, class: className }: any, index: number) => {
    Object.entries(WALKED_FAMILY_BONUSES).forEach(([familyClass, bonusName]) => {
      if (!checkCharClass(className, familyClass)) return;
      const bonus = getFamilyBonusBonus(classFamilyBonuses, bonusName, level);
      if (!(bonus > (stored[familyClass] ?? 0))) return;
      stored[familyClass] = bonus;
      const multiplier = index === playerId ? familyGuyBonus(stored[CLASSES.Elemental_Sorcerer] ?? 0) : 0;
      if (multiplier > 0) {
        stored[familyClass] = bonus * (1 + multiplier / 100);
      }
    });
  });
  return stored;
}
