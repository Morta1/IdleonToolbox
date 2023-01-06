import { lavaLog, tryToParse } from "../utility/helpers";
import { filteredLootyItems, keysMap } from "./parseMaps";
import { items } from "../data/website-data";
import { talentPagesMap } from "./talents";
import { getMealsBonusByEffectOrStat } from "./cooking";
import { getBubbleBonus, getVialsBonusByEffect } from "./alchemy";
import { getStampsBonusByEffect } from "./stamps";
import { getAchievementStatus } from "./achievements";
import { getJewelBonus, getLabBonus } from "./lab";

export const getLibraryBookTimes = (idleonData, account) => {
  const bookCount = account?.accountOptions?.[55];
  const timeAway = account?.timeAway;
  const breakpoints = [16, 18, 20].map((maxCount) => {
    return {
      breakpoint: maxCount,
      time: calcTimeToXBooks(bookCount, maxCount, account, idleonData) - timeAway?.BookLib
    }
  })
  return {
    bookCount,
    next: getTimeToNextBooks(bookCount, account, idleonData) - timeAway?.BookLib,
    breakpoints
  }
}

const calcTimeToXBooks = (bookCount, maxCount, account, idleonData) => {
  let time = 0;
  for (let i = bookCount; i < maxCount; i++) {
    time += getTimeToNextBooks(i, account, idleonData);
  }
  return time;
}

export const getTimeToNextBooks = (bookCount, account, idleonData) => {
  const towersLevels = tryToParse(idleonData?.Tower) || idleonData?.Tower;
  const spelunkerObolMulti = getLabBonus(account?.lab.labBonuses, 8); // gem multi
  const blackDiamondRhinestone = getJewelBonus(account?.lab?.jewels, 16, spelunkerObolMulti);
  const mealBonus = 1 + getMealsBonusByEffectOrStat(account?.cooking?.meals, 'Library_checkout_Speed', null, blackDiamondRhinestone) / 100;
  const bubbleBonus = getBubbleBonus(account?.alchemy?.bubbles, 'kazam', 'IGNORE_OVERDUES', false);
  const vialBonus = getVialsBonusByEffect(account?.alchemy?.vials, 'Talent_Book_Library');
  const stampBonus = getStampsBonusByEffect(account?.stamps, 'Faster_Books')
  const libraryTowerLevel = towersLevels?.[1];
  const math = 3600 / ((mealBonus * (1 + (5 * libraryTowerLevel + bubbleBonus + ((vialBonus)
    + (stampBonus + Math.min(30, Math.max(0, 30 * getAchievementStatus(account?.achievements, 145)))))) / 100))) * 4;

  return Math.round(math * (1 + (10 * Math.pow(bookCount, 1.4)) / 100));
}

export const getLooty = (idleonData) => {
  const lootyRaw = idleonData?.Cards?.[1] || tryToParse(idleonData?.Cards1);
  const allItems = JSON.parse(JSON.stringify(items)); // Deep clone
  lootyRaw.forEach((lootyItemName) => {
    if (allItems?.[lootyItemName]?.displayName) {
      delete allItems?.[lootyItemName];
    }
  });
  const x1Extension = ['sail', 'bits'];
  return {
    missingItems: Object.keys(allItems).reduce(
      (res, key) =>
        !key.includes("DungWeapon")
          ? [
            ...res,
            {
              name: allItems?.[key]?.displayName,
              rawName: x1Extension.find((str) => key.toLowerCase().includes(str)) ? `${key}_x1` : key,
              obtainable: !filteredLootyItems[key]
            }
          ]
          : res,
      []
    ),
    lootedItems: lootyRaw.filter((item) => !item.includes("DungW")).length,
    rawLootedItems: lootyRaw?.length
  };
};

export const getCurrencies = (idleonData) => {
  const keys = idleonData?.CurrenciesOwned?.["KeysAll"] || idleonData?.CYKeysAll;
  if (idleonData?.CurrenciesOwned) {
    return {
      ...idleonData?.CurrenciesOwned,
      KeysAll: keys.reduce((res, keyAmount, index) => (keyAmount > 0 ? [...res,
        { amount: keyAmount, ...keysMap[index] }] : res), [])
    };
  }

  return {
    WorldTeleports: idleonData?.CYWorldTeleports,
    KeysAll: keys.reduce((res, keyAmount, index) => (keyAmount > 0 ? [...res,
      { amount: keyAmount, ...keysMap[index] }] : res), []),
    ColosseumTickets: idleonData?.CYColosseumTickets,
    ObolFragments: idleonData?.CYObolFragments,
    SilverPens: idleonData?.CYSilverPens,
    GoldPens: idleonData?.CYGoldPens,
    DeliveryBoxComplete: idleonData?.CYDeliveryBoxComplete,
    DeliveryBoxStreak: idleonData?.CYDeliveryBoxStreak,
    DeliveryBoxMisc: idleonData?.CYDeliveryBoxMisc,
    minigamePlays: idleonData?.PVMinigamePlays_1,
  };
};

export const getBundles = (idleonData) => {
  const bundlesRaw = tryToParse(idleonData?.BundlesReceived) || idleonData?.BundlesReceived;
  return Object.entries(bundlesRaw)
    ?.reduce(
      (res, [bundleName, owned]) =>
        owned
          ? [
            ...res,
            {
              name: bundleName,
              owned: !!owned
            }
          ]
          : res,
      []
    )
    .sort((a, b) => a?.name?.match(/_[a-z]/i)?.[0].localeCompare(b?.name?.match(/_[a-z]/i)?.[0]));
};

