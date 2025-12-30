import { tryToParse, notateNumber } from '@utility/helpers';
import { items, itemsArray } from '@website-data';
import { getJadeEmporiumBonus } from '@parsers/world-6/sneaking';
import { getLoreBonus } from '@parsers/world-7/spelunking';
import { isArtifactAcquired } from '@parsers/sailing';
import {
  getEventShopBonus,
  getKillRoyShopBonus,
  isCompanionBonusActive
} from '@parsers/misc';
import { getLegendTalentBonus } from '@parsers/world-7/legendTalents';
import { getBubbleBonus } from '@parsers/alchemy';
import { getCardBonusByEffect } from '@parsers/cards';
import { getClamWorkBonus } from '@parsers/world-7/clamWork';
import { getPlayerLabChipBonus } from '@parsers/lab';

export const getGallery = (idleonData, account) => {
  const rawSpelunk = tryToParse(idleonData?.Spelunk);
  return parseGallery(rawSpelunk, account);
}

const parseGallery = (rawSpelunk, account) => {
  const bonusMulti = getGalleryBonusMulti(rawSpelunk, account);
  const podiumsOwned = getPodiumsOwned(rawSpelunk, account);
  const { bonuses: trophyBonuses, items: trophiesUsed, inventory: inventoryTrophies } = getTrophyBonuses(rawSpelunk, account);
  const { bonuses: nametagBonuses, items: nametagsUsed } = getNametagBonuses(rawSpelunk, account);
  const allTrophies = getAllTrophies(rawSpelunk, account);
  const allNametags = getAllNametags(rawSpelunk, account);

  // Calculate from highest to lowest, subtracting higher levels from lower ones
  const lv4PodiumsOwned = getLv4PodiumsOwned(account);
  const lv3PlusPodiums = getLv3PodiumsOwned(account);
  const lv2PlusPodiums = getLv2PodiumsOwned(account);

  // A podium at level 3+ is not level 2, and a podium at level 4 is not level 3
  const lv3PodiumsOwned = lv3PlusPodiums - lv4PodiumsOwned;
  const lv2PodiumsOwned = lv2PlusPodiums - lv3PlusPodiums;
  
  return {
    bonusMulti,
    trophyBonuses,
    nametagBonuses,
    podiumsOwned,
    lv2PodiumsOwned,
    lv3PodiumsOwned,
    lv4PodiumsOwned,
    trophiesUsed,
    nametagsUsed,
    inventoryTrophies,
    allTrophies,
    allNametags
  }
}

export const getNametagBonus = (account, bonusName) => {
  return account?.gallery?.nametagBonuses?.find((bonus) => bonus.name === bonusName)?.value ?? 0;
}

export const getTrophyBonus = (account, bonusName) => {
  return account?.gallery?.trophyBonuses?.find((bonus) => bonus.name === bonusName)?.value ?? 0;
}

export const getGalleryBonus = (account, bonusName) => {
  return getNametagBonus(account, bonusName) + getTrophyBonus(account, bonusName);
}

const getPodiumLevel = (trophyIndex, account) => {
  if (trophyIndex < 48) return null;
  const podiumOffset = trophyIndex - 48;
  if (getLv4PodiumsOwned(account) > podiumOffset) {
    return 4;
  } else if (getLv3PodiumsOwned(account) > podiumOffset) {
    return 3;
  } else if (getLv2PodiumsOwned(account) > podiumOffset) {
    return 2;
  } else {
    return 1;
  }
}

const getTrophyMultiplier = (trophyIndex, rawSpelunk, account) => {
  let baseMulti = 0.3;
  if (trophyIndex >= 48) {
    const podiumOffset = trophyIndex - 48;
    if (getLv4PodiumsOwned(account) > podiumOffset) {
      baseMulti = 2.5;
    } else if (getLv3PodiumsOwned(account) > podiumOffset) {
      baseMulti = 2;
    } else if (getLv2PodiumsOwned(account) > podiumOffset) {
      baseMulti = 1.5;
    } else {
      baseMulti = 1;
    }
  }
  return baseMulti * getGalleryBonusMulti(rawSpelunk, account);
}

