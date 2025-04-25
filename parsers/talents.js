import { growth } from '../utility/helpers';
import { classes, classFamilyBonuses, talents } from '../data/website-data';
import { getAchievementStatus } from './achievements';
import { getHighestLevelOfClass, isCompanionBonusActive } from './misc';
import { getMinorDivinityBonus } from './divinity';
import { getEquinoxBonus } from './equinox';
import { getFamilyBonus, getFamilyBonusBonus } from '@parsers/family';
import { getStampsBonusByEffect } from '@parsers/stamps';
import { getGuildBonusBonus } from '@parsers/guild';
import { getDungeonFlurboStatBonus } from '@parsers/dungeons';
import { getCardBonusByEffect } from '@parsers/cards';
import { getSigilBonus } from '@parsers/alchemy';
import { getShinyBonus } from '@parsers/breeding';
import { getBribeBonus } from '@parsers/bribes';
import { getIsland } from '@parsers/world-2/islands';
import { getGrimoireBonus } from '@parsers/grimoire';
import { getUpgradeVaultBonus } from '@parsers/misc/upgradeVault';


export const getTalentBonus = (talents, talentTree, talentName, yBonus, useMaxLevel, addedLevels, useMaxAndAddedLevels, forceTalent = false) => {
  const talentsObj = talentTree !== null ? talents?.[talentTree]?.orderedTalents : talents?.orderedTalents;
  const talent = talentsObj?.find(({ name }) => name === talentName);
  if (!talent) return 0;
  let level = talent?.level;
  if (talent?.level > 0 || forceTalent) {
    level = useMaxLevel ? talent?.maxLevel : talent?.level;
    if (useMaxAndAddedLevels && (forceTalent || (talent?.level > talent?.maxLevel))) {
      level = talent?.maxLevel + addedLevels;
    } else {
      level = addedLevels ? level - addedLevels : level;
    }
  }
  if (yBonus) {
    return growth(talent?.funcY, level, talent?.y1, talent?.y2, false) ?? 0;
  }
  return growth(talent?.funcX, level, talent?.x1, talent?.x2, false) ?? 0;
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
  } = {}) => name === tName ? variant === 'x'
    ? growth(funcX, level, x1, x2, false)
    : growth(funcY, level, y1, y2, false) : res, 0) ?? 0;
}

export const talentPagesMap = {
  'Beginner': ['Beginner'],
  'Journeyman': ['Beginner', 'Journeyman'],
  'Maestro': ['Beginner', 'Journeyman', 'Maestro'],
  'Voidwalker': ['Beginner', 'Journeyman', 'Maestro', 'Voidwalker'],
  'Warrior': ['Rage_Basics', 'Warrior'],
  'Barbarian': ['Rage_Basics', 'Warrior', 'Barbarian'],
  'Blood_Berserker': ['Rage_Basics', 'Warrior', 'Barbarian', 'Blood_Berserker'],
  'Death_Bringer': ['Rage_Basics', 'Warrior', 'Barbarian', 'Blood_Berserker', 'Death_Bringer'],
  'Squire': ['Rage_Basics', 'Warrior', 'Squire'],
  'Divine_Knight': ['Rage_Basics', 'Warrior', 'Squire', 'Divine_Knight'],
  'Archer': ['Calm_Basics', 'Archer'],
  'Bowman': ['Calm_Basics', 'Archer', 'Bowman'],
  'Siege_Breaker': ['Calm_Basics', 'Archer', 'Bowman', 'Siege_Breaker'],
  'Hunter': ['Calm_Basics', 'Archer', 'Hunter'],
  'Beast_Master': ['Calm_Basics', 'Archer', 'Hunter', 'Beast_Master'],
  'Wind_Walker': ['Calm_Basics', 'Archer', 'Hunter', 'Beast_Master', 'Wind_Walker'],
  'Mage': ['Savvy_Basics', 'Mage'],
  'Shaman': ['Savvy_Basics', 'Mage', 'Shaman'],
  'Bubonic_Conjuror': ['Savvy_Basics', 'Mage', 'Shaman', 'Bubonic_Conjuror'],
  'Wizard': ['Savvy_Basics', 'Mage', 'Wizard'],
  'Elemental_Sorcerer': ['Savvy_Basics', 'Mage', 'Wizard', 'Elemental_Sorcerer']
};
// { 0: 'strength', 1: 'agility', 2: 'wisdom', 3: 'luck', 4: 'level' }
export const mainStatMap = {
  Beginner: 'luck',
  Journeyman: 'luck',
  Maestro: 'luck',
  Voidwalker: 'luck',
  Warrior: 'strength',
  Barbarian: 'strength',
  Blood_Berserker: 'strength',
  Death_Bringer: 'strength',
  Squire: 'strength',
  Divine_Knight: 'strength',
  Archer: 'agility',
  Bowman: 'agility',
  Siege_Breaker: 'agility',
  Hunter: 'agility',
  Beast_Master: 'agility',
  Wind_Walker: 'agility',
  Mage: 'wisdom',
  Shaman: 'wisdom',
  Bubonic_Conjuror: 'wisdom',
  Wizard: 'wisdom',
  Elemental_Sorcerer: 'wisdom'
}

