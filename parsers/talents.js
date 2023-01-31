import { growth } from "../utility/helpers";
import { classes, talents } from "../data/website-data";

export const getTalentBonus = (talents, talentTree, talentName, yBonus) => {
  const talentsObj = talentTree !== null ? talents?.[talentTree]?.orderedTalents : talents?.orderedTalents;
  const talent = talentsObj?.find(({ name }) => name === talentName);
  if (!talent) return 0;
  if (yBonus) {
    return growth(talent?.funcY, talent?.level, talent?.y1, talent?.y2, false) ?? 0
  }
  return growth(talent?.funcX, talent?.level, talent?.x1, talent?.x2, false) ?? 0;
}

export const getTalentBonusIfActive = (activeBuffs, tName, variant = 'x') => {
  return activeBuffs?.reduce((res, {
    name,
    funcX,
    level,
    x1,
    x2,
    funcY,
    y1,
    y2
  } = {}) => name === tName ? variant === 'x' ? growth(funcX, level, x1, x2, false) : growth(funcY, level, y1, y2, false) : 0, 0) ?? 0;
}

export const talentPagesMap = {
  "Beginner": ["Beginner"],
  "Journeyman": ["Beginner", "Journeyman"],
  "Maestro": ["Beginner", "Journeyman", "Maestro"],
  "Warrior": ["Rage_Basics", "Warrior"],
  "Barbarian": ["Rage_Basics", "Warrior", "Barbarian"],
  "Blood_Berserker": ["Rage_Basics", "Warrior", "Barbarian", "Blood_Berserker"],
  "Squire": ["Rage_Basics", "Warrior", "Squire"],
  "Divine_Knight": ["Rage_Basics", "Warrior", "Squire", "Divine_Knight"],
  "Archer": ["Calm_Basics", "Archer"],
  "Bowman": ["Calm_Basics", "Archer", "Bowman"],
  "Siege_Breaker": ["Calm_Basics", "Archer", "Bowman", "Siege_Breaker"],
  "Hunter": ["Calm_Basics", "Archer", "Hunter", "Beast_Master"],
  "Beast_Master": ["Calm_Basics", "Archer", "Hunter", "Beast_Master"],
  "Mage": ["Savvy_Basics", "Mage"],
  "Shaman": ["Savvy_Basics", "Mage", "Shaman"],
  "Bubonic_Conjuror": ["Savvy_Basics", "Mage", "Shaman", "Bubonic_Conjuror"],
  "Wizard": ["Savvy_Basics", "Mage", "Wizard"],
  "Elemental_Sorcerer": ["Savvy_Basics", "Mage", "Wizard", "Elemental_Sorcerer"]
};
// { 0: 'strength', 1: 'agility', 2: 'wisdom', 3: 'luck', 4: 'level' }
export const mainStatMap = {
  Beginner: 'luck',
  Journeyman: 'luck',
  Maestro: 'luck',
  Warrior: 'strength',
  Barbarian: 'strength',
  Blood_Berserker: 'strength',
  Squire: 'strength',
  Divine_Knight: 'strength',
  Archer: 'agility',
  Bowman: 'agility',
  Siege_Breaker: 'agility',
  Hunter: 'agility',
  Beast_Master: 'agility',
  Mage: 'wisdom',
  Shaman: 'wisdom',
  Bubonic_Conjuror: 'wisdom',
  Wizard: 'wisdom',
  Elemental_Sorcerer: 'wisdom',
}

export const createTalentPage = (className, pages, talentsObject, maxTalentsObject, mergeArray) => {
  return pages.reduce((res, className, index) => {
    const orderedTalents = Object.entries(talents?.[className])?.map(([, talentDetails]) => {
      return {
        talentId: talentDetails.skillIndex,
        ...talentDetails,
        level: talentsObject[talentDetails.skillIndex] || 0,
        maxLevel: maxTalentsObject[talentDetails.skillIndex] || -1,
      }
    });
    if (mergeArray) {
      return {
        ...res,
        talents: { ...res?.talents, orderedTalents: [...(res?.talents?.orderedTalents || []), ...orderedTalents] },
        flat: [...(res?.flat || []), ...orderedTalents]
      }
    }
    return {
      ...res,
      flat: [...(res?.flat || []), ...orderedTalents],
      talents: { ...res?.talents, [index]: { name: className, id: classes?.indexOf(className), orderedTalents } },
    }
  }, { flat: [], talents: {} })
}

export const getActiveBuffs = (activeBuffs, talents) => {
  return activeBuffs?.map(([talentId]) => talents?.find(({ talentId: tId }) => talentId === tId));
}

export const getHighestTalentByClass = (characters, talentTree, className, talentName) => {
  const classes = characters?.filter((character) => character?.class === className);
  return classes?.reduce((res, { talents }) => {
    const theFamilyGuy = getTalentBonus(talents, talentTree, talentName);
    if (theFamilyGuy > res) {
      return theFamilyGuy
    }
    return res;
  }, 0);
}

export const applyTalentAddedLevels = (talents, linkedDeity, deityMinorBonus) => {
  let addedLevels = 0;
  if (linkedDeity === 1) {
    addedLevels += deityMinorBonus;
  }
  const symbolTalent = talents?.[3]?.orderedTalents?.find(({ name }) => name.includes('SYMBOLS_OF_BEYOND_'))
  if (symbolTalent) {
    const symbolAddedLevel = growth(symbolTalent?.funcX, symbolTalent?.level, symbolTalent?.x1, symbolTalent?.x2, false) ?? 0;
    addedLevels += symbolAddedLevel;
  }
  return Object.entries(talents).reduce((res, [key, data]) => {
    const { orderedTalents } = data;
    const updatedTalents = orderedTalents?.map((talent) => ({
      ...talent,
      level: talent.level > 1 && !talent?.name.includes('SYMBOLS_OF_BEYOND_') ? Math.ceil(talent.level + addedLevels) : talent.level
    }));
    return {
      ...res,
      [key]: {
        ...data,
        orderedTalents: updatedTalents
      }
    }
  }, {});
}