export const getTrophyBonuses = (rawSpelunk, account) => {
  const rawTrophies = rawSpelunk?.[16];
  const trophyCount = rawTrophies?.length;
  const trophyBonusesObj = {};
  const trophiesUsedList = [];
  const inventoryTrophiesList = [];
  const podiumsOwned = getPodiumsOwned(rawSpelunk, account);
  const maxTrophyIndex = Math.min(trophyCount, 48 + podiumsOwned);
  
  // Process inventory trophies (indices 0-47)
  const maxInventoryIndex = Math.min(48, trophyCount);
  for (let trophyIndex = 0; trophyIndex < maxInventoryIndex; trophyIndex++) {
    if (rawTrophies[trophyIndex] >= 1) {
      const trophy = items?.[`Trophy${rawTrophies[trophyIndex]}`];
      if (trophy) {
        // Inventory trophies use base multiplier (0.3) without podium bonuses
        const bonusMulti = 0.3 * getGalleryBonusMulti(rawSpelunk, account);
        
        // Build modified item with bonus values
        const modifiedItem = { ...trophy };
        if (trophy.UQ1txt && trophy.UQ1txt != '0' && trophy.UQ1val && trophy.UQ1val != 0) {
          modifiedItem.UQ1val = notateNumber(trophy.UQ1val * bonusMulti, 'MultiplierInfo');
        }
        if (trophy.UQ2txt && trophy.UQ2txt != '0' && trophy.UQ2val && trophy.UQ2val != 0) {
          modifiedItem.UQ2val = notateNumber(trophy.UQ2val * bonusMulti, 'MultiplierInfo');
        }
        modifiedItem.inventoryIndex = trophyIndex;
        modifiedItem.inventoryMultiplier = bonusMulti;
        inventoryTrophiesList.push(modifiedItem);
        
        // Aggregate bonuses
        for (let uqIndex = 0; uqIndex < 2; uqIndex++) {
          const uqTextKey = 'UQ' + Math.round(uqIndex + 1) + 'txt';
          const uqValueKey = 'UQ' + Math.round(uqIndex + 1) + 'val';
          const uqText = trophy?.[uqTextKey];
          const uqValue = trophy?.[uqValueKey];

          if (uqText != '0') {
            const bonusPropertyName = '' + uqText;
            const bonusPropertyValue = uqValue * bonusMulti;
            trophyBonusesObj[bonusPropertyName] = (trophyBonusesObj[bonusPropertyName] ?? 0) + bonusPropertyValue;
          }
        }

        const statList = 'Weapon_Power,STR,AGI,WIS,LUK,Defence';
        const stats = statList.split(',');
        for (let statIndex = 0; statIndex < stats.length; statIndex++) {
          const statName = stats[statIndex];
          const statValue = trophy?.[statName];
          const statBonusValue = statValue * bonusMulti;
          trophyBonusesObj[statName] = (trophyBonusesObj[statName] ?? 0) + statBonusValue;
        }
      }
    }
  }
  
  // Process podium trophies (indices 48+)
  for (let trophyIndex = 48; trophyIndex < maxTrophyIndex; trophyIndex++) {
    const isTrophyFilled = (trophyIndex - 48) < podiumsOwned && rawTrophies[trophyIndex] >= 1;
    if (isTrophyFilled) {
      const trophy = items?.[`Trophy${rawTrophies[trophyIndex]}`];
      if (trophy) {
        const bonusMulti = getTrophyMultiplier(trophyIndex, rawSpelunk, account);
        const podiumLevel = getPodiumLevel(trophyIndex, account);
        
        // Build modified item with bonus values
        const modifiedItem = { ...trophy };
        if (trophy.UQ1txt && trophy.UQ1txt != '0' && trophy.UQ1val && trophy.UQ1val != 0) {
          modifiedItem.UQ1val = notateNumber(trophy.UQ1val * bonusMulti, 'MultiplierInfo');
        }
        if (trophy.UQ2txt && trophy.UQ2txt != '0' && trophy.UQ2val && trophy.UQ2val != 0) {
          modifiedItem.UQ2val = notateNumber(trophy.UQ2val * bonusMulti, 'MultiplierInfo');
        }
        modifiedItem.podiumLevel = podiumLevel;
        modifiedItem.podiumMultiplier = bonusMulti;
        trophiesUsedList.push(modifiedItem);
        
        // Aggregate bonuses
        for (let uqIndex = 0; uqIndex < 2; uqIndex++) {
          const uqTextKey = 'UQ' + Math.round(uqIndex + 1) + 'txt';
          const uqValueKey = 'UQ' + Math.round(uqIndex + 1) + 'val';
          const uqText = trophy?.[uqTextKey];
          const uqValue = trophy?.[uqValueKey];

          if (uqText != '0') {
            const bonusPropertyName = '' + uqText;
            const bonusPropertyValue = uqValue * bonusMulti;
            trophyBonusesObj[bonusPropertyName] = (trophyBonusesObj[bonusPropertyName] ?? 0) + bonusPropertyValue;
          }
        }

        const statList = 'Weapon_Power,STR,AGI,WIS,LUK,Defence';
        const stats = statList.split(',');
        for (let statIndex = 0; statIndex < stats.length; statIndex++) {
          const statName = stats[statIndex];
          const statValue = trophy?.[statName];
          const statBonusValue = statValue * bonusMulti;
          trophyBonusesObj[statName] = (trophyBonusesObj[statName] ?? 0) + statBonusValue;
        }
      }
    } else {
      const podiumLevel = getPodiumLevel(trophyIndex, account);
      trophiesUsedList.push({
        isEmpty: true,
        trophyIndex,
        podiumLevel,
      });
    }
  }

  return {
    bonuses: Object.entries(trophyBonusesObj).map(([name, value]) => ({ name, value })),
    items: trophiesUsedList,
    inventory: inventoryTrophiesList
  };
}

