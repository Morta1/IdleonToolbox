import { growth } from '../utility/helpers';
import { checkCharClass, CLASSES, getFamilyBonusValue, getTalentBonus } from '@parsers/talents';
import { classFamilyBonuses } from '../data/website-data';
import { getHighestLevelOfClass } from '@parsers/misc';

export const getFamilyBonusBonus = (bonuses, bonusName, level) => {
  const bonus = bonuses?.find(({ name }) => name?.includes(bonusName));
  if (!bonus) return 0;
  return growth(bonus?.func, Math.max(0, Math.round(level - bonus?.x3)), bonus?.x1, bonus?.x2, false);
}

export const getFamilyBonus = (bonuses, bonusName) => {
  return bonuses?.find(({ name }) => name?.includes(bonusName));
}

export const getUpdatedFamilyBonus = (character, charactersLevels) => {
  const highestLevelElementalSorc = getHighestLevelOfClass(charactersLevels, CLASSES.Elemental_Sorcerer, true);
  let familyEffBonus = getFamilyBonusBonus(classFamilyBonuses, 'LV_FOR_ALL_TALENTS_ABOVE_LV_1', highestLevelElementalSorc);
  if (checkCharClass(character?.class, CLASSES.Elemental_Sorcerer)) {
    familyEffBonus *= (1 + getTalentBonus(character?.flatTalents, 'THE_FAMILY_GUY') / 100);
    const familyBonus = getFamilyBonus(classFamilyBonuses, 'LV_FOR_ALL_TALENTS_ABOVE_LV_1');
    familyEffBonus = getFamilyBonusValue(familyEffBonus, familyBonus?.func, familyBonus?.x1, familyBonus?.x2);
  }
  return familyEffBonus;
}