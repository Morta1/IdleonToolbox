import { getMaxClaimTime, getSecPerBall } from "../../parsers/dungeons";
import { getBuildCost } from "../../parsers/construction";
import { vialCostsArray } from "../../parsers/alchemy";
import { maxNumberOfSpiceClicks } from "../../parsers/cooking";
import { getDuration } from "../helpers";
import { isRiftBonusUnlocked } from "../../parsers/world-4/rift";
import { items, liquidsShop } from "../../data/website-data";
import { hasMissingMats } from "../../parsers/refinery";
import { calcTotals } from "../../parsers/printer";

export const isBallsOverdue = (account) => {
  if (!account?.finishedWorlds?.World1) return false;
  const ballsToClaim = Math.floor(Math.min(account?.timeAway?.GlobalTime - account?.timeAway?.Arcade, getMaxClaimTime(account?.stamps))
    / Math.max(getSecPerBall(account), 1800));
  return ballsToClaim >= account?.arcade?.maxBalls
}

export const alchemyAlerts = (account, trackersOptions) => {
  if (!account?.finishedWorlds?.World1) return false;
  const { input } = trackersOptions || {};
  const alerts = {}
  if (input) {
    const liquidsProgress = account?.alchemy?.liquids;
    const percentage = input?.value / 100;
    alerts.liquids = account?.alchemy?.liquidCauldrons?.map((maxLiquid, index) => ({
      current: liquidsProgress?.[index],
      max: maxLiquid,
      index
    })).filter(({ current, max }) => max && current >= max * percentage - 5);
  }
  return alerts
}

export const areSigilsOverdue = (account) => {
  if (!account?.finishedWorlds?.World1) return false;
  return account?.alchemy?.p2w?.sigils?.filter(({
                                                  characters,
                                                  progress,
                                                  boostCost
                                                }) => characters.length > 0 && progress >= boostCost);
}

export const refineryAlerts = (account, trackersOptions) => {
  if (!account?.finishedWorlds?.World2) return false;
  const { materials, rankUp } = trackersOptions || {};
  const alerts = {};
  if (materials) {
    alerts.materials = account?.refinery?.salts?.reduce((res, { rank, cost, rawName }, saltIndex) => {
      const previousSaltIndex = saltIndex > 0 ? saltIndex - 1 : null;
      const previousSalt = account?.refinery?.salts?.[previousSaltIndex];
      const missingMats = hasMissingMats(saltIndex, rank, cost, account);
      const previousSaltMissingMats = hasMissingMats(previousSaltIndex, previousSalt?.rank, previousSalt?.cost, account);

      if (missingMats.length === 1 && missingMats?.[0]?.rawName?.includes('Refinery')
        || previousSalt?.autoRefinePercentage > 0
        || previousSaltMissingMats?.active && previousSaltMissingMats?.length > 0) {
        return res;
      }
      if (missingMats.length > 0) {
        res = [...res, { rawName, missingMats }]
      }
      return res;
    }, []);
  }
  if (rankUp) {
    alerts.rankUp = account?.refinery?.salts?.filter(({ refined, powerCap }) => refined >= powerCap);
  }
  return alerts;
}

export const isStampReducerMaxed = (account) => {
  if (!account?.finishedWorlds?.World2) return false;
  return account?.atoms?.stampReducer >= 90;
}
export const riftAlerts = (account) => {
  if (!account?.finishedWorlds?.World3 || !isRiftBonusUnlocked(account?.rift, 'Stamp_Mastery')) return false;
  return {
    gildedStamps: account?.accountOptions?.[154]
  }
}

export const areTowersOverdue = (account) => {
  if (!account?.finishedWorlds?.World2) return false;
  return account?.towers?.data?.filter((tower) => {
    const cost = getBuildCost(account?.towers, tower?.level, tower?.bonusInc, tower?.index);
    return tower?.progress >= cost;
  })
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
  return [...keysAlerts, ...ticketsAlerts];
}

export const areVialsReady = (account, trackersOptions) => {
  if (!account?.finishedWorlds?.World1) return false;
  const { subtractGreenStacks } = trackersOptions || {};
  return account?.alchemy?.vials?.filter(({ level, itemReq }) => {
    const cost = vialCostsArray?.[level];
    let storageQuantity = account?.storage?.find(({ name }) => name === itemReq?.[0]?.name)?.amount || 0;
    if (subtractGreenStacks) {
      storageQuantity -= 1e7;
    }
    const liquidIndex = parseInt(itemReq?.[1]?.name.split('\d')?.[1] || 0);
    const liquidQuantity = account?.alchemy?.liquids?.[liquidIndex - 1];
    const liquidCost = 3 * level;
    return storageQuantity > cost && liquidQuantity > liquidCost;
  });
}

export const hasAvailableSpiceClicks = (account) => {
  if (!account?.finishedWorlds?.World3) return false;
  return maxNumberOfSpiceClicks - account?.cooking?.spices?.numberOfClaims;
}

export const canKillBosses = (account) => {
  const maxedMiniBosses = [];
  const daysSinceSlush = account?.accountOptions?.[96];
  const daysSinceMush = account?.accountOptions?.[98];
  if (daysSinceSlush > 3 && account?.finishedWorlds?.World3) {
    const currentCount = Math.min(10, Math.floor(Math.pow(daysSinceSlush - 3, .55)));
    if (currentCount > 0) maxedMiniBosses.push({ rawName: 'mini3b', name: 'Dilapidated_Slush', currentCount });
  }
  if (daysSinceMush > 3 && account?.finishedWorlds?.World2) {
    const currentCount = Math.min(8, Math.floor(Math.pow(daysSinceMush - 3, .5)));
    if (currentCount > 0) maxedMiniBosses.push({ rawName: 'mini4b', name: 'Mutated_Mush', currentCount });
  }
  return maxedMiniBosses.length > 0 ? maxedMiniBosses : null;
}

