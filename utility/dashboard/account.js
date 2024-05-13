import { getMaxClaimTime, getSecPerBall } from '@parsers/dungeons';
import { getBuildCost } from '@parsers/construction';
import { vialCostsArray } from '@parsers/alchemy';
import { maxNumberOfSpiceClicks } from '@parsers/cooking';
import { cleanUnderscore, getDuration, notateNumber, tryToParse } from '../helpers';
import { isRiftBonusUnlocked } from '@parsers/world-4/rift';
import { items, liquidsShop } from '../../data/website-data';
import { hasMissingMats } from '@parsers/refinery';
import { calcTotals } from '@parsers/printer';
import { findQuantityOwned, getAllItems } from '@parsers/items';
import { isJadeBonusUnlocked } from '@parsers/world-6/sneaking';
import { getMiniBossesData } from '@parsers/misc';

export const farmingAlerts = (account, options) => {
  const alerts = {}
  if (!account?.finishedWorlds?.World5) return alerts;
  if (options?.plots?.checked) {
    alerts.plots = account?.farming?.plot?.filter(({ currentOG }) => options?.plots?.props?.value > 0
      ? currentOG >= options?.plots?.props?.value
      : currentOG > 0).map((plot) => ({ ...plot, threshold: options?.plots?.props?.value }));
  }
  if (options?.totalCrops?.checked) {
    const totalCrops = account?.farming?.plot?.reduce((sum, {
      cropQuantity,
      currentOG
    }) => sum + (cropQuantity * (currentOG ?? 1)), 0);
    alerts.totalCrops = totalCrops >= options?.totalCrops?.props?.value ? totalCrops : 0;
  }
  return alerts;
}