export const starTalentsPages = ['Special Talent 1', 'Special Talent 2',
  'Special Talent 3', 'Special Talent 4', 'Special Talent 5'];

export const createTalentPage = (className, pages, talentsObject, maxTalentsObject, mergeArray) => {
  if (!pages) return { flat: [], talents: {} };
  return pages.reduce((res, className, index) => {
    const orderedTalents = Object.entries(talents?.[className] || {})?.map(([, talentDetails]) => {
      return {
        talentId: talentDetails.skillIndex,
        ...talentDetails,
        level: talentsObject[talentDetails.skillIndex] || 0,
        maxLevel: maxTalentsObject[talentDetails.skillIndex] || -1
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
      talents: { ...res?.talents, [index]: { name: className, id: classes?.indexOf(className), orderedTalents } }
    }
  }, { flat: [], talents: {} })
}

export const getActiveBuffs = (activeBuffs, talents) => {
  return activeBuffs?.map(([talentId]) => talents?.find(({ talentId: tId }) => talentId === tId))?.filter((talent) => talent);
}

export const getHighestTalentByClass = (characters, talentTree, className, talentName, yBonus, useMaxLevel, reduceAddedLevels = false) => {
  const classes = characters?.filter((character) => checkCharClass(character?.class, className));
  return classes?.reduce((res, { talents, addedLevels }) => {
    const talent = getTalentBonus(talents, talentTree, talentName, yBonus, useMaxLevel, reduceAddedLevels
      ? addedLevels + 1
      : false);
    if (talent > res) {
      return talent
    }
    return res;
  }, 0);
}

export const getCharacterByHighestTalent = (characters, talentTree, className, talentName, yBonus, useMaxLevel) => {
  const classes = characters?.filter((character) => checkCharClass(character?.class, className));
  return classes?.reduce((res, character) => {
    const { talents } = character;
    const talent = getTalentBonus(talents, talentTree, talentName, yBonus, useMaxLevel);
    if (talent > res) {
      return character;
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

export const getTalentAddedLevels = (talents, flatTalents, linkedDeity, secondLinkedDeity, deityMinorBonus, secondDeityMinorBonus, familyEffBonus, account, character) => {
  // "AllTalentLV" == e
  let addedLevels = 0, breakdown;
  const pocketLinked = account?.hole?.godsLinks?.find(({ index }) => index === 1);
  if (isCompanionBonusActive(account, 0) || pocketLinked) {
    addedLevels += Math.ceil(getMinorDivinityBonus(character, account, 1));
  } else {
    if (linkedDeity === 1) {
      addedLevels += Math.ceil(deityMinorBonus);
    } else if (secondLinkedDeity === 1) {
      addedLevels += Math.ceil(secondDeityMinorBonus);
    }
  }
  breakdown = [{ name: 'God Bonus', value: Math.ceil(addedLevels) }];
  const symbolTalent = talents?.[3]?.orderedTalents?.find(({ name }) => name.includes('SYMBOLS_OF_BEYOND_'));
  let symbolAddedLevel = 0;
  if (symbolTalent && symbolTalent?.level > 0) {
    symbolAddedLevel = growth(symbolTalent?.funcX, symbolTalent?.level, symbolTalent?.x1, symbolTalent?.x2, false) ?? 0;
    addedLevels += symbolAddedLevel;
  }
  if (familyEffBonus) {
    addedLevels += Math.floor(familyEffBonus);
  }
  if (getAchievementStatus(account?.achievements, 291)) {
    addedLevels += 1;
  }
  if (isCompanionBonusActive(account, 1)) {
    addedLevels += account?.companions?.list?.at(1)?.bonus;
  }
  if (account.accountOptions?.[232] >= 3) { // ninja mastery
    addedLevels += 5;
  }
  addedLevels += getEquinoxBonus(account?.equinox?.upgrades, 'Equinox_Symbols');
  addedLevels += getGrimoireBonus(account?.grimoire?.upgrades, 39);

  breakdown = [
    ...breakdown,
    { name: 'Symbol of Beyond', value: symbolAddedLevel },
    { name: 'Family Bonus', value: Math.floor(familyEffBonus) },
    { name: 'Achievement Bonus', value: getAchievementStatus(account?.achievements, 291) ? 1 : 0 },
    {
      name: 'Companion Bonus',
      value: isCompanionBonusActive(account, 1) ? account?.companions?.list?.at(1)?.bonus : 0
    },
    {
      name: 'Equinox Bonus',
      value: getEquinoxBonus(account?.equinox?.upgrades, 'Equinox_Symbols')
    },
    {
      name: 'Grimoire Bonus',
      value: getGrimoireBonus(account?.grimoire?.upgrades, 39)
    },
    {
      name: 'Ninja mastery',
      value: account.accountOptions?.[232] >= 3 ? 5 : 0
    }
  ]
  return {
    value: addedLevels,
    breakdown
  };
}

export const applyTalentAddedLevels = (talents, flatTalents, addedLevels) => {
  if (flatTalents) {
    return flatTalents.map((talent) => ({
      ...talent,
      level: talent.level >= 1 && !isTalentExcluded(talent?.skillIndex)
        ? Math.floor(talent.level + addedLevels)
        : talent.level,
      baseLevel: talent.level
    }));
  }
  return Object.entries(talents).reduce((res, [key, data]) => {
    const { orderedTalents } = data;
    const updatedTalents = orderedTalents?.map((talent) => ({
      ...talent,
      level: talent.level >= 1 && !isTalentExcluded(talent?.skillIndex)
        ? Math.floor(talent.level + addedLevels)
        : talent.level,
      baseLevel: talent.level
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

const isTalentExcluded = (skillIndex) => {
  return 49 <= skillIndex && 59 >= skillIndex || 149 === skillIndex || 374 === skillIndex || 539 === skillIndex || 505 === skillIndex || 614 < skillIndex;
}

export const getFamilyBonusValue = function (e, t, n, a) {
  return 10 > e && -1 !== t.indexOf('decay')
    ? Math.round(100 * e) / 100
    : 1 > e || ('add' === t && 1 > a && 100 > e) || (25 > e && 'decay' === t) ? Math.round(10 * e) / 10 : Math.round(e);
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
    if (index === 42 || index === 79) {
      return true;
    }
    if (index === 146) {
      const bloodBerserkers = characters?.filter((character) => checkCharClass(character?.class, 'Blood_Berserker'));
      const lastBerserker = bloodBerserkers.at(-1);
      if (!lastBerserker) return Math.pow(1.1, 0);
      const superChows = lastBerserker?.chow.finished?.[1];
      return Math.pow(1.1, superChows ?? 0);
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

export const relevantTalents = {
  32: true, // Printer_Go_Brr
  130: true, // Refinery_Throttle
  490: true, // Cranium,
  25: true, // ITS_YOUR_BIRTHDAY!,
  45: true, // VOID_SPEED_RERUN,
  370: true, // ARENA_SPIRIT
  145: true // TASTE_TEST
}

export const calcTalentMaxLevel = (characters) => {
  const mappedLevels = characters.reduce((result, { flatTalents, flatStarTalents }) => {
    [...(flatTalents || []), ...(flatStarTalents || [])].forEach(({ skillIndex, maxLevel }) => {
      if (!result?.[skillIndex] || (maxLevel > result?.[skillIndex])) {
        result[skillIndex] = maxLevel;
      }
    })
    return result;
  }, {});
  return Object.values(mappedLevels).reduce((sum, level) => sum + level, 0);
}
export const calcTotalStarTalent = (characters, account) => {
  const levels = characters.reduce((result, character) => {
    const basePoints = character?.skillsInfoArray?.reduce((sum, { level }, index) => index > 0 && index <= 9
      ? sum + level
      : sum, -3);
    const talentBonus = getTalentBonus(character?.talents, 0, 'STAR_PLAYER');
    const secondTalentBonus = getTalentBonus(character?.starTalents, null, 'STONKS!');
    const thirdTalentBonus = getTalentBonus(character?.talents, 1, 'SUPERNOVA_PLAYER');
    const highestLevelElementalSorc = getHighestLevelOfClass(account?.charactersLevels, 'Elemental_Sorcerer', true);
    let familyEffBonus = getFamilyBonusBonus(classFamilyBonuses, '_STAR_TAB_TALENT_POINTS', highestLevelElementalSorc);
    if (checkCharClass(character?.class, 'Elemental_Sorcerer')) {
      familyEffBonus *= (1 + getTalentBonus(character?.talents, 3, 'THE_FAMILY_GUY') / 100);
      const familyBonus = getFamilyBonus(classFamilyBonuses, '_STAR_TAB_TALENT_POINTS');
      familyEffBonus = getFamilyBonusValue(familyEffBonus, familyBonus?.func, familyBonus?.x1, familyBonus?.x2);
    }
    const stampBonus = getStampsBonusByEffect(account, 'Talent_Points_for_Star_Tab')
    const guildBonus = getGuildBonusBonus(account?.guild?.guildBonuses, 11);
    const flurboBonus = getDungeonFlurboStatBonus(account?.dungeons?.upgrades, 'Talent_Pts');
    const cardPassiveBonus = getCardBonusByEffect(account?.cards, 'Star_Talent_Pts_(Passive)');
    const sigilBonus = getSigilBonus(account?.alchemy?.p2w?.sigils, 'TWO_STARZ');
    const achievement = getAchievementStatus(account?.achievements, 212);
    const secondAchievement = getAchievementStatus(account?.achievements, 289);
    const thirdAchievement = getAchievementStatus(account?.achievements, 305);
    const shinyBonus = getShinyBonus(account?.breeding?.pets, 'Star_Talent_Pts');
    const bribeBonus = getBribeBonus(account?.bribes, 'Star_Scraper');
    const fractalIsland = getIsland(account, 'Fractal');
    const fractalBonusUnlocked = fractalIsland?.shop?.find(({
                                                              effect,
                                                              unlocked
                                                            }) => effect.includes('Star_Talent_Pts') && unlocked);
    const vaultUpgradeBonus = getUpgradeVaultBonus(account?.upgradeVault?.upgrades, 53);
    const companionBonus = isCompanionBonusActive(account, 20) ? account?.companions?.list?.at(20)?.bonus : 0;
    const totalStarPoints = Math.floor(character?.level - 1 + (basePoints + talentBonus + (account?.talentPoints?.[5]
      + familyEffBonus + (secondTalentBonus + (stampBonus
        + (thirdTalentBonus + (Math.floor(guildBonus) + (flurboBonus + (cardPassiveBonus
          + (sigilBonus + (10 * achievement + (20 * secondAchievement + (20 * thirdAchievement
            + (shinyBonus + (bribeBonus + 100 * (fractalBonusUnlocked
              ? 1
              : 0) + vaultUpgradeBonus + companionBonus)))))))))))))))
    return {
      ...result,
      [character.name]: totalStarPoints
    };
  }, {});
  return Math.max(...Object.values(levels));
}