export const isArenaBonusActive = (arenaWave, waveReq, bonusNumber) => {
  const waveReqArray = waveReq.split(" ");
  if (bonusNumber > waveReqArray.length) {
    return false;
  }
  return arenaWave >= waveReqArray[bonusNumber];
};

export const calculateAfkTime = (playerTime) => {
  return parseFloat(playerTime) * 1e3;
};

export const getAllCapsBonus = (guildBonus, telekineticStorageBonus, shrineBonus, zergPrayer, ruckSackPrayer, bribeCapBonus) => {
  return (1 + (guildBonus + telekineticStorageBonus) / 100) * (1 + shrineBonus / 100) * (1 + bribeCapBonus / 100) * Math.max(1 - zergPrayer / 100, 0.4) * (1 + ruckSackPrayer / 100);
};

export const getMaterialCapacity = (bag, capacities) => {
  const {
    allCapacity,
    mattyBagStampBonus,
    gemShopCarryBonus,
    masonJarStampBonus,
    extraBagsTalentBonus,
    starSignExtraCap
  } = capacities;
  const stampMatCapMath = 1 + mattyBagStampBonus / 100;
  const gemPurchaseMath = 1 + (25 * gemShopCarryBonus) / 100;
  const additionalCapMath = 1 + (masonJarStampBonus + starSignExtraCap) / 100; // ignoring star sign
  const talentBonusMath = 1 + extraBagsTalentBonus / 100;
  const bCraftCap = bag?.capacity;
  return Math.floor(bCraftCap * stampMatCapMath * gemPurchaseMath * additionalCapMath * talentBonusMath * allCapacity);
};

export const getSpeedBonusFromAgility = (agility = 0) => {
  let base = (Math.pow(agility + 1, 0.37) - 1) / 40;
  if (agility > 1000) {
    base = ((agility - 1000) / (agility + 2500)) * 0.5 + 0.297;
  }
  return base * 2 + 1;
};

export const getHighestLevelOfClass = (characters, className) => {
  const highest = characters?.reduce((res, { level, class: cName }) => {
    if (res?.[cName]) {
      res[cName] = Math.max(res?.[cName], level);
    } else {
      res[cName] = level;
    }
    return res;
  }, {});
  const allClasses = talentPagesMap?.[className];
  const classAlias = allClasses?.find((cName) => highest?.[cName]);
  return highest?.[classAlias];
};

export const getHighestLevelCharacter = (characters) => {
  const levels = characters?.map(({ level }) => level);
  return Math.max(...levels);
};

export const getGoldenFoodMulti = (familyBonus, equipmentGoldFoodBonus, hungryForGoldTalentBonus, goldenAppleStamp, goldenFoodAchievement, goldenFoodBubbleBonus, goldenFoodSigilBonus) => {
  return Math.max(familyBonus, 1) + (equipmentGoldFoodBonus + (hungryForGoldTalentBonus + goldenAppleStamp + goldenFoodAchievement + goldenFoodBubbleBonus + goldenFoodSigilBonus)) / 100;
};

export const getGoldenFoodBonus = (goldenFoodMulti, amount, stack) => {
  if (!amount || !stack) return 0;
  return amount * goldenFoodMulti * 0.05 * lavaLog(1 + stack) * (1 + lavaLog(1 + stack) / 2.14);
};

export const getAllSkillExp = (sirSavvyStarSign, cEfauntCardBonus, goldenHamBonus, skillExpCardSetBonus, summereadingShrineBonus, ehexpeeStatueBonus, unendingEnergyBonus, skilledDimwitCurse, theRoyalSamplerCurse, equipmentBonus, maestroTransfusionTalentBonus, duneSoulLickBonus, dungeonSkillExpBonus, myriadPostOfficeBox) => {
  return sirSavvyStarSign + (cEfauntCardBonus + goldenHamBonus) + (skillExpCardSetBonus + summereadingShrineBonus + ehexpeeStatueBonus + (unendingEnergyBonus - skilledDimwitCurse - theRoyalSamplerCurse + (equipmentBonus + (maestroTransfusionTalentBonus + (duneSoulLickBonus + dungeonSkillExpBonus + myriadPostOfficeBox)))));
};

export const calculateLeaderboard = (characters) => {
  const leaderboardObject = characters.reduce((res, { name, skillsInfo }) => {
    for (const [skillName, skillLevel] of Object.entries(skillsInfo)) {
      if (!res[skillName]) {
        res[skillName] = { ...res[skillName], [name]: skillLevel };
      } else {
        const joined = { ...res[skillName], [name]: skillLevel };
        let lowestIndex = Object.keys(joined).length;
        res[skillName] = Object.entries(joined)
          .sort(([_, { level: aLevel }], [__, { level: bLevel }]) => bLevel - aLevel)
          .reduceRight((res, [charName, charSkillLevel]) => {
            return { ...res, [charName]: { ...charSkillLevel, rank: lowestIndex-- } };
          }, {});
      }
    }
    return res;
  }, {});
  return Object.entries(leaderboardObject)?.reduce((res, [skillName, characters]) => {
    const charsObjects = Object.entries(characters).reduce((response, [charName, charSkill]) => {
      return { ...response, [charName]: { [skillName]: charSkill } };
    }, {});
    return Object.entries(charsObjects).reduce((response, [charName, charSkill]) => {
      return { ...response, [charName]: { ...(res[charName] || {}), ...charSkill } };
    }, {});
  }, {});
};