export const tasksAlert = (account, options) => {
  let tasksAlerts = []
  if (options?.tasks?.checked) {
    tasksAlerts = account?.tasksDescriptions?.reduce((acc, tasks, worldIndex) => {
      const ninthTask = tasks?.[8];
      const ninthTaskNotCompleted = ninthTask?.level === 0;
      if (ninthTaskNotCompleted && options?.tasks?.props?.value?.[worldIndex + 1]) {
        return [...acc, worldIndex];
      } else {
        return acc;
      }
    }, []);
  }
  return tasksAlerts;
}
export const atomColliderAlerts = (account, options) => {
  const alerts = {}
  if (!account?.finishedWorlds?.World2) return alerts;
  if (options?.stampReducer?.checked) {
    alerts.stampReducer = account?.atoms?.stampReducer >= options?.stampReducer?.props?.value;
    alerts.stampReducerValue = options?.stampReducer?.props?.value;
  }
  return alerts;
}
export const arcadeAlerts = (account, options) => {
  const alerts = {};
  if (!account?.finishedWorlds?.World1) return alerts;
  if (options?.balls?.checked) {
    const ballsToClaim = Math.floor(Math.min(account?.timeAway?.GlobalTime - account?.timeAway?.Arcade, getMaxClaimTime(account))
      / Math.max(getSecPerBall(account), 1800));
    const onePercent = 5 * account?.arcade?.maxBalls / 100;
    alerts.balls = ballsToClaim >= account?.arcade?.maxBalls - onePercent
  }
  return alerts;
}
export const guildAlerts = (account, options) => {
  const alerts = {};
  if (!account?.accountOptions?.[37]) return false;
  const { daily, weekly } = options;
  if (daily?.checked) {
    alerts.daily = account?.guild?.guildTasks?.daily?.filter(({
                                                                requirement,
                                                                progress
                                                              }) => progress < requirement)?.length;
  }
  if (weekly?.checked) {
    alerts.weekly = account?.guild?.guildTasks?.weekly?.filter(({
                                                                  requirement,
                                                                  progress
                                                                }) => progress < requirement)?.length;
  }
  return alerts;
}
export const breedingAlerts = (account, options) => {
  const alerts = {}
  if (!account?.finishedWorlds?.World3) return alerts;
  if (options?.shinies?.checked) {
    const list = account?.breeding?.pets?.reduce((res, world) => {
      const pets = world?.filter(({
                                    monsterRawName,
                                    shinyLevel
                                  }) => account?.breeding?.fencePetsObject?.[monsterRawName]
        && shinyLevel >= options?.shinies?.props?.value);
      return [...res, ...pets];
    }, [])
    alerts.shinies = { pets: list, threshold: options?.shinies?.props?.value }
  }
  if (options?.eggs?.checked) {
    alerts.eggs = account?.breeding?.eggs.slice(0, 15).every((eggLv) => eggLv > 0);
  }
  return alerts;
}
export const printerAlerts = (account, options) => {
  const alerts = {}
  if (!account?.finishedWorlds?.World2) return alerts;
  const { includeOakAndCopper, showAlertWhenFull } = options;
  const totals = calcTotals(account, showAlertWhenFull);
  const exclusions = ['atom', ...(!includeOakAndCopper?.checked ? ['Copper', 'OakTree'] : [])].toSimpleObject();
  alerts.atoms = Object.entries(totals || {}).filter(([itemName, { atoms }]) => account?.accountOptions?.[132] && !exclusions?.[itemName] && atoms).map(([name, data]) => ({
    name: items?.[name]?.displayName,
    rawName: name,
    ...data
  }));

  return alerts;
}
export const shopsAlerts = (account, options) => {
  const alerts = {};
  alerts.items = account?.shopStock?.reduce((res, shop, index) => {
    if ((index === 2 || index === 3) && !account?.finishedWorlds?.World1) {
      return [...res, []];
    } else if (index === 4 && !account?.finishedWorlds?.World2) {
      return [...res, []];
    } else if (index === 5 && !account?.finishedWorlds?.World3) {
      return [...res, []];
    } else if (index === 6 && !account?.finishedWorlds?.World4) {
      return [...res, []];
    } else if (index === 6 && !account?.finishedWorlds?.World5) {
      return [...res, []];
    }
    const filtered = shop?.filter(({ rawName }) => options?.shops?.props?.value?.[rawName]);
    return [...res, filtered];
  }, []);
  return alerts;
}
export const constructionAlerts = (account, options) => {
  const alerts = {};
  if (!account?.finishedWorlds?.World2) return alerts;
  const { materials, rankUp, flags, buildings } = options || {};
  if (flags?.checked) {
    alerts.flags = account?.construction?.board?.filter(({
                                                           flagPlaced,
                                                           currentAmount,
                                                           requiredAmount
                                                         }) => flagPlaced && currentAmount === requiredAmount);
  }
  if (buildings?.checked) {
    alerts.buildings = account?.towers?.data?.filter((tower) => {
      const cost = getBuildCost(account?.towers, tower?.level, tower?.bonusInc, tower?.index);
      return tower?.progress >= cost;
    });
  }
  if (materials?.checked) {
    alerts.materials = account?.refinery?.salts?.reduce((res, { rank, cost, rawName }, saltIndex) => {
      const previousSaltIndex = saltIndex > 0 ? saltIndex - 1 : null;
      const previousSalt = account?.refinery?.salts?.[previousSaltIndex];
      const missingMats = hasMissingMats(saltIndex, rank, cost, account);
      const previousSaltMissingMats = hasMissingMats(previousSaltIndex, previousSalt?.rank, previousSalt?.cost, account);
      if (missingMats?.length === 1 && missingMats?.[0]?.rawName?.includes('Refinery')
        && previousSalt?.autoRefinePercentage > 0
        || previousSalt?.active && previousSaltMissingMats?.length > 0) {
        return res;
      }
      if (missingMats?.length > 0) {
        res = [...res, { rawName, missingMats }]
      }
      return res;
    }, []);
  }
  if (rankUp?.checked) {
    alerts.rankUp = account?.refinery?.salts?.filter(({ refined, powerCap }) => {
      const percent = .98 * powerCap / 100;
      return refined >= powerCap - percent
    });
  }
  return alerts;
}
export const postOfficeAlerts = (account, options) => {
  const alerts = {}
  if (!account?.finishedWorlds?.World1) return alerts;
  if (options?.postOffice?.checked) {
    alerts.shipments = account?.postOfficeShipments?.filter(({ streak }, index) => {
      return options?.postOffice?.props?.value?.[index + 1] && streak <= 0
    });
  }
  return alerts;
}

