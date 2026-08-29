import { growth } from '@utility/helpers';
import { isTalentBannedForAllLevels } from '@utility/talentBans';
import { classes, classFamilyBonuses, talents } from '@website-data';
import { getAchievementStatus } from './achievements';
import { getHighestLevelOfClass, isCompanionBonusActive } from './misc';
import { getMinorDivinityBonus } from './world-5/divinity';
import { getEquinoxBonus } from './world-3/equinox';
import { getFamilyBonus, getFamilyBonusBonus } from '@parsers/family';
import { getStampsBonusByEffect } from '@parsers/world-1/stamps';
import { getGuildBonusBonus } from '@parsers/guild';
import { getDungeonFlurboStatBonus } from '@parsers/dungeons';
import { getCardLevel } from '@parsers/cards';
import { getSigilBonus } from '@parsers/world-2/alchemy';
import { getShinyBonus } from '@parsers/world-4/breeding';
import { getBribeBonus } from '@parsers/world-1/bribes';
import { getIsland } from '@parsers/world-2/islands';
import { getGrimoireBonus } from '@parsers/class-specific/grimoire';
import { getUpgradeVaultBonus } from '@parsers/misc/upgradeVault';
import { skillIndexMap } from '@parsers/parseMaps';
import { getArmorSetBonus } from '@parsers/world-3/armorSmithy';
import { getTesseractBonus } from '@parsers/class-specific/tesseract';
import { isSuperbitUnlocked } from '@parsers/world-5/gaming';
import { getLegendTalentBonus } from './world-7/legendTalents';
import { getZenithBonus } from './world-1/statues';


export const getTalentBonus = (talents: any = [], talentName?: any, yBonus?: any, useMaxLevel?: any, addedLevels?: any, useMaxAndAddedLevels?: any, forceTalent = false) => {
  if (!talents || !Array.isArray(talents)) return 0;
  const talent = talents?.find(({ name }) => name === talentName);
  if (!talent) return 0;
  let level = talent?.level;
  if (talent?.level > 0 || forceTalent) {
    level = useMaxLevel ? talent?.maxLevel : talent?.level;
    if (useMaxAndAddedLevels && (forceTalent || (talent?.level > talent?.maxLevel))) {
      level = talent?.maxLevel + addedLevels;
    }
    else {
      level = addedLevels ? level - addedLevels : level;
    }
  }
  if (yBonus) {
    return growth(talent?.funcY, level, talent?.y1, talent?.y2, false) ?? 0;
  }
  return growth(talent?.funcX, level, talent?.x1, talent?.x2, false) ?? 0;
}

export const getTalentBonusIfActive = (activeBuffs: any, tName: any, variant = 'x') => {
  return activeBuffs?.reduce((res: any, {
    name,
    funcX,
    level,
    x1,
    x2,
    funcY,
    y1,
    y2
  } : any = {}) => name === tName ? variant === 'x'
    ? growth(funcX, level, x1, x2, false)
    : growth(funcY, level, y1, y2, false) : res, 0) ?? 0;
}

import { CLASSES, talentPagesMap, getBaseClass } from './classDefinitions';

// Re-exported so the many modules importing these from talents.ts keep working. Modules that
// need ONLY these should import from ./classDefinitions instead, to avoid pulling this file
// and its 18 parser imports into their bundle.
export { CLASSES, talentPagesMap, getBaseClass };

// { 0: 'strength', 1: 'agility', 2: 'wisdom', 3: 'luck', 4: 'level' }
export const mainStatMap = {
  [CLASSES.Beginner]: 'luck',
  [CLASSES.Journeyman]: 'luck',
  [CLASSES.Maestro]: 'luck',
  [CLASSES.Voidwalker]: 'luck',

  [CLASSES.Warrior]: 'strength',
  [CLASSES.Barbarian]: 'strength',
  [CLASSES.Blood_Berserker]: 'strength',
  [CLASSES.Death_Bringer]: 'strength',
  [CLASSES.Squire]: 'strength',
  [CLASSES.Divine_Knight]: 'strength',
  [CLASSES.Royal_Guardian]: 'strength',

  [CLASSES.Archer]: 'agility',
  [CLASSES.Bowman]: 'agility',
  [CLASSES.Siege_Breaker]: 'agility',
  [CLASSES.Hunter]: 'agility',
  [CLASSES.Beast_Master]: 'agility',
  [CLASSES.Wind_Walker]: 'agility',

  [CLASSES.Mage]: 'wisdom',
  [CLASSES.Shaman]: 'wisdom',
  [CLASSES.Bubonic_Conjuror]: 'wisdom',
  [CLASSES.Arcane_Cultist]: 'wisdom',
  [CLASSES.Wizard]: 'wisdom',
  [CLASSES.Elemental_Sorcerer]: 'wisdom'
};

