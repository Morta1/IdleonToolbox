import { getMaxClaimTime, getSecPerBall } from '@parsers/dungeons';
import { getBuildCost } from '@parsers/construction';
import { MAX_VIAL_LEVEL, vialCostsArray } from '@parsers/alchemy';
import { getChipsAndJewels, maxNumberOfSpiceClicks } from '@parsers/cooking';
import { cleanUnderscore, getDuration, notateNumber, totalHoursBetweenDates, tryToParse } from '../helpers';
import { isRiftBonusUnlocked } from '@parsers/world-4/rift';
import { items, liquidsShop } from '../../data/website-data';
import { hasMissingMats } from '@parsers/refinery';
import { calcTotals } from '@parsers/printer';
import { findItemInInventory, findQuantityOwned, getAllItems } from '@parsers/items';
import { isJadeBonusUnlocked } from '@parsers/world-6/sneaking';
import { getMiniBossesData, getKillroySchedule } from '@parsers/misc';
import { getRequirementAmount } from '@parsers/lab';
import { getLandRank, getProductDoubler, getRanksTotalBonus } from '@parsers/world-6/farming';
import { isPast } from 'date-fns';
import { getIsland } from '@parsers/world-2/islands';

export const getOptions = (data) => {
  return Object.entries(data)?.reduce((res, [fieldName, fieldData]) => {
    const fieldOptions = fieldData?.options?.reduce((result, option) => ({
      ...result,
      [option?.name]: option
    }), {})
    return {
      ...res,
      [fieldName]: fieldOptions
    }
  }, {});
}