function isNearRange(value, lowerBound, upperBound, nearPercentage) {
  const lowerRange = lowerBound + (lowerBound * nearPercentage / 100);
  const upperRange = upperBound + (upperBound * nearPercentage / 100);
  return value <= lowerRange || value >= upperRange;
}

function checkBound(item, amount, lowerBound, upperBound, includeNearly, percent) {
  const nearly = includeNearly ? '(nearly) ' : '';
  const lowerPercent = lowerBound * (percent / 100);
  const upperPercent = upperBound * (percent / 100);
  if (lowerBound && !upperBound && (includeNearly
    ? Math.abs(amount - lowerBound) <= Math.abs(lowerPercent)
    : amount < lowerBound)) {
    return `Your amount of ${item} (${notateNumber(amount)}) is ${nearly}below the bound (${notateNumber(lowerBound)})`;
  } else if (!lowerBound && upperBound && (includeNearly
    ? Math.abs(amount - upperBound) <= Math.abs(upperPercent) : amount > upperBound)) {
    return `Your amount of ${item} (${notateNumber(amount)}) is ${nearly}above the bound (${notateNumber(upperBound)})`;
  } else if (lowerBound && upperBound && lowerBound < upperBound) {
    if ((includeNearly
      ? isNearRange(amount, lowerBound, upperBound, percent)
      : (amount <= lowerBound || amount >= upperBound))) {
      return `Your amount of ${item} (${notateNumber(amount)}) is ${nearly}outside of the configured range (${notateNumber(lowerBound)} - ${notateNumber(upperBound)})`;
    }
  }

  return null; // No alert needed
}

export const materialTrackerAlerts = (account, options, characters) => {
  const alerts = {}
  const materials = tryToParse(localStorage.getItem('material-tracker'));
  if (Object.keys(materials || {}).length > 0) {
    const totalOwnedItems = getAllItems(characters, account);
    alerts.materialTracker = Object.values(materials || {})?.reduce((res, {
      item,
      lowerBound,
      upperBound,
      includeNearly,
      note
    }) => {
      const { amount: quantityOwned } = findQuantityOwned(totalOwnedItems, item?.displayName);
      let text = checkBound(cleanUnderscore(item?.displayName), quantityOwned, lowerBound, upperBound, includeNearly, 5);
      if (!lowerBound && !upperBound) {
        text = `You have ${notateNumber(quantityOwned)} ${cleanUnderscore(item?.displayName)}`;
      }
      if (!text) return res;
      return [...res, { item, quantityOwned, text, note }];
    }, []);
  }

  return alerts;
}

