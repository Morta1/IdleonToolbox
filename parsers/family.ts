import { growth } from '@utility/helpers';
import { CLASSES, talentPagesMap } from '@parsers/classDefinitions';
import { getAllTalentAddedLevels, getBestActiveCharacter } from '@parsers/talents';
import { classFamilyBonuses, classPromotions } from '@website-data';

export const getFamilyBonusBonus = (bonuses: any[], bonusName: string, level: number) => {
  const bonus = bonuses?.find(({ name }) => name?.includes(bonusName));
  if (!bonus || level < bonus?.x3) return 0;
  return growth(bonus?.func, Math.max(0, Math.round(level - bonus?.x3)), bonus?.x1, bonus?.x2, false);
}

// FamilyBonsuesREAL(classIndex, 0, level): ClassFamilyBonuses is indexed by the game's class index.
const getClassFamilyBonus = (className: string, level: number) => {
  const bonus = classFamilyBonuses?.[(classPromotions as any)?.[className]?.index];
  if (!bonus || level < bonus?.x3) return 0;
  return growth(bonus?.func, Math.max(0, Math.round(level - bonus?.x3)), bonus?.x1, bonus?.x2, false) ?? 0;
}

// FamBonusQTYs 24 and 44 are buffed by the account's best THE_FAMILY_GUY (getbonus2) whenever they
// are set, in place of the played character's own.
const ACCOUNT_FAMILY_GUY_CLASSES = [CLASSES.Divine_Knight, CLASSES.Siege_Breaker];

// A THE_FAMILY_GUY talent's bonus mid-walk: its level must leave out the Elemental Sorcerer family
// bonus, which is added back as stored at that point of the walk.
const familyGuyBonusAt = (familyGuy: any, sorcererBonus: number) => familyGuy?.baseLevel >= 1
  ? growth(familyGuy.funcX, familyGuy.level + Math.floor(sorcererBonus), familyGuy.x1, familyGuy.x2, false) ?? 0
  : 0;

// getbonus2(1, 144, -1) as the walk reads it: the best THE_FAMILY_GUY on the account, levelled with
// the played character's added levels minus the sorcerer family bonus.
const getAccountFamilyGuy = (characters: any[], activeCharacter: any) => {
  const sorcererLevels = Math.floor(activeCharacter?.familyBonuses?.[CLASSES.Elemental_Sorcerer] ?? 0);
  return characters?.reduce((best: any, character: any) => {
    const talent = character?.flatTalents?.find(({ name }: any) => name === 'THE_FAMILY_GUY');
    if (!(talent?.baseLevel > 0)) return best;
    const level = talent.baseLevel + getAllTalentAddedLevels(talent.talentId, activeCharacter, character) - sorcererLevels;
    return level > (best?.level ?? -Infinity) ? { ...talent, level } : best;
  }, null);
}

// game: DNSM.FamBonusQTYs is rebuilt for the played character by walking every character in save order,
// and every class in its line (ReturnClasses, the same list as its talent tabs). A character only
// overwrites a bonus when its own raw value beats the stored one, which can already carry an earlier
// character's buff, and THE_FAMILY_GUY multiplies a bonus only when the played character is the one
// setting it. The talent is read mid-walk, so its added levels hold whatever Elemental Sorcerer bonus
// is stored at that point: familyGuy and accountFamilyGuy levels must leave that bonus out.
// Keyed by the class that grants the bonus. The Divine Knight and Siege Breaker values need
// accountFamilyGuy (getAccountFamilyGuy); without it they are left unbuffed.
export const getFamilyBonusesSeenBy = (charactersLevels: any[], playerId: number, familyGuy: any, accountFamilyGuy?: any) => {
  const stored: Record<string, number> = {};
  charactersLevels?.forEach(({ level, class: className }: any, index: number) => {
    talentPagesMap[className]?.forEach((familyClass) => {
      const bonus = getClassFamilyBonus(familyClass, level);
      if (!(bonus > (stored[familyClass] ?? 0))) return;
      stored[familyClass] = bonus;
      const sorcererBonus = stored[CLASSES.Elemental_Sorcerer] ?? 0;
      const multiplier = index === playerId ? familyGuyBonusAt(familyGuy, sorcererBonus) : 0;
      if (multiplier > 0) {
        stored[familyClass] = bonus * (1 + multiplier / 100);
      }
      if (ACCOUNT_FAMILY_GUY_CLASSES.includes(familyClass)) {
        stored[familyClass] = bonus * (1 + familyGuyBonusAt(accountFamilyGuy, sorcererBonus) / 100);
      }
    });
  });
  return stored;
}

// The walk as the played character runs it, with the account-wide THE_FAMILY_GUY in place for the
// Divine Knight and Siege Breaker values. Their buff is read mid-walk too, so it still depends on the
// played character's own buff of the sorcerer bonus.
export const getFamilyBonusesOfActive = (charactersLevels: any[], characters: any[], activeCharacter = getBestActiveCharacter(characters)) => {
  return getFamilyBonusesSeenBy(charactersLevels, activeCharacter?.playerId ?? -1, activeCharacter?.familyGuyWithoutFamily,
    getAccountFamilyGuy(characters, activeCharacter));
}