export const getGeneralAlerts = (account, fields, options, characters, lastUpdated) => {
  const alerts = {};
  if (fields?.tasks?.checked) {
    const { tasks: tasksOptions } = options?.tasks
    const allTasks = account?.tasksDescriptions?.reduce((acc, tasks, worldIndex) => {
      const ninthTask = tasks?.[8];
      const ninthTaskNotCompleted = ninthTask?.level === 0;
      if (ninthTaskNotCompleted && tasksOptions?.props?.value?.[worldIndex + 1]) {
        return [...acc, worldIndex];
      } else {
        return acc;
      }
    }, []);
    if (allTasks?.length > 0) {
      alerts.tasks = allTasks;
    }
  }
  if (fields?.materialTracker?.checked) {
    const materials = tryToParse(localStorage.getItem('material-tracker'));
    if (Object.keys(materials || {}).length > 0) {
      const totalOwnedItems = getAllItems(characters, account);
      const allMaterials = Object.values(materials || {})?.reduce((res, {
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
      if (allMaterials.length > 0) {
        alerts.materialTracker = allMaterials;
      }
    }
  }
  if (fields?.guild?.checked && account?.accountOptions?.[37]) {
    const { daily, weekly } = options?.guild || {};
    if (daily?.checked) {
      const dailyTasks = account?.guild?.guildTasks?.daily?.filter(({
        requirement,
        progress
      }) => progress < requirement)?.length;
      if (dailyTasks) {
        alerts.guild = { daily: dailyTasks };
      }
    }
    if (weekly?.checked) {
      const weeklyTasks = account?.guild?.guildTasks?.weekly?.filter(({
        requirement,
        progress
      }) => progress < requirement)?.length;
      if (weeklyTasks) {
        alerts.guild = { ...(alerts.guild || {}), weekly: weeklyTasks }
      }
    }
  }
  if (fields?.shops?.checked) {
    const allShops = account?.shopStock?.reduce((res, shop, index) => {
      if ((index === 2 || index === 3) && !account?.finishedWorlds?.World1) {
        return [...res, []];
      } else if (index === 4 && !account?.finishedWorlds?.World2) {
        return [...res, []];
      } else if (index === 5 && !account?.finishedWorlds?.World3) {
        return [...res, []];
      } else if (index === 6 && !account?.finishedWorlds?.World4) {
        return [...res, []];
      } else if (index === 7 && !account?.finishedWorlds?.World5) {
        return [...res, []];
      }
      const filtered = shop?.filter(({ rawName }) => options?.shops?.shops?.props?.value?.[rawName]);
      return [...res, filtered];
    }, []);
    const boughtEverything = allShops?.flat()?.length;
    if (boughtEverything > 0) {
      alerts.shops = { items: allShops };
    }
  }
  if (fields?.etc?.checked) {
    const etc = {};
    if (options?.etc?.dungeonTraits?.checked) {
      const dungeonRank = account?.dungeons?.rank;
      const traits = account?.dungeons?.statBoosts?.reduce((res, { section, levelReq, bonuses }) => {
        const noneActive = bonuses?.every(({ isActive }) => !isActive);
        if (dungeonRank > levelReq && noneActive) {
          return [...res, section];
        }
        return res;
      }, []);
      if (traits?.length > 0) {
        etc.dungeonTraits = traits;
      }
    }
    if (options?.etc?.randomEvents?.checked) {
      const remainingEvents = account?.accountOptions?.[137] === 0;
      if (remainingEvents) {
        etc.randomEvents = remainingEvents;
      }
    }
    if (options?.etc?.keys?.checked) {
      const overdue = areKeysOverdue(account);
      if (overdue.length > 0) {
        etc.keys = overdue;
      }
    }
    if (options?.etc?.miniBosses?.checked) {
      const minibosses = getMiniBossesData(account).filter(({ current }) => current >= options?.etc?.miniBosses?.props?.value);
      if (minibosses.length > 0) {
        etc.miniBosses = minibosses;
      }
    }
    if (options?.etc?.newCharacters?.checked) {
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
      if (newCharactersCounter > 0) {
        etc.newCharacters = newCharactersCounter;
      }
    }
    if (options?.etc?.gemsFromBosses?.checked) {
      const availableKills = Math.max(0, (600 - account?.accountOptions?.[195]) / 4);
      if (availableKills) {
        alerts.gemsFromBosses = availableKills;
      }
    }
    if (options?.etc?.familyObols?.checked) {
      const missingObols = account?.obols?.list?.filter(({
        displayName,
        levelReq
      }) => !displayName && account?.accountLevel >= levelReq);
      if (missingObols?.length > 0) {
        etc.familyObols = missingObols?.length;
      }
      const nextCompanionClaim = new Date().getTime() + Math.max(0, 594e6 - (1e3 * account?.timeAway?.GlobalTime - account?.companions?.lastFreeClaim));
      if (options?.etc?.freeCompanion?.checked && isPast(nextCompanionClaim)) {
        etc.freeCompanion = true;
      }
    }
    if (Object.keys(etc).length > 0) {
      alerts.etc = etc;
    }
  }
  return alerts;
};

export const getWorld1Alerts = (account, fields, options) => {
  const alerts = {};
  if (fields?.stamps?.checked && isRiftBonusUnlocked(account?.rift, 'Stamp_Mastery')) {
    const stamps = {};
    if (options?.stamps?.gildedStamps?.checked) {
      if (account?.accountOptions?.[154] > 0 && (options?.stamps?.showGildedWhenNoAtomDiscount?.checked
        ? account?.atoms?.stampReducer <= 0
        : true)) {
        stamps.gildedStamps = account?.accountOptions?.[154];
      }
    }
    if (Object.keys(stamps).length > 0) {
      alerts.stamps = stamps;
    }
  }
  if (fields?.owl?.checked && account?.accountOptions?.[253] > 0) {
    const owl = {};
    const { nextLvReq, feathers, upgrades } = account?.owl;
    const featherRestart = upgrades?.[4];
    const megaFeatherRestart = upgrades?.[8];
    const featherRestartAvailable = (nextLvReq === 0 || featherRestart?.nextLvReq < nextLvReq) && feathers >= featherRestart?.cost;
    const megaFeatherRestartAvailable = nextLvReq === 0 && feathers >= megaFeatherRestart?.cost;
    if (options?.owl?.featherRestart?.checked && featherRestartAvailable) {
      owl.featherRestart = true;
    }
    if (options?.owl?.megaFeatherRestart?.checked && megaFeatherRestartAvailable) {
      owl.megaFeatherRestart = true;
    }
    if (Object.keys(owl).length > 0) {
      alerts.owl = owl;
    }
  }
  const emptyOres = account?.forge?.list?.filter(({ ore }) => !ore?.name);
  if (fields?.forge?.checked) {
    const forge = {};
    if (options?.forge?.emptySlots?.checked && emptyOres?.length) {
      forge.emptySlots = emptyOres?.length;
    }
    if (Object.keys(forge).length > 0) {
      alerts.forge = forge;
    }
  }
  return alerts;
};
export const getWorld2Alerts = (account, fields, options, characters) => {
  const alerts = {};
  if (!account?.finishedWorlds?.World1) return alerts;
  if (fields?.alchemy?.checked) {
    const alchemy = {};
    if (options?.alchemy?.bargainTag?.checked) {
      const { x1, x2, index } = liquidsShop?.find(({ name }) => name === 'BARGAIN_TAG') || {};
      const math = Math.round(x1 * Math.pow(x2, account?.alchemy?.multiplierArray?.[index]));
      if (math === 1) {
        alchemy.bargainTag = math === 1;
      }
    }
    if (options?.alchemy?.gems?.checked) {
      const { x1, x2, index } = liquidsShop?.find(({ name }) => name === 'A_PAIR_OF_GEMS') || {};
      const math = Math.round(x1 * Math.pow(x2, account?.alchemy?.multiplierArray?.[index]));
      if (math === 5) {
        alchemy.gems = math === 5;
      }
    }
    if (options?.alchemy?.liquids?.checked) {
      const liquidsProgress = account?.alchemy?.liquids;
      const percentage = options?.alchemy?.liquids?.props?.value / 100;
      const liquids = account?.alchemy?.liquidCauldrons?.map((maxLiquid, index) => ({
        current: liquidsProgress?.[index],
        max: maxLiquid,
        index
      })).filter(({ current, max }) => max && current >= max * percentage - 5);
      if (liquids.length > 0) {
        alchemy.liquids = liquids
      }
    }
    if (options?.alchemy?.sigils?.checked) {
      const hasJadeBonus = isJadeBonusUnlocked(account, 'Ionized_Sigils');
      const sigils = account?.alchemy?.p2w?.sigils?.filter(({
        characters,
        progress,
        boostCost,
        jadeCost
      }) => characters.length > 0 && (hasJadeBonus
        ? progress >= jadeCost
        : progress >= boostCost));
      if (sigils.length > 0) {
        alchemy.sigils = sigils;
      }
    }
    if (options?.alchemy?.vials?.checked) {
      const { subtractGreenStacks } = options?.alchemy || {};
      const vials = account?.alchemy?.vials?.filter(({ level, itemReq }) => {
        if (level <= 0 || level >= MAX_VIAL_LEVEL) return false;
        const cost = vialCostsArray?.[level];
        let storageQuantity = account?.storage?.list?.find(({ name }) => name === itemReq?.[0]?.name)?.amount || 0;
        if (subtractGreenStacks?.checked) {
          storageQuantity -= 1e7;
        }
        const liquidIndex = parseInt(itemReq?.[1]?.name.split('\d')?.[1] || 0);
        const liquidQuantity = account?.alchemy?.liquids?.[liquidIndex - 1];
        const liquidCost = 3 * level;
        return storageQuantity > cost && liquidQuantity > liquidCost;
      });
      if (vials.length > 0) {
        alchemy.vials = vials;
      }
    }
    if (options?.alchemy?.vialsAttempts?.checked) {
      const { current } = account?.alchemy?.p2w?.vialsAttempts;
      const totalItems = getAllItems(characters, account);
      const lockedVials = account?.alchemy?.vials?.filter(({ level }) => level === 0);
      const hasItems = lockedVials.filter(({ itemReq }) => {
        const item = itemReq?.[0]?.name;
        const hasItems = findItemInInventory(totalItems, item);
        return Object.keys(hasItems).length > 0;
      });
      if (current > 0 && hasItems.length > 0) {
        alchemy.vialsAttempts = current > 0;
      }
    }
    if (options?.alchemy?.alternateParticles?.checked) {
      if (account?.accountOptions?.[135] > 0) {
        alchemy.alternateParticles = account?.accountOptions?.[135];
      }
    }
    if (Object.keys(alchemy).length > 0) {
      alerts.alchemy = alchemy;
    }
  }
  if (fields?.islands?.checked) {
    const islands = {};
    if (options?.islands?.unclaimedDays?.checked && account?.islands?.numberOfDaysAfk >= options?.islands?.unclaimedDays?.props?.value) {
      islands.unclaimedDays = account?.islands?.numberOfDaysAfk;
    }
    if (options?.islands?.shimmerIsland?.checked && account?.accountOptions?.[182] === 0) {
      islands.shimmerIsland = account?.accountOptions?.[182] === 0;
    }
    const trashIsland = getIsland(account, 'Trash');
    if (options?.islands?.garbageUpgrade?.checked && trashIsland?.trash >= trashIsland?.shop?.[4]?.cost) {
      islands.garbageUpgrade = true;
    }
    if (Object.keys(islands).length > 0) {
      alerts.islands = islands;
    }
  }
  if (fields?.postOffice?.checked) {
    const { showAlertOnlyWhen0Shields, postOffice: postOfficeOption, dailyShipments } = options?.postOffice;
    const postOffice = {};
    if (postOfficeOption?.checked) {
      const shipments = account?.postOfficeShipments?.filter(({ streak }, index) => {
        return postOfficeOption?.props?.value?.[index + 1] && streak <= 0
      });
      if (shipments.length > 0) {
        postOffice.shipments = shipments;
      }
    }
    if (dailyShipments?.checked) {
      const uncompletedDailyShipments = account?.postOfficeShipments?.filter(({ shields, completedAnOrder }, index) => {
        return (showAlertOnlyWhen0Shields?.checked
          ? shields === 0
          : true) && dailyShipments?.props?.value?.[index + 1] && !completedAnOrder
      });
      if (uncompletedDailyShipments?.length > 0) {
        postOffice.dailyShipments = uncompletedDailyShipments;
      }
    }
    if (Object.keys(postOffice).length > 0) {
      alerts.postOffice = postOffice;
    }
  }
  if (fields?.arcade?.checked) {
    const arcade = {};
    if (options?.arcade?.balls?.checked) {
      const ballsToClaim = Math.floor(Math.min(account?.timeAway?.GlobalTime - account?.timeAway?.Arcade, getMaxClaimTime(account))
        / Math.max(getSecPerBall(account), 1800));
      const percent = 5 * account?.arcade?.maxBalls / 100;
      const balls = ballsToClaim >= account?.arcade?.maxBalls - percent;
      if (balls) {
        arcade.balls = balls;
      }
    }
    if (Object.keys(arcade).length > 0) {
      alerts.arcade = arcade;
    }
  }
  if (fields?.weeklyBosses?.checked && account?.accountOptions?.[190] === 0) {
    alerts.weeklyBosses = account?.accountOptions?.[190] === 0;
  }
  if (fields?.killRoy?.checked) {
    const killroy = {};
    if (options?.killRoy?.general?.checked && (account?.accountOptions?.[113] === 0 || (account?.accountOptions?.[113] < (account?.killroy?.rooms === 3 ? 321 : 21) && account?.finishedWorlds?.World3))) {
      killroy.general = true;
    }
    if (options?.killRoy?.underHundredKills?.checked) {
      const schedule = getKillroySchedule(account, characters, account?.serverVars)?.[0];
      const under100 = schedule?.monsters?.filter((m) => {
        const info = account?.killroy?.list?.find((x) => x?.name === m?.Name);
        const kills = info?.killRoyKills ?? 0;
        return kills < 100;
      });
      if (under100?.length > 0) {
        killroy.underHundredKills = under100;
      }
    }

    if (Object.keys(killroy).length > 0) {
      alerts.killRoy = killroy;
    }
  }

  if (fields?.kangaroo?.checked && account?.accountOptions?.[267] > 0) {
    const kangaroo = {};
    if (options?.kangaroo?.shinyThreshold?.checked && account?.kangaroo?.shinyProgress > options?.kangaroo?.shinyThreshold?.props?.value) {
      kangaroo.shinyThreshold = options?.kangaroo?.shinyThreshold?.props?.value;
    }
    const fisherooReset = account?.kangaroo?.upgrades?.find(({
      unlocked,
      name
    }) => name === 'Fisheroo_Reset' && unlocked);
    if (options?.kangaroo?.fisherooReset?.checked && fisherooReset && account?.kangaroo?.fish >= fisherooReset?.cost) {
      kangaroo.fisherooReset = true;
    }
    const greatestCatch = account?.kangaroo?.upgrades?.find(({
      unlocked,
      name
    }) => name === 'Greatest_Catch' && unlocked);
    if (options?.kangaroo?.greatestCatch?.checked && greatestCatch && account?.kangaroo?.fish >= greatestCatch?.cost) {
      kangaroo.greatestCatch = true;
    }
    if (Object.keys(kangaroo).length > 0) {
      alerts.kangaroo = kangaroo;
    }
  }
  return alerts;
};
export const getWorld3Alerts = (account, fields, options) => {
  const alerts = {};
  if (!account?.finishedWorlds?.World2) return alerts;
  if (fields?.printer?.checked) {
    const printer = {};
    const {
      includeResource,
      showAlertWhenFull
    } = options?.printer || {};
    const totals = calcTotals(account, showAlertWhenFull);
    const exclusions = [
      'atom',
      ...Object.keys(includeResource?.props?.value).filter(key => !includeResource?.props?.value[key])
    ].toSimpleObject();
    const atoms = Object.entries(totals || {}).filter(([itemName, { atoms }]) => !exclusions?.[itemName] && atoms).map(([name, data]) => ({
      name: items?.[name]?.displayName,
      rawName: name,
      ...data
    }));
    if (atoms.length > 0) {
      printer.atoms = atoms;
    }
    if (Object.keys(printer).length > 0) {
      alerts.printer = printer;
    }
  }
  if (fields?.construction?.checked) {
    const construction = {};
    const { materials, rankUp, flags, buildings } = options?.construction || {};
    if (flags?.checked) {
      const flags = account?.construction?.board?.filter(({
        flagPlaced,
        currentAmount,
        requiredAmount
      }) => flagPlaced && currentAmount === requiredAmount);
      if (flags.length > 0) {
        construction.flags = flags
      }
    }
    if (buildings?.checked) {
      const buildings = account?.towers?.data?.filter((tower) => {
        const cost = getBuildCost(account?.towers, tower?.level, tower?.bonusInc, tower?.index);
        return tower?.progress >= cost;
      });
      if (buildings.length > 0) {
        construction.buildings = buildings
      }
    }
    if (materials?.checked) {
      const materials = account?.refinery?.salts?.reduce((res, { rank, cost, rawName }, saltIndex) => {
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
      if (materials.length > 0) {
        construction.materials = materials
      }
    }
    if (rankUp?.checked) {
      const rankUp = account?.refinery?.salts?.filter(({ refined, powerCap, rank }) => {
        const powerPerCycle = Math.floor(Math.pow(rank, 1.3)) - 1;
        return refined >= powerCap - powerPerCycle;
      });
      if (rankUp.length > 0) {
        construction.rankUp = rankUp
      }
    }
    if (Object.keys(construction).length > 0) {
      alerts.construction = construction;
    }
  }
  if (fields?.equinox?.checked) {
    const equinox = account?.equinox;
    const foodLustUpgrade = equinox?.upgrades[9];
    const { bar, challenges, foodLust } = options?.equinox;
    const equinoxAlerts = {};

    if (bar?.checked) {
      const isFull = equinox?.currentCharge >= equinox?.chargeRequired && equinox?.upgrades.filter(upgrade => upgrade.unlocked).some(upgrade => upgrade.lvl < upgrade.maxLvl);
      if (isFull) {
        equinoxAlerts.bar = isFull;
      }
    }
    if (challenges?.checked) {
      const hasChallenges = equinox?.challenges.filter(challenge => challenge.active && challenge.current >= challenge.goal)?.length;
      if (hasChallenges > 0) {
        equinoxAlerts.challenges = hasChallenges;
      }
    }
    ``
    if (foodLust?.checked) {
      const hasFoodLust = foodLustUpgrade?.lvl > 0 && foodLustUpgrade?.bonus >= foodLustUpgrade?.lvl;
      if (hasFoodLust) {
        equinoxAlerts.foodLust = hasFoodLust;
      }
    }
    if (Object.keys(equinoxAlerts).length > 0) {
      alerts.equinox = equinoxAlerts;
    }
  }
  if (fields?.atomCollider?.checked) {
    const atomCollider = {};
    const stampReducer = account?.atoms?.stampReducer >= options?.atomCollider?.stampReducer?.props?.value;
    const stampReducerValue = options?.atomCollider?.stampReducer?.props?.value;
    if (stampReducer) {
      atomCollider.stampReducer = stampReducer;
      atomCollider.stampReducerValue = stampReducerValue;
    }
    if (Object.keys(atomCollider).length > 0) {
      alerts.atomCollider = atomCollider;
    }
  }
  if (fields?.library?.checked) {
    const library = {};
    const { books } = options?.library || {};
    if (books?.checked && account?.libraryTimes?.bookCount >= 20) {
      library.books = account?.libraryTimes?.bookCount;
    }
    if (Object.keys(library).length > 0) {
      alerts.library = library;
    }
  }
  if (fields?.traps?.checked) {
    const traps = {};
    const { trapsOverdue } = options?.traps || {};
    const isTrapOverdue = account?.traps?.flat().filter((slot) => isPast(slot?.timeLeft)).length;
    if (trapsOverdue?.checked && isTrapOverdue) {
      traps.overdue = isTrapOverdue;
    }
    if (Object.keys(traps).length > 0) {
      alerts.traps = traps;
    }
  }
  return alerts;
};
export const getWorld4Alerts = (account, fields, options) => {
  const alerts = {};
  if (!account?.finishedWorlds?.World3) return alerts;
  if (fields?.breeding?.checked) {
    const breeding = {};
    const { shinies, eggs, eggsRarity, breedability } = options?.breeding || {};
    if (shinies?.checked) {
      const list = account?.breeding?.pets?.reduce((res, world) => {
        const pets = world?.filter(({
          monsterRawName,
          shinyLevel
        }) => account?.breeding?.fencePetsObject?.[monsterRawName]?.shiny > 0 && shinyLevel >= shinies?.props?.value);
        return [...res, ...pets];
      }, [])
      const shiniesObj = { pets: list, threshold: shinies?.props?.value }
      if (list.length > 0) {
        breeding.shinies = shiniesObj;
      }
    }
    if (breedability?.checked) {
      const list = account?.breeding?.pets?.reduce((res, world) => {
        const pets = world?.filter(({
          monsterRawName,
          breedingLevel
        }) => account?.breeding?.fencePetsObject?.[monsterRawName]?.breedability > 0 && breedingLevel >= breedability?.props?.value);
        return [...res, ...pets];
      }, [])
      const shiniesObj = { pets: list, threshold: breedability?.props?.value }
      if (list.length > 0) {
        breeding.breedability = shiniesObj;
      }
    }
    if (eggs?.checked) {
      const eggsAvailable = account?.breeding?.eggs.slice(0, 15).every((eggLv) => eggLv > 0);
      if (eggsAvailable) {
        breeding.eggs = eggsAvailable
      }
    }
    if (eggsRarity?.checked) {
      const hasRarity = account?.breeding?.eggs?.some((rarity) => parseInt(eggsRarity?.props?.value) <= rarity);
      if (hasRarity) {
        breeding.eggsRarity = parseInt(eggsRarity?.props?.value) > 9 ? 9 : eggsRarity?.props?.value;
      }
    }
    if (Object.keys(breeding).length > 0) {
      alerts.breeding = breeding;
    }
  }
  if (fields?.cooking?.checked) {
    const cooking = {};
    if (options?.cooking?.meals?.checked) {
      const cookedMeals = account?.cooking?.kitchens.reduce((cookedMeals, { meal }) => ({
        ...cookedMeals,
        [meal.name]: true
      }), {});
      const readyMeals = account?.cooking?.meals?.filter(({
        name,
        levelCost,
        amount,
        level
      }) => {
        if (options?.cooking?.alertOnlyCookedMeal?.checked && !cookedMeals?.[name]) return false;
        return amount >= levelCost && level < account?.cooking?.mealMaxLevel;
      });
      if (readyMeals?.length > 0) {
        cooking.meals = readyMeals;
      }
    }
    if (options?.cooking?.spices?.checked) {
      const spices = maxNumberOfSpiceClicks - account?.cooking?.spices?.numberOfClaims;
      if (spices > 0) {
        cooking.spices = spices;
      }
    }
    if (options?.cooking?.ribbons?.checked) {
      const threshold = options?.cooking?.ribbons?.props?.value;
      const emptySlots = account?.grimoire?.ribbons?.slice(0, 28)?.filter((ribbon) => !ribbon);
      if (emptySlots?.length <= threshold) {
        cooking.ribbons = emptySlots?.length;
      }
    }
    if (Object.keys(cooking).length > 0) {
      alerts.cooking = cooking;
    }
  }
  if (fields?.laboratory?.checked) {
    const laboratory = {};
    let labRotation = getChipsAndJewels(account, 1)?.at(0)?.items || [];
    labRotation = labRotation?.map((rotationItem, ind) => ({
      ...rotationItem,
      claimed: rotationItem?.index === account?.lab?.currentRotation?.[ind],
      requirementsMet: rotationItem?.requirements?.reduce((res, item) => {
        return res && (getRequirementAmount(item?.name, item?.rawName, account) > item?.amount)
      }, true)
    }));
    const chips = labRotation.slice(0, 2);
    const jewels = labRotation.slice(2);
    if (options?.laboratory?.chipsRotation?.checked && chips.some(({
      claimed,
      requirementsMet
    }) => !claimed && requirementsMet)) {
      laboratory.chipsRotation = chips;
    }
    if (options?.laboratory?.jewelsRotation?.checked && jewels.some(({
      claimed,
      requirementsMet,
      acquired
    }) => !claimed && !acquired && requirementsMet)) {
      laboratory.jewelsRotation = jewels;
    }
    if (Object.keys(laboratory).length > 0) {
      alerts.laboratory = laboratory;
    }
  }
  return alerts;
};
export const getWorld5Alerts = (account, fields, options) => {
  const alerts = {};
  if (!account?.finishedWorlds?.World4) return alerts;
  if (fields?.gaming?.checked) {
    const gaming = {};
    const { shovel, sprouts, squirrel } = options?.gaming || {};
    if (sprouts?.checked && account?.gaming?.availableSprouts >= account?.gaming?.sproutsCapacity) {
      gaming.sprouts = account?.gaming?.availableSprouts;
    }
    if (sprouts?.checked && account?.gaming?.availableDrops >= account?.gaming?.sproutsCapacity) {
      gaming.drops = account?.gaming?.availableDrops;
    }
    const shovelUnlocked = account?.gaming?.imports?.find(({ name, acquired }) => name === 'Dirty_Shovel' && acquired);
    if (shovel?.checked && shovelUnlocked && shovel && account?.gaming?.lastShovelClicked >= 0) {
      const timePassed = new Date().getTime() - account?.gaming?.lastShovelClicked * 1000;
      const hours = totalHoursBetweenDates(new Date().getTime(), timePassed);
      if (hours >= shovel?.props?.value) {
        gaming.shovel = totalHoursBetweenDates(new Date().getTime(), timePassed);
      }
    }
    const squirrelUnlocked = account?.gaming?.imports?.find(({
      name,
      acquired
    }) => name === 'Autumn_Squirrel' && acquired)
    if (squirrel?.checked && squirrelUnlocked && squirrel && account?.gaming?.lastAcornClicked >= 0) {
      const timePassed = new Date().getTime() - account?.gaming?.lastAcornClicked * 1000;
      const hours = totalHoursBetweenDates(new Date().getTime(), timePassed);
      if (hours >= squirrel?.props?.value) {
        gaming.squirrel = totalHoursBetweenDates(new Date().getTime(), timePassed);
      }
    }
    if (Object.keys(gaming).length > 0) {
      alerts.gaming = gaming;
    }
  }
  if (fields?.sailing?.checked) {
    const sailing = {};
    const { captains, chests } = options?.sailing || {};
    if (captains?.checked) {
      const { captains, shopCaptains } = account?.sailing || {};
      const allSlotsEnder = captains?.length > 0 && captains?.every((c) => c?.captainType === 6);
      const relevantCaptains = shopCaptains?.reduce((res, shopCaption) => {
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
        if ((matches?.length > 0 && captainType !== -1) || (captainType === 6 && (!allSlotsEnder || matches?.length > 0))) {
          const isSameValue = firstBonusIndex === secondBonusIndex;
          const temp = {
            captain: shopCaption,
            isSameValue,
            enderCaptain: captainType === 6,
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
      if (relevantCaptains.length > 0) {
        sailing.captains = relevantCaptains;
      }
    }
    if (chests?.checked) {
      const sailingTime = 259200 < account?.accountOptions?.[124]
        ? Math.floor(account?.accountOptions?.[124] / 8640) / 10
        : Math.floor(account?.accountOptions?.[124] / 3600);
      const { maxChests, timeToFullChests } = account?.sailing;
      const { hours } = getDuration(new Date().getTime(), timeToFullChests);
      const availableChests = sailingTime > hours && maxChests > 0;
      if (availableChests > 0) {
        sailing.chests = availableChests;
      }
    }
    if (Object.keys(sailing).length > 0) {
      alerts.sailing = sailing;
    }
  }
  if (fields?.hole?.checked) {
    const hole = {};
    if (!account?.finishedWorlds?.World4) return alerts;
    const {
      buckets,
      motherlode,
      bravery,
      justice,
      wisdom,
      theBell,
      theHarp,
      theHive,
      grotto,
      villagersLevelUp,
      jars,
      studyLevelUp
    } = options?.hole || {};
    const expandWhenFull = account?.hole?.caverns?.theWell?.expandWhenFull;
    const [, ...restSediments] = account?.hole?.caverns?.theWell?.sediments;
    const anySedimentFull = restSediments?.filter(({
      current,
      max
    }) => current >= 0 && current >= (buckets?.props?.value || max));
    const brokenLayersToday = account?.accountOptions?.[318];
    if (buckets?.checked && !expandWhenFull && anySedimentFull.length > 0) {
      hole.buckets = true;
    }
    const isMaxedOres = account?.hole?.caverns?.motherlode?.ores?.maxed;
    if (motherlode?.checked && brokenLayersToday < 5 && isMaxedOres) {
      hole.motherlodeMaxed = isMaxedOres;
    }
    const isMaxedBugs = account?.hole?.caverns?.theHive?.bugs?.maxed;
    if (theHive?.checked && brokenLayersToday < 5 && isMaxedBugs) {
      hole.hiveMaxed = isMaxedBugs;
    }
    if (bravery?.checked && account?.hole?.caverns?.bravery?.rewardMulti >= bravery?.props?.value) {
      hole.bravery = true;
    }
    if (justice?.checked && account?.hole?.caverns?.justice?.rewardMulti >= justice?.props?.value) {
      hole.justice = true;
    }
    if (wisdom?.checked && account?.hole?.caverns?.wisdom?.rewardMulti >= wisdom?.props?.value) {
      hole.wisdom = true;
    }
    const readyBells = account?.hole?.caverns?.theBell?.bells?.filter(({ exp, expReq }) => exp >= expReq);
    if (theBell?.checked && readyBells?.length > 0) {
      hole.theWell = true;
    }
    const powerThresholdReached = account?.hole?.caverns?.theHarp?.power >= theHarp?.props?.value;
    if (theHarp?.checked && powerThresholdReached) {
      hole.theHarp = powerThresholdReached;
    }
    if (grotto?.checked && account?.hole?.caverns?.grotto?.mushroomKillsLeft <= 0) {
      hole.grotto = true;
    }
    const readyToLevelVillagers = account?.hole?.villagers?.filter(({ readyToLevel }) => readyToLevel);
    if (villagersLevelUp?.checked && readyToLevelVillagers.length > 0) {
      hole.villagersLevelUp = readyToLevelVillagers;
    }
    if (jars?.checked && account?.hole?.caverns?.theJars?.totalJars >= jars?.props?.value) {
      hole.jars = account?.hole?.caverns?.theJars?.totalJars;
    }

    const readyToLevelStudy = account?.hole?.studies?.studies?.filter(({ readyToLevel }) => readyToLevel);
    if (studyLevelUp?.checked && readyToLevelStudy.length > 0) {
      hole.studyLevelUp = readyToLevelStudy;
    }
    if (Object.keys(hole).length > 0) {
      alerts.hole = hole;
    }
  }
  return alerts;
};
export const getWorld6Alerts = (account, fields, options) => {
  const alerts = {};
  if (!account?.finishedWorlds?.World5) return alerts;
  if (fields?.sneaking?.checked) {
    const sneaking = {};
    const { lastLooted } = options?.sneaking || {};
    const minutesSinceLooted = account?.sneaking?.lastLooted / 60;
    if (minutesSinceLooted >= lastLooted?.props?.value) {
      sneaking.lastLooted = true;
    }
    if (Object.keys(sneaking).length > 0) {
      alerts.sneaking = sneaking;
    }
  }
  if (fields?.farming?.checked) {
    const farming = {};
    const { plots, totalCrops, missingPlots, beanTrade } = options?.farming || {};
    if (plots?.checked) {
      const availablePots = account?.farming?.plot?.filter(({ currentOG }) => plots?.props?.value > 0
        ? currentOG >= plots?.props?.value
        : currentOG > 0).map((plot) => ({ ...plot, threshold: plots?.props?.value }));
      if (availablePots.length > 0) {
        farming.plots = availablePots;
      }
    }
    if (totalCrops?.checked) {
      const totalCropsLocal = account?.farming?.plot?.reduce((sum, {
        cropQuantity,
        ogMulti,
        rank
      }) => {
        const { productDoubler } = getProductDoubler(account?.farming?.market);
        const productionBoost = getLandRank(account?.farming?.ranks, 1);
        const finalMulti = Math.min(100, Math.round(Math.max(1, Math.floor(1 + (productDoubler / 100)))
          * (1 + getRanksTotalBonus(account?.farming?.ranks, 1) / 100)
          * (1 + productionBoost * (rank ?? 0) / 100)));
        return sum + (cropQuantity * ogMulti * finalMulti);
      }, 0);
      const availableCrops = totalCropsLocal >= totalCrops?.props?.value ? totalCropsLocal : 0;
      if (availableCrops > 0) {
        farming.totalCrops = availableCrops;
      }
    }
    if (missingPlots?.checked) {
      const missingPlotsLocal = account?.farming?.plot?.filter(({ seedType }) => seedType === -1);
      if (missingPlotsLocal?.length > 0) {
        farming.missingPlots = missingPlotsLocal;
      }
    }
    if (beanTrade?.checked) {
      if (account?.farming?.beanTrade >= beanTrade?.props?.value) {
        farming.beanTrade = account?.farming?.beanTrade;
      }
    }
    if (Object.keys(farming).length > 0) {
      alerts.farming = farming;
    }
  }
  if (fields?.summoning?.checked) {
    const summoning = {};
    const { familiar, battleAttempts } = options?.summoning;
    const { level, maxLvl } = account?.summoning?.upgrades?.[0]?.[2] || {};
    if (familiar?.checked && level < maxLvl && level < familiar?.props?.value) {
      summoning.familiar = { level, maxLvl };
    }
    const { summoningStuff } = account?.summoning;
    if (battleAttempts?.checked && summoningStuff?.[0] > 0) {
      summoning.battleAttempts = summoningStuff?.[0];
    }
    if (Object.keys(summoning).length > 0) {
      alerts.summoning = summoning;
    }
  }
  if (fields?.etc?.checked) {
    const etc = {};
    const { emperor } = options?.etc;
    if (emperor?.checked && account?.emperor?.attempts >= emperor?.props?.value) {
      etc.emperorAttempts = account?.emperor?.attempts;
    }
    if (Object.keys(etc).length > 0) {
      alerts.etc = etc;
    }
  }
  return alerts;
};

export const getWorld7Alerts = (account, fields, options) => {
  const alerts = {};
  if (!account?.finishedWorlds?.World6) return alerts;
  // Placeholder: add World 7 systems when defined
  return alerts;
};
export const areKeysOverdue = (account) => {
  const keys = account?.currencies?.KeysAll;
  const tickets = account?.currencies?.ColosseumTickets?.allTickets;

  const keysAlerts = keys?.filter(({ daysSincePickup, totalAmount }) => {
    return daysSincePickup >= 3 && totalAmount > 0;
  })
  const ticketsAlerts = tickets?.filter(({ daysSincePickup }, index) => {
    return (index === 0 || account?.finishedWorlds?.[`World${index}`]) && daysSincePickup >= 3;
  });
  return [...(keysAlerts || []), ...(ticketsAlerts || [])];
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