export const etcAlerts = (account, options, characters) => {
  const alerts = {}
  if (options?.newCharacters?.checked) {
    const numOfCharacters = characters?.length;
    const totalLevels = characters?.reduce((sum, { level }) => sum + level, 0);
    let newCharactersCounter = 0;
    if (numOfCharacters === 5 && totalLevels >= 300) {
      newCharactersCounter++;
    }
    if (numOfCharacters === 6 && totalLevels >= 500) {
      newCharactersCounter++;
    }
    if (numOfCharacters === 7 && totalLevels >= 750) {
      newCharactersCounter++;
    }
    if (numOfCharacters === 8 && totalLevels >= 1100) {
      newCharactersCounter++;
    }
    if (numOfCharacters === 9 && totalLevels >= 1500) {
      newCharactersCounter++;
    }
    alerts.newCharacters = newCharactersCounter;
  }
  if (options?.randomEvents?.checked) {
    alerts.randomEvents = account?.accountOptions?.[137] === 0;
  }
  if (options?.dungeonTraits?.checked) {
    const dungeonRank = account?.dungeons?.rank;
    alerts.dungeonTraits = account?.dungeons?.statBoosts?.reduce((res, { section, levelReq, bonuses }) => {
      const noneActive = bonuses?.every(({ isActive }) => !isActive);
      if (dungeonRank > levelReq && noneActive) {
        return [...res, section];
      }
      return res;
    }, []);
  }
  if (options?.keys?.checked) {
    alerts.keys = areKeysOverdue(account);
  }
  if (account?.finishedWorlds?.World1 && options?.weeklyBosses?.checked) {
    alerts.weeklyBosses = account?.accountOptions?.[190] === 0;
  }
  if (account?.finishedWorlds?.World1 && options?.killRoy?.checked) {
    alerts.killRoy = account?.accountOptions?.[113];
  }
  if (!account?.finishedWorlds?.World3) return alerts;
  if (options?.gildedStamps?.checked && isRiftBonusUnlocked(account?.rift, 'Stamp_Mastery')) {
    alerts.gildedStamps = account?.accountOptions?.[154];
  }
  if (options?.miniBosses?.checked) {
    const minibosses = getMiniBossesData(account).filter(({ current }) => current >= options?.miniBosses?.props?.value);
    alerts.miniBosses = minibosses.length > 0 ? minibosses : null;
  }
  return alerts;
}
export const alchemyAlerts = (account, options) => {
  const alerts = {}
  if (!account?.finishedWorlds?.World1) return alerts;
  if (options?.bargainTag?.checked) {
    const { x1, x2, index } = liquidsShop?.find(({ name }) => name === 'BARGAIN_TAG') || {};
    const math = Math.round(x1 * Math.pow(x2, account?.alchemy?.multiplierArray?.[index]));
    alerts.bargainTag = math === 1;
  }
  if (options?.liquids?.checked) {
    const liquidsProgress = account?.alchemy?.liquids;
    const percentage = options?.liquids?.props?.value / 100;
    alerts.liquids = account?.alchemy?.liquidCauldrons?.map((maxLiquid, index) => ({
      current: liquidsProgress?.[index],
      max: maxLiquid,
      index
    })).filter(({ current, max }) => max && current >= max * percentage - 5);
  }
  if (options?.sigils?.checked) {
    const hasJadeBonus = isJadeBonusUnlocked(account, 'Ionized_Sigils');
    alerts.sigils = account?.alchemy?.p2w?.sigils?.filter(({
                                                             characters,
                                                             progress,
                                                             boostCost,
                                                             jadeCost
                                                           }) => characters.length > 0 && (hasJadeBonus
      ? progress >= jadeCost
      : progress >= boostCost))
  }
  if (options?.vials?.checked) {
    const { subtractGreenStacks } = options || {};
    alerts.vials = account?.alchemy?.vials?.filter(({ level, itemReq }) => {
      if (level <= 0) return false;
      const cost = vialCostsArray?.[level];
      let storageQuantity = account?.storage?.find(({ name }) => name === itemReq?.[0]?.name)?.amount || 0;
      if (subtractGreenStacks?.checked) {
        storageQuantity -= 1e7;
      }
      const liquidIndex = parseInt(itemReq?.[1]?.name.split('\d')?.[1] || 0);
      const liquidQuantity = account?.alchemy?.liquids?.[liquidIndex - 1];
      const liquidCost = 3 * level;
      return storageQuantity > cost && liquidQuantity > liquidCost;
    });
  }
  if (options?.vialsAttempts?.checked) {
    const { current } = account?.alchemy?.p2w?.vialsAttempts;
    alerts.vialsAttempts = current > 0;
  }
  return alerts;
}
export const sailingAlerts = (account, options) => {
  const alerts = {}
  if (!account?.finishedWorlds?.World4) return alerts;
  const { captains, chests } = options;
  if (captains?.checked) {
    const { captains, shopCaptains } = account?.sailing || {};
    alerts.captains = shopCaptains?.reduce((res, shopCaption) => {
      const {
        captainType,
        firstBonusIndex,
        secondBonusIndex,
        firstBonusValue,
        secondBonusValue,
        firstBonusDescription,
        secondBonusDescription
      } = shopCaption;
      const matches = captains?.filter((rCaptain) => {
        const areBonusesEqual = rCaptain?.firstBonusIndex === firstBonusIndex && rCaptain?.secondBonusIndex === secondBonusIndex;
        const areBonusesSwapped = rCaptain?.secondBonusIndex === firstBonusIndex && rCaptain?.firstBonusIndex === secondBonusIndex;
        const atLeastOneBonusIsEqual = rCaptain?.firstBonusIndex === firstBonusIndex || rCaptain?.firstBonusIndex === secondBonusIndex;

        if (areBonusesEqual || areBonusesSwapped) {
          if (firstBonusIndex === secondBonusIndex) {
            return firstBonusValue + secondBonusValue > rCaptain?.firstBonusValue + rCaptain?.secondBonusValue;
          } else {
            const condition1 = firstBonusValue > rCaptain?.firstBonusValue && secondBonusValue > rCaptain?.secondBonusValue;
            const condition2 = firstBonusValue > rCaptain?.secondBonusValue && secondBonusValue > rCaptain?.firstBonusValue;
            return condition1 || condition2;
          }
        }
        if (atLeastOneBonusIsEqual) {
          const isSameValue = rCaptain?.firstBonusIndex === rCaptain?.secondBonusIndex;
          if (isSameValue) {
            if (firstBonusIndex === rCaptain?.firstBonusIndex) {
              return firstBonusValue > rCaptain?.firstBonusValue + rCaptain?.secondBonusValue;
            } else if (secondBonusIndex === rCaptain?.firstBonusIndex) {
              return secondBonusValue > rCaptain?.firstBonusValue + rCaptain?.secondBonusValue;
            }
          }
        }
        return false;
      });
      if (matches?.length > 0 && captainType !== -1) {
        const isSameValue = firstBonusIndex === secondBonusIndex;
        const temp = {
          captain: shopCaption,
          isSameValue,
          badCaptains: matches.map(({
                                      captainIndex,
                                      firstBonusDescription: fbDesc,
                                      secondBonusDescription: sbDesc,
                                      firstBonusValue: fbValue,
                                      secondBonusValue: sbValue
                                    }) => ({
            captainIndex,
            firstBonusValue: fbValue,
            secondBonusValue: sbValue,
            bonus: isSameValue
              ? fbDesc.substring(fbDesc.indexOf('%')).replace('%', (fbValue + sbValue) + '%')
              : [fbDesc.substring(fbDesc.indexOf('%')).replace('%', (fbValue) + '%'),
                sbDesc.substring(sbDesc.indexOf('%')).replace('%', (sbValue) + '%')]
          }))?.sort((a, b) => (b?.firstBonusValue + b?.secondBonusValue) - (a?.firstBonusValue + a?.secondBonusValue)),
          bonus: isSameValue
            ? firstBonusDescription?.substring(firstBonusDescription?.indexOf('%')).replace('%', (firstBonusValue + secondBonusValue) + '%')
            : [firstBonusDescription?.substring(firstBonusDescription?.indexOf('%')).replace('%', (firstBonusValue) + '%'),
              secondBonusDescription?.substring(secondBonusDescription?.indexOf('%')).replace('%', (secondBonusValue) + '%')]
        }
        return [...res, temp];
      }
      return res;
    }, []);
  }
  if (chests?.checked) {
    const sailingTime = 259200 < account?.accountOptions?.[124]
      ? Math.floor(account?.accountOptions?.[124] / 8640) / 10
      : Math.floor(account?.accountOptions?.[124] / 3600);
    const { maxChests, timeToFullChests } = account?.sailing;
    const { hours } = getDuration(new Date().getTime(), timeToFullChests);
    alerts.chests = sailingTime > hours && maxChests > 0;
  }
  return alerts;
}

