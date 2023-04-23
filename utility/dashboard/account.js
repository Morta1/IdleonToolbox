import { getMaxClaimTime, getSecPerBall } from "../../parsers/dungeons";
import { getBuildCost } from "../../parsers/construction";
import { vialCostsArray } from "../../parsers/alchemy";
import { maxNumberOfSpiceClicks } from "../../parsers/cooking";
import { getDuration } from "../helpers";
import { isWorldFinished } from "../../parsers/quests";

export const isBallsOverdue = (account) => {
  if (!isWorldFinished(account?.npcDialog, 1)) return false;
  const ballsToClaim = Math.floor(Math.min(account?.timeAway?.GlobalTime - account?.timeAway?.Arcade, getMaxClaimTime(account?.stamps))
    / Math.max(getSecPerBall(account), 1800));
  return ballsToClaim >= account?.arcade?.maxBalls
}

export const areSigilsOverdue = (account) => {
  if (!isWorldFinished(account?.npcDialog, 1)) return false;
  return account?.alchemy?.p2w?.sigils?.filter(({ characters, unlocked }) => characters.length > 0 && unlocked === 1)
}

export const refineryAlerts = (account, trackersOptions) => {
  if (!isWorldFinished(account?.npcDialog, 2)) return false;
  const { materials, rankUp } = trackersOptions || {};
  const alerts = {};
  if (materials) {
    alerts.materials = account?.refinery?.salts?.reduce((res, { rank, cost, rawName }, saltIndex) => {
      const missingMats = cost?.filter(({
                                          rawName,
                                          quantity,
                                          totalAmount
                                        }) => totalAmount < Math.floor(Math.pow(rank, (rawName?.includes('Refinery') && saltIndex <= account?.refinery?.refinerySaltTaskLevel) ? 1.3 : 1.5)) * quantity)
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
  if (!isWorldFinished(account?.npcDialog, 2)) return false;
  return account?.atoms?.stampReducer >= 90;
}

export const areTowersOverdue = (account) => {
  if (!isWorldFinished(account?.npcDialog, 2)) return false;
  return account?.towers?.data?.filter((tower) => {
    const cost = getBuildCost(account?.towers, tower?.level, tower?.bonusInc, tower?.index);
    return tower?.progress >= cost;
  })
}

export const areKeysOverdue = (account) => {
  const keys = account?.currencies?.KeysAll;
  return keys?.filter(({ daysSincePickup }) => {
    return daysSincePickup >= 3;
  })
}

export const areVialsReady = (account, trackersOptions) => {
  if (!isWorldFinished(account?.npcDialog, 1)) return false;
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
  if (!isWorldFinished(account?.npcDialog, 3)) return false;
  return maxNumberOfSpiceClicks - account?.cooking?.spices?.numberOfClaims;
}

export const canKillBosses = (account) => {
  const maxedMiniBosses = [];
  const daysSinceSlush = account?.accountOptions?.[96];
  const daysSinceMush = account?.accountOptions?.[98];
  if (daysSinceSlush > 3 && isWorldFinished(account?.npcDialog, 3)) {
    const currentCount = Math.min(10, Math.floor(Math.pow(daysSinceSlush - 3, .55)));
    if (currentCount > 0) maxedMiniBosses.push({ rawName: 'mini3b', name: 'Dilapidated_Slush', currentCount });
  }
  if (daysSinceMush > 3 && isWorldFinished(account?.npcDialog, 2)) {
    const currentCount = Math.min(8, Math.floor(Math.pow(daysSinceMush - 3, .5)));
    if (currentCount > 0) maxedMiniBosses.push({ rawName: 'mini4b', name: 'Mutated_Mush', currentCount });
  }
  return maxedMiniBosses.length > 0 ? maxedMiniBosses : null;
}

export const zeroBargainTag = (account) => {
  if (!isWorldFinished(account?.npcDialog, 1)) return false;
  return account?.accountOptions?.[62] === 0;
}

export const gamingAlerts = (account, trackersOptions) => {
  if (!isWorldFinished(account?.npcDialog, 4)) return false;
  const { sprouts, squirrel, shovel } = trackersOptions;
  const alerts = {}
  if (sprouts && account?.gaming?.availableSprouts >= account?.gaming?.sproutsCapacity) {
    alerts.maxSprouts = account?.gaming?.availableSprouts;
  }
  if (sprouts && account?.gaming?.availableDrops >= account?.gaming?.sproutsCapacity) {
    alerts.drops = account?.gaming?.availableDrops;
  }
  const shovelUnlocked = account?.gaming?.imports?.find(({ name, acquired }) => name === 'Dirty_Shovel' && acquired)
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