export const zeroBargainTag = (account) => {
  if (!account?.finishedWorlds?.World1) return false;
  const { x1, x2, index } = liquidsShop?.find(({ name }) => name === 'BARGAIN_TAG') || {};
  const math = Math.round(x1 * Math.pow(x2, account?.alchemy?.multiplierArray?.[index]));
  return math === 1;
}

export const zeroRandomEvents = (account) => {
  return account?.accountOptions?.[137] === 0;
}

export const gamingAlerts = (account, trackersOptions) => {
  if (!account?.finishedWorlds?.World4) return false;
  const { sprouts, squirrel, shovel } = trackersOptions;
  const alerts = {}
  if (sprouts && account?.gaming?.availableSprouts >= account?.gaming?.sproutsCapacity) {
    alerts.maxSprouts = account?.gaming?.availableSprouts;
  }
  if (sprouts && account?.gaming?.availableDrops >= account?.gaming?.sproutsCapacity) {
    alerts.drops = account?.gaming?.availableDrops;
  }
  const shovelUnlocked = account?.gaming?.imports?.find(({ name, acquired }) => name === 'Dirty_Shovel' && acquired);
  if (shovelUnlocked && shovel && account?.gaming?.lastShovelClicked > 0) {
    const timePassed = new Date().getTime() - account?.gaming?.lastShovelClicked * 1000;
    alerts.shovel = getDuration(new Date().getTime(), timePassed);
  }
  const squirrelUnlocked = account?.gaming?.imports?.find(({
                                                             name,
                                                             acquired
                                                           }) => name === 'Autumn_Squirrel' && acquired)
  if (squirrelUnlocked && squirrel && account?.gaming?.lastAcornClicked > 0) {
    const timePassed = new Date().getTime() - account?.gaming?.lastAcornClicked * 1000;
    alerts.squirrel = getDuration(new Date().getTime(), timePassed);
  }
  return alerts;
}

export const guildTasks = (account, trackersOptions) => {
  if (!account?.accountOptions?.[37]) return false;
  const { daily, weekly } = trackersOptions;
  const alerts = {};
  if (daily) {
    alerts.daily = account?.guild?.guildTasks?.daily?.filter(({
                                                                requirement,
                                                                progress
                                                              }) => progress < requirement)?.length;
  }
  if (weekly) {
    alerts.weekly = account?.guild?.guildTasks?.weekly?.filter(({
                                                                  requirement,
                                                                  progress
                                                                }) => progress < requirement)?.length;
  }
  return alerts;
}


export const sailingAlerts = (account, trackersOptions) => {
  if (!account?.finishedWorlds?.World4) return false;
  const { captains } = trackersOptions;
  const alerts = {}
  if (captains) {
    const { captains, shopCaptains } = account?.sailing || {}
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
        if (rCaptain?.firstBonusIndex === firstBonusIndex && rCaptain?.secondBonusIndex === secondBonusIndex) {
          return firstBonusValue > rCaptain?.firstBonusValue && secondBonusValue > rCaptain?.secondBonusValue;
        } else if (rCaptain?.secondBonusIndex === firstBonusIndex && rCaptain?.firstBonusIndex === secondBonusIndex) {
          return firstBonusValue > rCaptain?.secondBonusValue && secondBonusValue > rCaptain?.firstBonusValue;
        }
        return false
      });
      if (matches?.length > 0 && captainType !== -1) {
        return [...res, {
          captain: shopCaption,
          badCaptains: matches.map(({ captainIndex }) => captainIndex),
          bonuses: matches ? [firstBonusDescription.substring(firstBonusDescription.indexOf('%')),
            secondBonusDescription.substring(secondBonusDescription.indexOf('%'))] : []
        }]
      }
      return res;
    }, []);
  }
  return alerts;
}

export const hasItemsInShop = (account, trackersOptions) => {
  return account?.shopStock?.reduce((res, shop, index) => {
    if ((index === 2 || index === 3) && !account?.finishedWorlds?.World1) {
      return [...res, []];
    } else if (index === 4 && !account?.finishedWorlds?.World2) {
      return [...res, []];
    } else if (index === 5 && !account?.finishedWorlds?.World3) {
      return [...res, []];
    } else if (index === 6 && !account?.finishedWorlds?.World4) {
      return [...res, []];
    }
    const filtered = shop?.filter(({ rawName }) => trackersOptions?.[rawName])
    return [...res, filtered];
  }, []);
}

export const overflowingPrinter = (account, trackersOptions) => {
  const { includeOakAndCopper } = trackersOptions;
  const totals = calcTotals(account);
  const exclusions = ['atom', ...(!includeOakAndCopper ? ['Copper', 'OakTree'] : [])].toSimpleObject();
  return Object.entries(totals || {}).filter(([itemName, { atoms }]) => !exclusions?.[itemName] && atoms).map(([name, data]) => ({
    name: items?.[name]?.displayName,
    rawName: name,
    ...data
  }));
}

export const overflowingShinies = (account, trackersOptions) => {
  const { input } = trackersOptions || {};
  return account?.breeding?.pets?.reduce((res, world) => {
    const pets = world?.filter(({ monsterRawName, shinyLevel }) => account?.breeding?.fencePets?.[monsterRawName]
      && shinyLevel >= input?.value);
    return [...res, ...pets]
  }, [])
}