const getNametagMultiplier = (nametagOwned, rawSpelunk, account) => {
  const multiplierLevels = '1,1.6,2,2.3,2.5';
  const levelIndex = Math.min(4, Math.round(nametagOwned - 1));
  const baseMultiplier = parseFloat(multiplierLevels.split(',')[levelIndex]);
  return baseMultiplier * getGalleryBonusMulti(rawSpelunk, account);
}

export const getNametagBonuses = (rawSpelunk, account) => {
  const rawNametags = rawSpelunk?.[17];
  const nametagCount = rawNametags?.length;
  const nametagBonusesObj = {};
  const nametagsUsedList = [];
  
  for (let nametagIndex = 0; nametagIndex < nametagCount; nametagIndex++) {
    const nametagOwned = rawNametags[nametagIndex];
    if (nametagOwned >= 1) {
      const nametagItemName = nametagIndex == 6
        ? 'EquipmentNametag6b'
        : 'EquipmentNametag' + nametagIndex;
      const nametagItem = items?.[nametagItemName];
      
      if (nametagItem) {
        const bonusMultiplier = getNametagMultiplier(nametagOwned, rawSpelunk, account);
        
        // Build modified item with bonus values
        const modifiedItem = { ...nametagItem };
        if (nametagItem.UQ1txt && nametagItem.UQ1txt != '0' && nametagItem.UQ1val && nametagItem.UQ1val != 0) {
          modifiedItem.UQ1val = notateNumber(nametagItem.UQ1val * bonusMultiplier, 'MultiplierInfo');
        }
        if (nametagItem.UQ2txt && nametagItem.UQ2txt != '0' && nametagItem.UQ2val && nametagItem.UQ2val != 0) {
          modifiedItem.UQ2val = notateNumber(nametagItem.UQ2val * bonusMultiplier, 'MultiplierInfo');
        }
        modifiedItem.level = nametagOwned;
        modifiedItem.nametagMultiplier = bonusMultiplier;
        nametagsUsedList.push(modifiedItem);
        
        // Aggregate bonuses
        for (let uqIndex = 0; uqIndex < 2; uqIndex++) {
          const uqTextKey = 'UQ' + Math.round(uqIndex + 1) + 'txt';
          const uqValueKey = 'UQ' + Math.round(uqIndex + 1) + 'val';
          if (nametagItem?.[uqTextKey] != '0') {
            const uqText = nametagItem?.[uqTextKey];
            const uqValue = nametagItem?.[uqValueKey];
            const uqBonusValue = uqValue * bonusMultiplier;
            nametagBonusesObj[uqText] = (nametagBonusesObj[uqText] ?? 0) + uqBonusValue;
          }
        }
        const statList = 'Weapon_Power,STR,AGI,WIS,LUK,Defence';
        const stats = statList.split(',');
        for (let statIndex = 0; statIndex < stats.length; statIndex++) {
          const statName = stats[statIndex];
          const statValue = nametagItem?.[statName];
          const statBonusValue = statValue * bonusMultiplier;
          nametagBonusesObj[statName] = (nametagBonusesObj[statName] ?? 0) + statBonusValue;
        }
      }
    }
  }
  
  return {
    bonuses: Object.entries(nametagBonusesObj).map(([name, value]) => ({ name, value })),
    items: nametagsUsedList
  };
}

export const getGalleryBonusMulti = (rawSpelunk, account, character) => {
  const baseValue = rawSpelunk?.[13]?.[4];
  const chipBonus = character ? getPlayerLabChipBonus(character, account, 16) ? 10 : 0 : 0;
  const clamWorkBonus = 3 * getClamWorkBonus(account, 7);
  const killroyBonus = getKillRoyShopBonus(account, 3);
  const bubbleBonus = Math.min(20, getBubbleBonus(account, 'CODFREY_RULZ_OK', false));
  const cardBonus = Math.min(getCardBonusByEffect(account?.cards, 'Gallery_Bonus_(Passive)'), 10);
  const companionBonus = isCompanionBonusActive(account, 49) ? account?.companions?.list?.at(49)?.bonus : 0;

  return 1 + (3 * baseValue + chipBonus + clamWorkBonus + killroyBonus + bubbleBonus + cardBonus + companionBonus) / 100;
}