export const cookingAlerts = (account, options) => {
  const alerts = {};
  if (!account?.finishedWorlds?.World3) return false;
  if (options?.spices?.checked) {
    alerts.spices = maxNumberOfSpiceClicks - account?.cooking?.spices?.numberOfClaims;
  }
  return alerts;
}
export const areKeysOverdue = (account) => {
  const keys = account?.currencies?.KeysAll;
  const tickets = account?.currencies?.ColosseumTickets?.allTickets;

  const keysAlerts = keys?.filter(({ daysSincePickup }) => {
    return daysSincePickup >= 3;
  })
  const ticketsAlerts = tickets?.filter(({ daysSincePickup }, index) => {
    return (index === 0 || account?.finishedWorlds?.[`World${index}`]) && daysSincePickup >= 3;
  });
  return [...(keysAlerts || []), ...(ticketsAlerts || [])];
}
export const gamingAlerts = (account, options) => {
  if (!account?.finishedWorlds?.World4) return false;
  const { sprouts, squirrel, shovel } = options;
  const alerts = {}
  if (sprouts?.checked && account?.gaming?.availableSprouts >= account?.gaming?.sproutsCapacity) {
    alerts.sprouts = account?.gaming?.availableSprouts;
  }
  if (sprouts?.checked && account?.gaming?.availableDrops >= account?.gaming?.sproutsCapacity) {
    alerts.drops = account?.gaming?.availableDrops;
  }
  const shovelUnlocked = account?.gaming?.imports?.find(({ name, acquired }) => name === 'Dirty_Shovel' && acquired);
  if (options?.shovel?.checked && shovelUnlocked && shovel && account?.gaming?.lastShovelClicked >= 0) {
    const timePassed = new Date().getTime() - account?.gaming?.lastShovelClicked * 1000;
    const { hours } = getDuration(new Date().getTime(), timePassed);
    if (hours >= options?.shovel?.props?.value) {
      alerts.shovel = getDuration(new Date().getTime(), timePassed);
    }
  }
  const squirrelUnlocked = account?.gaming?.imports?.find(({
                                                             name,
                                                             acquired
                                                           }) => name === 'Autumn_Squirrel' && acquired)
  if (options?.squirrel?.checked && squirrelUnlocked && squirrel && account?.gaming?.lastAcornClicked >= 0) {
    const timePassed = new Date().getTime() - account?.gaming?.lastAcornClicked * 1000;
    const { hours } = getDuration(new Date().getTime(), timePassed);
    if (hours >= options?.squirrel?.props?.value) {
      alerts.squirrel = getDuration(new Date().getTime(), timePassed);
    }
  }
  return alerts;
}
export const equinoxAlerts = (account, options) => {
  const equinox = account?.equinox;
  const foodLustUpgrade = equinox?.upgrades[9];
  const { bar, challenges, foodLust } = options;
  const alerts = {};

  if (bar) alerts.bar = equinox?.currentCharge >= equinox?.chargeRequired && equinox?.upgrades.filter(upgrade => upgrade.unlocked).some(upgrade => upgrade.lvl < upgrade.maxLvl);
  if (challenges) alerts.challenges = equinox?.challenges.filter(challenge => challenge.active && challenge.current >= challenge.goal)?.length;
  if (foodLust) alerts.foodLust = foodLustUpgrade?.lvl > 0 && foodLustUpgrade?.bonus >= foodLustUpgrade?.lvl;

  return alerts;
}
export const islandsAlerts = (account, options) => {
  const { unclaimedDays } = options;
  const alerts = {};
  if (unclaimedDays?.checked && account?.islands?.numberOfDaysAfk >= unclaimedDays?.props?.value) {
    alerts.unclaimedDays = account?.islands?.numberOfDaysAfk;
  }
  return alerts;
}
export const summoningAlerts = (account, options) => {
  const { familiar } = options;
  const alerts = {};
  const { level, maxLvl } = account?.summoning?.upgrades?.[0]?.[2] || {};
  if (familiar?.checked && level < maxLvl && level < familiar?.props?.value) {
    alerts.familiar = { level, maxLvl };
  }
  return alerts;
}