export const starTalentsPages = ['Special Talent 1', 'Special Talent 2',
  'Special Talent 3', 'Special Talent 4', 'Special Talent 5'];

export const createTalentPage = (className: any, pages: any, talentsObject: any, maxTalentsObject: any, mergeArray?: any) => {
  if (!pages) return { flat: [], talents: {} };
  return pages.reduce((res: any, className: any, index: any) => {
    const orderedTalents = Object.entries((talents as Record<string, any>)?.[className] || {})?.map(([, talentDetails]: [string, any]) => {
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

export const getActiveBuffs = (activeBuffs: any, talents: any) => {
  return activeBuffs?.map(([talentId]: any) => talents?.find(({ talentId: tId }: any) => talentId === tId))?.filter((talent: any) => talent);
}

export const getAllTalentAddedLevels = (baseLevel: number, activeCharacter: any) => {
  // AllTalentLVz returns 0 for banned ids, and getbonus2 hands it the talent's LEVEL where a talent
  // id belongs, so a talent whose base level lands on a banned id gets no added levels at all.
  if (isTalentBannedForAllLevels(baseLevel)) return 0;
  const addedLevels = activeCharacter?.addedLevels ?? 0;
  // Same level-as-id mix-up: the super talent list is searched for the base LEVEL, so a talent
  // sitting on a level that happens to be one of the active character's super talent ids collects
  // the per-talent super bonus on top.
  const isSuper = activeCharacter?.superTalentsInfo?.talents?.some(({ talentIndex }: any) => talentIndex === baseLevel);
  return isSuper ? addedLevels + (activeCharacter?.superTalentsInfo?.bonus ?? 0) : addedLevels;
};

// getbonus2 reads the added levels off whichever character is being played, so an account-wide
// bonus has no single value. The save never names that character, but PTimeAway identifies it:
// the played character's stamp tracks the clock while every other one stays frozen at the moment
// it was left, so the newest stamp is the one that was active when the save was taken.
// Characters that have never been played carry no stamp; if that's all of them, fall back to the
// highest added levels, which is the ceiling of the range.
export const getBestActiveCharacter = (characters: any) => {
  const mostRecent = characters?.reduce((best: any, character: any) => (
    Number.isFinite(character?.afkTime) && character.afkTime > 0 && character.afkTime > (best?.afkTime ?? 0)
      ? character
      : best
  ), null);
  return mostRecent ?? characters?.reduce((best: any, character: any) => (
    (character?.addedLevels ?? 0) > (best?.addedLevels ?? -1) ? character : best
  ), null);
};

// getbonus2(1, id, -1) walks every character and never looks at class - filtering by class only
// matches it because most talent ids belong to a single class. THE_FAMILY_GUY is id 144 on six
// different class pages, so for that one the class filter throws away the real maximum. Pass a null
// className to get the game's actual behaviour.
export const getHighestTalentAcrossCharacters = (characters: any, talentName?: any, activeCharacter?: any, yBonus?: any) => {
  return getHighestTalentByClass(characters, null, talentName, yBonus, false, false, false, activeCharacter);
};

// getbonus2 evaluates growth() for every character including the ones sitting at level 0, so a
// talent nobody owns still answers with its level-0 value - 0 for add/decay, but 1 for decayMulti
// and x1 for bigBase, which are the identity for a multiplier. Returning 0 there is the classic
// empty-account bug: tesseract reads `100 * (talent - 1)` and would land on -100 instead of 0.
const talentMetaByName: Record<string, any> = Object.values(talents as Record<string, any>)
  .reduce((map: Record<string, any>, page: any) => {
    Object.values(page as Record<string, any>).forEach((talent: any) => {
      if (talent?.name && !map[talent.name]) map[talent.name] = talent;
    });
    return map;
  }, {});

const unownedTalentBonus = (talentName: any, yBonus: any) => {
  const meta = talentMetaByName[talentName];
  if (!meta) return 0;
  return (yBonus
    ? growth(meta.funcY, 0, meta.y1, meta.y2, false)
    : growth(meta.funcX, 0, meta.x1, meta.x2, false)) ?? 0;
};

export const getHighestTalentByClass = (characters: any, className: any, talentName?: any, yBonus?: any, useMaxLevel?: any, reduceAddedLevels = false, excludeSuperTalent = false, activeCharacter?: any) => {
  const classes = className == null
    ? (characters ?? [])
    : characters?.filter((character: any) => checkCharClass(character?.class, className));
  const seed = activeCharacter ? unownedTalentBonus(talentName, yBonus) : 0;
  return classes?.reduce((res: any, { flatTalents, addedLevels }: any) => {
    let subtractLevels: any = false;
    if (activeCharacter) {
      // Mimic game's getbonus2(1, id, -1):
      // - talentIndex >= 100: growth(baseLevel + AllTalentLVz(baseLevel))
      // - talentIndex < 100: growth(baseLevel) - no addedLevels adjustment
      // The y-variant is a separate branch in the game that reads SkillLevels straight, so added
      // levels never reach it whatever the talent id.
      const talentObj = flatTalents?.find(({ name }: any) => name === talentName);
      if (talentObj) {
        const level = talentObj.talentId >= 100 && !yBonus
          ? talentObj.baseLevel + getAllTalentAddedLevels(talentObj.baseLevel, activeCharacter)
          : talentObj.baseLevel;
        const func = yBonus ? talentObj.funcY : talentObj.funcX;
        const p1 = yBonus ? talentObj.y1 : talentObj.x1;
        const p2 = yBonus ? talentObj.y2 : talentObj.x2;
        const bonus = growth(func, level, p1, p2, false) ?? 0;
        return bonus > res ? bonus : res;
      }
      return res;
    } else if (excludeSuperTalent) {
      const talentObj = flatTalents?.find(({ name }: any) => name === talentName);
      const superTalentAmount = talentObj?.isSuperTalent ? (talentObj.level - talentObj.baseLevel - addedLevels) : 0;
      subtractLevels = superTalentAmount || false;
    } else if (reduceAddedLevels) {
      subtractLevels = addedLevels + 1;
    }
    const talent = getTalentBonus(flatTalents, talentName, yBonus, useMaxLevel, subtractLevels);
    if (talent > res) {
      return talent
    }
    return res;
  }, seed);
}

// A null className means every character, matching getHighestTalentByClass - callers that pair the
// two must scope them the same way or they end up describing different characters.
export const getCharacterByHighestTalent = (characters: any, className: any, talentName?: any, yBonus?: any, useMaxLevel?: any) => {
  const classes = className == null
    ? (characters ?? [])
    : characters?.filter((character: any) => checkCharClass(character?.class, className));
  return classes?.reduce((res: any, character: any) => {
    const { flatTalents } = character;
    const talent = getTalentBonus(flatTalents, talentName, yBonus, useMaxLevel);
    if (talent > res) {
      return character;
    }
    return res;
  }, 0);
}

export const getHighestMaxLevelTalentByClass = (characters: any, className: any, talentName: any) => {
  const classes = characters?.filter((character: any) => checkCharClass(character?.class, className));
  return classes?.reduce((res: any, { flatTalents }: any) => {
    const talent = flatTalents?.find(({ name }: any) => name === talentName);
    if (talent?.maxLevel > res?.maxLevel) {
      return talent;
    }
    return res;
  }, { maxLevel: 0 });
}

export const getSuperTalentAddedLevels = (account: any) => {
  return Math.round(50 + getLegendTalentBonus(account, 7) + getZenithBonus(account, 5));
}

export const getTalentAddedLevels = (talents: any, presetIndex: any, linkedDeity: any, secondLinkedDeity: any, deityMinorBonus: any, secondDeityMinorBonus: any, familyEffBonus: any, account: any, character: any) => {
  // "AllTalentLV" == e
  let addedLevels = 0, breakdown;
  const superTalentBonus = getSuperTalentAddedLevels(account);
  let superTalentsInfo: any = {
    talents: [] as any[],
    bonus: 0,
  }
  const talentSpelunkArrays = account?.spelunking?.talentSpelunkArrays;
  if (character?.playerId !== undefined && talentSpelunkArrays && Array.isArray(talentSpelunkArrays)) {
    const characterIndex = character.playerId;
    const spelunkArrayIndex = Math.round(characterIndex + 12 * presetIndex);

    const spelunkArray = talentSpelunkArrays[spelunkArrayIndex];
    if (Array.isArray(spelunkArray) && spelunkArray.length > 0) {
      superTalentsInfo.talents = spelunkArray
        .filter(talentIndex => talentIndex !== undefined && talentIndex !== null && talentIndex !== -1)
        .map(talentIndex => {
          return {
            talentIndex,
            presetIndex
          }
        });
      if (superTalentsInfo.talents.length > 0) {
        superTalentsInfo.bonus = superTalentBonus;
      }
    }
  }

  const pocketLinked = account?.hole?.godsLinks?.find(({ index }: any) => index === 1);
  if (isCompanionBonusActive(account, 0) || pocketLinked) {
    addedLevels += Math.ceil(getMinorDivinityBonus(character, account, 1));
  }
  else {
    if (linkedDeity === 1) {
      addedLevels += Math.ceil(deityMinorBonus);
    }
    else if (secondLinkedDeity === 1) {
      addedLevels += Math.ceil(secondDeityMinorBonus);
    }
  }
  breakdown = [{ name: 'God Bonus', value: Math.ceil(addedLevels) }];
  const symbolTalent = talents?.[3]?.orderedTalents?.find(({ name }: any) => name.includes('SYMBOLS_OF_BEYOND_'));
  let symbolAddedLevel = 0;
  if (symbolTalent && symbolTalent?.level > 0) {
    symbolAddedLevel = growth(symbolTalent?.funcX, symbolTalent?.level, symbolTalent?.x1, symbolTalent?.x2, false) ?? 0;
    addedLevels += symbolAddedLevel;
  }
  if (getAchievementStatus(account?.achievements, 291)) {
    addedLevels += 1;
  }
  if (familyEffBonus) {
    addedLevels += Math.floor(familyEffBonus);
  }
  if (isCompanionBonusActive(account, 1)) {
    addedLevels += account?.companions?.list?.at(1)?.bonus;
  }
  if (account.accountOptions?.[232] >= 3) { // ninja mastery
    addedLevels += 5;
  }
  addedLevels += getEquinoxBonus(account?.equinox?.upgrades, 'Equinox_Symbols');
  addedLevels += getGrimoireBonus(account?.grimoire?.upgrades, 39);
  addedLevels += getArmorSetBonus(account, 'KATTLEKRUK_SET');
  addedLevels += Math.min(5, getTesseractBonus(account, 57));
  const superbit = isSuperbitUnlocked(account, 'Timmy_Talented') ? 1 : 0;
  const superbitBonus = Math.max(0, Math.floor(((character?.level - 500) / 100) * superbit));
  addedLevels += superbitBonus;

  breakdown = {
    statName: "Added levels",
    totalValue: addedLevels,
    categories: [
      {
        name: "Additive",
        sources: [
          ...breakdown,
          { name: 'Symbol of Beyond', value: symbolAddedLevel },
          { name: 'Family', value: Math.floor(familyEffBonus) },
          { name: 'Achievement', value: getAchievementStatus(account?.achievements, 291) ? 1 : 0 },
          {
            name: 'Companion',
            value: isCompanionBonusActive(account, 1) ? account?.companions?.list?.at(1)?.bonus : 0
          },
          {
            name: 'Equinox',
            value: getEquinoxBonus(account?.equinox?.upgrades, 'Equinox_Symbols')
          },
          {
            name: 'Grimoire',
            value: getGrimoireBonus(account?.grimoire?.upgrades, 39)
          },
          {
            name: 'Kattlekruk set',
            value: getArmorSetBonus(account, 'KATTLEKRUK_SET')
          },
          {
            name: 'Tesseract',
            value: Math.min(5, getTesseractBonus(account, 57))
          },
          {
            name: 'Ninja mastery',
            value: account.accountOptions?.[232] >= 3 ? 5 : 0
          },
          {
            name: 'Superbit',
            value: superbitBonus
          },
          {
            name: 'Super talent (per talent)',
            value: superTalentsInfo.bonus
          }
        ],
      },
    ],
  }
  return {
    value: addedLevels,
    breakdown,
    superTalentsInfo
  };
}

export const applyTalentAddedLevels = (talents: any, flatTalents: any, addedLevels: any, superTalentsInfo: any, presetIndex: any = null) => {
  if (flatTalents) {
    return flatTalents.map((talent: any) => {
      const superTalent = superTalentsInfo.talents.find(({ talentIndex }: any) => talentIndex === talent?.skillIndex);
      const superTalentBonus = (superTalent && superTalent.presetIndex === presetIndex) ? superTalentsInfo.bonus : 0;

      return {
        ...talent,
        level: talent.level >= 1 && !isTalentBannedForAllLevels(talent?.skillIndex)
          ? Math.floor(talent.level + addedLevels + superTalentBonus)
          : talent.level,
        baseLevel: talent.level,
        isSuperTalent: !!superTalent
      }
    });
  }
  return Object.entries(talents).reduce((res: any, [key, data]: [string, any]) => {
    const { orderedTalents } = data;
    const updatedTalents = orderedTalents?.map((talent: any) => {
      const superTalent = superTalentsInfo.talents.find(({ talentIndex }: any) => talentIndex === talent?.skillIndex);
      const superTalentBonus = (superTalent && superTalent.presetIndex === presetIndex) ? superTalentsInfo.bonus : 0;

      return {
        ...talent,
        level: talent.level >= 1 && !isTalentBannedForAllLevels(talent?.skillIndex)
          ? Math.floor(talent.level + addedLevels + superTalentBonus)
          : talent.level,
        baseLevel: talent.level,
        isSuperTalent: !!superTalent
      }
    });
    return {
      ...res,
      [key]: {
        ...(data as any),
        orderedTalents: updatedTalents
      }
    }
  }, {} as any);
}

// Talent Book Library eligibility. Only main class talents (skillIndex < 615, star talents start
// there) can be raised by books, EXCEPT the page 1 stat-allocation talents (STR/AGI/WIS/LUK) and
// their paired Basics-tab talents, which the game excludes via CustomLists.RANDOlist[16] and shows
// "This Book is not Available" for instead of a Book Lv Range.
const BOOK_ELIGIBLE_MAX_INDEX = 615;
export const BOOK_INELIGIBLE_INDICES = [10, 11, 12, 23, 75, 79, 86, 87, 266, 267, 446, 447];

export const isBookEligibleTalent = (skillIndex: any) => {
  const index = Number(skillIndex);
  return index < BOOK_ELIGIBLE_MAX_INDEX && !BOOK_INELIGIBLE_INDICES.includes(index);
}

export const getFamilyBonusValue = function (e: any, t: any, n: any, a: any) {
  return 10 > e && -1 !== t.indexOf('decay')
    ? Math.round(100 * e) / 100
    : 1 > e || ('add' === t && 1 > a && 100 > e) || (25 > e && 'decay' === t) ? Math.round(10 * e) / 10 : Math.round(e);
}

export const getVoidWalkerTalentEnhancements = (characters: any, account: any, pointsInvested: any, index?: any, character?: any) => {
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
      const bloodBerserkers = characters?.filter((character: any) => checkCharClass(character?.class, CLASSES.Blood_Berserker));
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
      }
      else {
        base = ((stats?.luck - 1e3) / (stats?.luck + 2500)) * 0.8 + 0.3963
      }
      const talentBonus = getTalentBonus(character?.flatTalents, 'LUCKY_CHARMS');
      return (base * (1 + talentBonus / 100)) / 1.8;
    }
  }
  return 0;
}

export const checkCharClass = (charClass: any, className: any) => {
  return talentPagesMap[charClass]?.includes(className);
}

export const getBubonicGreenTube = (character: any, characters: any, account: any) => {
  const charCords = account?.lab?.playersCords?.[character?.playerId];
  const bubosCords = account?.lab?.playersCords?.filter(({ class: cName }: any) => checkCharClass(cName, CLASSES.Bubonic_Conjuror));
  if (!charCords || bubosCords?.length === 0) return 0;
  const affected = bubosCords?.some(({ x }: any) => x > charCords?.x);
  if (affected) {
    return getHighestTalentAcrossCharacters(characters, 'GREEN_TUBE', character)
  }
  else {
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

// Game: for each SkillLevelsMAX index it walks every player with a running max seeded at 0, so a
// locked talent's -1 contributes nothing rather than subtracting.
export const calcTalentMaxLevel = (characters: any) => {
  const mappedLevels = characters.reduce((result: any, { flatTalents, flatStarTalents }: any) => {
    [...(flatTalents || []), ...(flatStarTalents || [])].forEach(({ skillIndex, maxLevel }) => {
      const level = Math.max(0, maxLevel ?? 0);
      if (!result?.[skillIndex] || (level > result?.[skillIndex])) {
        result[skillIndex] = level;
      }
    })
    return result;
  }, {});
  return Object.values(mappedLevels).reduce((sum: any, level: any) => sum + level, 0);
}
export const calcTotalStarTalent = (characters: any, account: any) => {
  const levels = characters.reduce((result: any, character: any) => {
    const basePoints = character?.skillsInfoArray?.reduce((sum: any, { level }: any, index: any) => index > 0 && index <= 9
      ? sum + level
      : sum, -3);
    const talentBonus = getTalentBonus(character?.flatTalents, 'STAR_PLAYER');
    const secondTalentBonus = getTalentBonus(character?.flatStarTalents, 'STONKS!');
    const thirdTalentBonus = getTalentBonus(character?.flatTalents, 'SUPERNOVA_PLAYER');
    const highestLevelElementalSorc = getHighestLevelOfClass(account?.charactersLevels, CLASSES.Elemental_Sorcerer, true);
    let familyEffBonus = getFamilyBonusBonus(classFamilyBonuses, '_STAR_TAB_TALENT_POINTS', highestLevelElementalSorc);
    if (checkCharClass(character?.class, CLASSES.Elemental_Sorcerer)) {
      familyEffBonus *= (1 + getTalentBonus(character?.flatTalents, 'THE_FAMILY_GUY') / 100);
      const familyBonus = getFamilyBonus(classFamilyBonuses, '_STAR_TAB_TALENT_POINTS');
      familyEffBonus = getFamilyBonusValue(familyEffBonus, familyBonus?.func, familyBonus?.x1, familyBonus?.x2);
    }
    const stampBonus = getStampsBonusByEffect(account, 'Talent_Points_for_Star_Tab')
    const guildBonus = getGuildBonusBonus(account?.guild?.guildBonuses, 11);
    const flurboBonus = getDungeonFlurboStatBonus(account?.dungeons?.upgrades, 'Talent_Pts');
    // Game: min(5 * CardLv("w4b2"), 50) + min(15 * CardLv("Boss2C"), 100) + min(4 * CardLv("fallEvent1"), 100)
    // Each card is capped on its own, which a summed effect lookup cannot express.
    const starTalentCardLv = (rawName: string) => getCardLevel(account?.cards, rawName);
    const cardPassiveBonus =
      Math.min(5 * starTalentCardLv('w4b2'), 50)
      + Math.min(15 * starTalentCardLv('Boss2C'), 100)
      + Math.min(4 * starTalentCardLv('fallEvent1'), 100);
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
    }: any) => effect.includes('Star_Talent_Pts') && unlocked);
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
  // Game: TotalTalentPoints reads the logged-in character's own levels and bonuses, so this is the
  // active character's star tab total, not the best one across the account.
  const activeCharacter = getBestActiveCharacter(characters);
  return Math.max(0, (levels as any)?.[activeCharacter?.name] ?? 0);
}

export const getCrystalCountdownSkills = () => {
  return Object.values(skillIndexMap).filter((_, index) => index > 0 && index <= 9)
    .reduce((res, { icon }) => ({ ...res, [icon]: true }), {})
}

export const getMaestroHand = (character: any, skillName: any, characters: any, account: any, hand: any) => {
  const bestMaestro = characters?.filter((character: any) => checkCharClass(character?.class, CLASSES.Maestro))?.at(-1);
  let leftHandOfLearningTalentBonus = getTalentBonus(bestMaestro?.flatTalents, hand, false, true);
  const voidWalkerEnhancementEclipse = getTalentBonus(bestMaestro?.flatTalents, 'ENHANCEMENT_ECLIPSE');
  const leftHandEnhancement = getVoidWalkerTalentEnhancements(characters, account, voidWalkerEnhancementEclipse, 42);
  if (checkCharClass(character?.class, CLASSES.Maestro) && leftHandEnhancement) {
    leftHandOfLearningTalentBonus *= 2;
  }
  if (character?.skillsInfo?.[skillName]?.level > bestMaestro?.skillsInfo?.[skillName]?.level) {
    leftHandOfLearningTalentBonus = 0;
  }

  return leftHandOfLearningTalentBonus;
}