export const getPodiumsOwned = (rawSpelunk, account) => {
  const baseValue = rawSpelunk?.[13]?.[4];
  const emporiumBonus = getJadeEmporiumBonus(account, 'Another_Gallery_Podium') ?? 0;
  const gemShopBonus = account?.gemShopPurchases?.find((value, index) => index === 40) ?? 0;
  const loreBonus = getLoreBonus(account, 5) ? 1 : 0;
  const artifact = isArtifactAcquired(account?.sailing?.artifacts, 'Deathskull')?.bonus ?? 0;
  const eventShopBonus = getEventShopBonus(account, 26);

  return Math.min(19, 1 +
    (Math.ceil(baseValue / 4) +
      (Math.min(1, emporiumBonus) +
        (Math.floor(gemShopBonus / 1) +
          (2 * loreBonus +
            Math.min(2, artifact) + eventShopBonus)))));
}

export const getLv2PodiumsOwned = (account) => {
  const clamWorkBonus = 2 * getClamWorkBonus(account, 0);
  const killroyBonus = Math.min(2, getKillRoyShopBonus(account, 3));
  const companionBonus = isCompanionBonusActive(account, 42) ? account?.companions?.list?.at(42)?.bonus : 0;
  const gemShopBonus = Math.floor((account?.gemShopPurchases?.find((value, index) => index === 40) ?? 0) / 2);
  const lv3Podiums = getLv3PodiumsOwned(account);
  const legendBonus = getLegendTalentBonus(account, 9);
  const artifact = isArtifactAcquired(account?.sailing?.artifacts, 'Deathskull')?.acquired;
  const artifactBonus = Math.max(0,
    Math.min(2, Math.round(artifact) - 2) -
    Math.min(1, Math.floor(artifact / 5)));

  return Math.round(clamWorkBonus +
    killroyBonus + companionBonus
    + gemShopBonus + lv3Podiums
    + legendBonus + artifactBonus);
}

export const getLv3PodiumsOwned = (account) => {
  const gemShopBonus = Math.floor((account?.gemShopPurchases?.find((value, index) => index === 40) ?? 0) / 3);
  const artifact = isArtifactAcquired(account?.sailing?.artifacts, 'Deathskull')?.acquired;
  const sailingBonus = Math.min(1, Math.floor(artifact / 5));
  const artifactBonus = getLv4PodiumsOwned(account);
  return Math.round(gemShopBonus + sailingBonus + artifactBonus);
}

export const getLv4PodiumsOwned = (account) => {
  const eventShopBonus = getEventShopBonus(account, 29);
  const companionBonus = isCompanionBonusActive(account, 28) ? account?.companions?.list?.at(28)?.bonus : 0;
  return Math.min(1, companionBonus) + eventShopBonus;
}

