import { growth } from "../utility/helpers";
import { classes, talents } from "../data/website-data";
import { getAchievementStatus } from "./achievements";

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
  "Voidwalker": ["Beginner", "Journeyman", "Maestro", "Voidwalker"],
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
    const orderedTalents = Object.entries(talents?.[className] || {})?.map(([, talentDetails]) => {
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
  const classes = characters?.filter((character) => checkCharClass(character?.class, className));
  return classes?.reduce((res, { talents }) => {
    const talent = getTalentBonus(talents, talentTree, talentName);
    if (talent > res) {
      return talent
    }
    return res;
  }, 0);
}

export const getHighestMaxLevelTalentByClass = (characters, talentTree, className, talentName) => {
  const classes = characters?.filter((character) => checkCharClass(character?.class, className));
  return classes?.reduce((res, { talents }) => {
    const talentsObj = talentTree !== null ? talents?.[talentTree]?.orderedTalents : talents?.orderedTalents;
    const talent = talentsObj?.find(({ name }) => name === talentName);
    if (talent?.maxLevel > res?.maxLevel) {
      return talent;
    }
    return res;
  }, { maxLevel: 0 });
}

export const applyTalentAddedLevels = (talents, flatTalents, linkedDeity, secondLinkedDeity, deityMinorBonus, secondDeityMinorBonus, familyEffBonus, achievements) => {
  let addedLevels = 0;
  if (linkedDeity === 1) {
    addedLevels += deityMinorBonus;
  } else if (secondLinkedDeity === 1) {
    addedLevels += secondDeityMinorBonus;
  }
  const symbolTalent = talents?.[3]?.orderedTalents?.find(({ name }) => name.includes('SYMBOLS_OF_BEYOND_'))
  if (symbolTalent) {
    const symbolAddedLevel = growth(symbolTalent?.funcX, symbolTalent?.level, symbolTalent?.x1, symbolTalent?.x2, false) ?? 0;
    addedLevels += symbolAddedLevel;
  }
  if (familyEffBonus) {
    addedLevels += familyEffBonus;
  }
  if (getAchievementStatus(achievements, 291)) {
    addedLevels += 1;
  }
  const excludedTalents = ['ARCHLORD_OF_THE_PIRATES', 'POLYTHEISM', 'SYMBOLS_OF_BEYOND_~G', 'SYMBOLS_OF_BEYOND_~P',
    'SYMBOLS_OF_BEYOND_~R'].toSimpleObject()
  if (flatTalents) {
    return flatTalents.map((talent) => ({
      ...talent,
      level: talent.level >= 1 && !excludedTalents?.[talent?.name] ? Math.ceil(talent.level + addedLevels) : talent.level
    }));
  }
  return Object.entries(talents).reduce((res, [key, data]) => {
    const { orderedTalents } = data;
    const updatedTalents = orderedTalents?.map((talent) => ({
      ...talent,
      level: talent.level >= 1 && !excludedTalents?.[talent?.name] ? Math.ceil(talent.level + addedLevels) : talent.level
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

export const getFamilyBonusValue = function (e, t, n, a) {
  return 10 > e && -1 !== t.indexOf("decay") ? Math.round(100 * e) / 100 : 1 > e || ("add" === t && 1 > a && 100 > e) || (25 > e && "decay" === t) ? Math.round(10 * e) / 10 : Math.round(e);
}

export const getVoidWalkerTalentEnhancements = (characters, account, pointsInvested, index, character) => {
  const talentList = [];
  if (pointsInvested >= 25) {
    talentList.push(42);
  }
  if (pointsInvested >= 50) {
    talentList.push(318);
  }
  if (pointsInvested >= 75) {
    talentList.push(497);
  }
  if (pointsInvested >= 100) {
    talentList.push(79);
  }
  if (pointsInvested >= 125) {
    talentList.push(146);
  }
  if (pointsInvested >= 150) {
    talentList.push(362);
  }
  if (pointsInvested >= 175) {
    talentList.push(43);
  }
  if (pointsInvested >= 200) {
    talentList.push(536);
  }
  if (pointsInvested >= 225) {
    talentList.push(165);
  }
  if (pointsInvested >= 250) {
    talentList.push(35);
  }
  if (talentList.indexOf(index) !== -1) {
    if (index === 42) {
      return true;
    }
    if (index === 146) {
      const bloodBerserkers = characters?.filter((character) => character?.class === 'Blood_Berserker');
      const superChows = bloodBerserkers?.reduce((res, bb) => {
        const { chow } = bb;
        chow?.list?.forEach(({ name, kills }) => {
          if (kills < 1e8) return;
          if (res?.[name] && kills > res?.[name]) {
            res[name] = kills;
          } else {
            res[name] = kills;
          }
        })
        return res;
      }, {})
      return Math.pow(1.1, Object.keys(superChows).length ?? 0);
    }
    if (index === 536) {
      return 1;
    }
    if (index === 35) {
      const { stats } = character || {};
      let base
      if (stats?.luck < 1e3) {
        base = (Math.pow(stats?.luck + 1, 0.37) - 1) / 30;
      } else {
        base = ((stats?.luck - 1e3) / (stats?.luck + 2500)) * 0.8 + 0.3963
      }
      const talentBonus = getTalentBonus(character?.talents, 3, 'LUCKY_CHARMS');
      return (base * (1 + talentBonus / 100)) / 1.8;
    }
  }
  return 0;
}

export const checkCharClass = (charClass, className) => {
  return talentPagesMap[charClass]?.includes(className);
}

export const getBubonicGreenTube = (character, characters, account) => {
  const charCords = account?.lab?.playersCords?.[character?.playerId];
  const bubosCords = account?.lab?.playersCords?.filter(({ class: cName }) => checkCharClass(cName, 'Bubonic_Conjuror'));
  if (!charCords || bubosCords?.length === 0) return 0;
  const affected = bubosCords?.some(({ x }) => x > charCords?.x);
  if (affected) {
    return getHighestTalentByClass(characters, 3, 'Bubonic_Conjuror', 'GREEN_TUBE')
  } else {
    return 0;
  }
}