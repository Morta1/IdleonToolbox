import { getMaxClaimTime, getSecPerBall } from "../../parsers/dungeons";
import { getBuildCost } from "../../parsers/construction";
import { vialCostsArray } from "../../parsers/alchemy";
import { maxNumberOfSpiceClicks } from "../../parsers/cooking";

export const isBallsOverdue = (account) => {
  const ballsToClaim = Math.floor(Math.min(account?.timeAway?.GlobalTime - account?.timeAway?.Arcade, getMaxClaimTime(account?.stamps))
    / Math.max(getSecPerBall(account), 1800));
  return ballsToClaim >= account?.arcade?.maxBalls
}

export const areSigilsOverdue = (account) => {
  return account?.alchemy?.p2w?.sigils?.filter(({ characters, unlocked }) => characters.length > 0 && unlocked === 1)
}

export const isRefineryEmpty = (account) => {
  return account?.refinery?.salts?.reduce((res, { rank, cost, rawName }, saltIndex) => {
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

export const isStampReducerMaxed = (account) => {
  return account?.atoms?.stampReducer >= 90;
}

export const areTowersOverdue = (account) => {
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
  return maxNumberOfSpiceClicks - account?.cooking?.spices?.numberOfClaims;
}

export const canKillBosses = (account) => {
  const maxedMiniBosses = [];
  const daysSinceSlush = account?.accountOptions?.[96];
  const daysSinceMush = account?.accountOptions?.[98];
  if (daysSinceSlush > 3) {
    const currentCount = Math.min(10, Math.floor(Math.pow(daysSinceSlush - 3, .55)));
    if (currentCount > 0) maxedMiniBosses.push({ rawName: 'mini3b', name: 'Dilapidated_Slush', currentCount });
  }
  if (daysSinceMush > 3) {
    const currentCount = Math.min(8, Math.floor(Math.pow(daysSinceMush - 3, .5)));
    if (currentCount > 0) maxedMiniBosses.push({ rawName: 'mini4b', name: 'Mutated_Mush', currentCount });
  }
  return maxedMiniBosses.length > 0 ? maxedMiniBosses : null;
}

export const zeroBargainTag = (account) => {
  return account?.accountOptions?.[62] === 0;
}