const getAllTrophies = (rawSpelunk, account) => {
  const rawTrophies = rawSpelunk?.[16] || [];
  const trophyCount = rawTrophies?.length || 0;
  const podiumsOwned = getPodiumsOwned(rawSpelunk, account);
  const maxTrophyIndex = Math.min(trophyCount, 48 + podiumsOwned);
  const bonusMulti = getGalleryBonusMulti(rawSpelunk, account);
  
  // Create sets to track owned trophies
  const ownedTrophyIds = new Set();
  
  // Track inventory trophies (indices 0-47)
  const maxInventoryIndex = Math.min(48, trophyCount);
  for (let trophyIndex = 0; trophyIndex < maxInventoryIndex; trophyIndex++) {
    if (rawTrophies[trophyIndex] >= 1) {
      ownedTrophyIds.add(rawTrophies[trophyIndex]);
    }
  }
  
  // Track podium trophies (indices 48+)
  for (let trophyIndex = 48; trophyIndex < maxTrophyIndex; trophyIndex++) {
    const isTrophyFilled = (trophyIndex - 48) < podiumsOwned && rawTrophies[trophyIndex] >= 1;
    if (isTrophyFilled) {
      ownedTrophyIds.add(rawTrophies[trophyIndex]);
    }
  }

  // Get all trophies from items
  const allTrophies = itemsArray
    .filter((item) => item?.Type === 'TROPHY')
    .map((item) => {
      // Extract trophy ID from rawName (e.g., "Trophy1" -> 1)
      const trophyIdMatch = item.rawName?.match(/^Trophy(\d+)$/);
      const trophyId = trophyIdMatch ? parseInt(trophyIdMatch[1], 10) : null;
      const isAcquired = trophyId !== null && ownedTrophyIds.has(trophyId);
      
      const modifiedItem = { ...item };
      
      if (isAcquired) {
        // Determine if it's in inventory or on podium
        let trophyMultiplier = 0.3 * bonusMulti; // Default inventory multiplier
        let isOnPodium = false;
        let podiumLevel = null;
        
        // Check if it's on a podium
        for (let trophyIndex = 48; trophyIndex < maxTrophyIndex; trophyIndex++) {
          const isTrophyFilled = (trophyIndex - 48) < podiumsOwned && rawTrophies[trophyIndex] === trophyId;
          if (isTrophyFilled) {
            trophyMultiplier = getTrophyMultiplier(trophyIndex, rawSpelunk, account);
            podiumLevel = getPodiumLevel(trophyIndex, account);
            isOnPodium = true;
            break;
          }
        }
        
        // Apply bonus multiplier
        if (item.UQ1txt && item.UQ1txt != '0' && item.UQ1val && item.UQ1val != 0) {
          modifiedItem.UQ1val = notateNumber(item.UQ1val * trophyMultiplier, 'MultiplierInfo');
        }
        if (item.UQ2txt && item.UQ2txt != '0' && item.UQ2val && item.UQ2val != 0) {
          modifiedItem.UQ2val = notateNumber(item.UQ2val * trophyMultiplier, 'MultiplierInfo');
        }
        
        if (isOnPodium) {
          modifiedItem.podiumLevel = podiumLevel;
          modifiedItem.podiumMultiplier = trophyMultiplier;
        } else {
          modifiedItem.inventoryMultiplier = trophyMultiplier;
        }
      }

      return {
        ...modifiedItem,
        isAcquired
      };
    })
    .sort((a, b) => {
      // Sort by acquired status first (acquired first), then by ID
      if (a.isAcquired !== b.isAcquired) {
        return b.isAcquired - a.isAcquired;
      }
      return (a.ID || 0) - (b.ID || 0);
    });

  return allTrophies;
}

const getAllNametags = (rawSpelunk, account) => {
  const rawNametags = rawSpelunk?.[17] || [];
  const nametagCount = rawNametags?.length || 0;
  const bonusMulti = getGalleryBonusMulti(rawSpelunk, account);
  
  // Create a map to track owned nametags and their levels
  const ownedNametagsMap = new Map();
  
  for (let nametagIndex = 0; nametagIndex < nametagCount; nametagIndex++) {
    const nametagOwned = rawNametags[nametagIndex];
    if (nametagOwned >= 1) {
      const nametagItemName = nametagIndex == 6
        ? 'EquipmentNametag6b'
        : 'EquipmentNametag' + nametagIndex;
      ownedNametagsMap.set(nametagItemName, nametagOwned);
    }
  }

  // Get all nametags from items
  const allNametags = itemsArray
    .filter((item) => item?.Type === 'NAMETAG')
    .map((item) => {
      const isAcquired = ownedNametagsMap.has(item.rawName);
      const nametagLevel = isAcquired ? ownedNametagsMap.get(item.rawName) : null;
      
      const modifiedItem = { ...item };
      
      if (isAcquired && nametagLevel) {
        const bonusMultiplier = getNametagMultiplier(nametagLevel, rawSpelunk, account);
        
        // Apply bonus multiplier
        if (item.UQ1txt && item.UQ1txt != '0' && item.UQ1val && item.UQ1val != 0) {
          modifiedItem.UQ1val = notateNumber(item.UQ1val * bonusMultiplier, 'MultiplierInfo');
        }
        if (item.UQ2txt && item.UQ2txt != '0' && item.UQ2val && item.UQ2val != 0) {
          modifiedItem.UQ2val = notateNumber(item.UQ2val * bonusMultiplier, 'MultiplierInfo');
        }
        modifiedItem.level = nametagLevel;
        modifiedItem.nametagMultiplier = bonusMultiplier;
      }

      return {
        ...modifiedItem,
        isAcquired
      };
    })
    .sort((a, b) => {
      // Sort by acquired status first (acquired first), then by ID
      if (a.isAcquired !== b.isAcquired) {
        return b.isAcquired - a.isAcquired;
      }
      return (a.ID || 0) - (b.ID || 0);
    });

  return allNametags;
}